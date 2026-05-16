document.addEventListener('DOMContentLoaded', () => {

    // ── Menú hamburguesa ──────────────────────────────────────────────────────
    // El menú mobile se abre y cierra con la clase "activo". También se cierra
    // al tocar un enlace o al hacer clic fuera para no dejarlo abierto accidentalmente.
    const botonMenu = document.getElementById('botonMenu');
    const menuNav = document.getElementById('menuNav');

    if (botonMenu && menuNav) {
        botonMenu.addEventListener('click', () => {
            botonMenu.classList.toggle('activo');
            menuNav.classList.toggle('activo');
        });

        // Cada enlace del nav cierra el menú al hacer click en mobile
        menuNav.querySelectorAll('.encabezado__enlace-nav').forEach(enlace => {
            enlace.addEventListener('click', () => {
                botonMenu.classList.remove('activo');
                menuNav.classList.remove('activo');
            });
        });

        // Click fuera del menú y del botón también lo cierra
        document.addEventListener('click', (e) => {
            if (!menuNav.contains(e.target) && !botonMenu.contains(e.target)) {
                botonMenu.classList.remove('activo');
                menuNav.classList.remove('activo');
            }
        });
    }

    // ── Sombra del encabezado al hacer scroll 
    // Le agrego sombra y oscurezco un poco el header cuando el usuario baja más de 80px.
    // Ese umbral lo elegí para que no cambie al primer movimiento sino cuando ya bajó un poco.
    const encabezado = document.getElementById('encabezado');
    if (encabezado) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 80) {
                encabezado.style.background = 'rgba(26, 18, 9, 0.98)';
                encabezado.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
            } else {
                encabezado.style.background = 'rgba(26, 18, 9, 0.92)';
                encabezado.style.boxShadow = 'none';
            }
        });
    }

    // ── Animación de aparición en scroll 
    // Uso IntersectionObserver para animar los elementos cuando entran al viewport.
    // El delay escalonado (i * 0.08s) crea un efecto de cascada entre las tarjetas.
    // Una vez que el elemento se animó, dejo de observarlo para no re-animar si sube.
    const elementosRevelar = document.querySelectorAll(
        '.tarjeta-beneficio, .tarjeta-categoria, .tarjeta-producto, .tarjeta-testimonio, .vista-nosotros__grilla, .encabezado-seccion'
    );

    const observadorRevelar = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observadorRevelar.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px' // el elemento tiene que entrar un poco más antes de activarse
    });

    elementosRevelar.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${i * 0.08}s, transform 0.6s ease ${i * 0.08}s`;
        observadorRevelar.observe(el);
    });

    // ── Scroll suave para enlaces ancla 
    document.querySelectorAll('a[href^="#"]').forEach(ancla => {
        ancla.addEventListener('click', function (e) {
            e.preventDefault();
            const destino = document.querySelector(this.getAttribute('href'));
            if (destino) {
                destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Filtros y paginación del catálogo 
    // Esta función espera a que productos-api.js termine de insertar las tarjetas
    function inicializarFiltros() {
        const filtros = document.querySelectorAll('.catalogo__filtro');
        const todasLasTarjetas = Array.from(document.querySelectorAll('.catalogo__grilla .tarjeta-producto'));
        const resultado = document.getElementById('catalogo__resultado');
        const contenedorPag = document.getElementById('paginacion');

        if (filtros.length === 0 || todasLasTarjetas.length === 0) return;

        let tarjetasFiltradas = todasLasTarjetas;
        let paginaActual = 1;

        // Calculo los items por página leyendo cuántas columnas tiene el grid en ese momento.
        // Así la paginación es automáticamente responsiva: 2 columnas = 4 por página, 4 = 8, etc.
        function calcularPorPagina() {
            const grilla = document.getElementById('grillaProductos');
            if (!grilla) return 8;
            const columnas = getComputedStyle(grilla).gridTemplateColumns.split(' ').length;
            return columnas * 2;
        }

        // Oculta todas las tarjetas que no corresponden a la página actual y muestra las que sí
        function actualizarVista() {
            const porPagina = calcularPorPagina();
            const total = tarjetasFiltradas.length;
            const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

            if (paginaActual > totalPaginas) paginaActual = totalPaginas;

            const inicio = (paginaActual - 1) * porPagina;
            const fin = inicio + porPagina;

            todasLasTarjetas.forEach(t => {
                const idx = tarjetasFiltradas.indexOf(t);
                const visible = idx >= inicio && idx < fin;
                t.classList.toggle('oculto', !visible);
                t.classList.toggle('mostrar', visible);
            });

            if (resultado) {
                const mostrados = Math.min(fin, total) - inicio;
                resultado.innerHTML = `Mostrando <strong>${mostrados}</strong> de <strong>${total}</strong> producto${total !== 1 ? 's' : ''}`;
            }

            renderizarPaginacion(totalPaginas);
        }

        // Genera los botones de página dinámicamente para que se adapten a la cantidad de resultados
        function renderizarPaginacion(totalPaginas) {
            if (!contenedorPag) return;
            if (totalPaginas <= 1) { contenedorPag.innerHTML = ''; return; }

            let html = `<button class="paginacion__btn paginacion__btn--nav" id="pag-anterior" ${paginaActual === 1 ? 'disabled' : ''}>&#8249;</button>`;
            for (let i = 1; i <= totalPaginas; i++) {
                html += `<button class="paginacion__btn${i === paginaActual ? ' paginacion__btn--activo' : ''}" data-pagina="${i}">${i}</button>`;
            }
            html += `<button class="paginacion__btn paginacion__btn--nav" id="pag-siguiente" ${paginaActual === totalPaginas ? 'disabled' : ''}>&#8250;</button>`;

            contenedorPag.innerHTML = html;

            contenedorPag.querySelector('#pag-anterior').addEventListener('click', () => {
                if (paginaActual > 1) { paginaActual--; actualizarVista(); scrollAlCatalogo(); }
            });
            contenedorPag.querySelector('#pag-siguiente').addEventListener('click', () => {
                if (paginaActual < totalPaginas) { paginaActual++; actualizarVista(); scrollAlCatalogo(); }
            });
            contenedorPag.querySelectorAll('[data-pagina]').forEach(btn => {
                btn.addEventListener('click', () => {
                    paginaActual = parseInt(btn.dataset.pagina);
                    actualizarVista();
                    scrollAlCatalogo();
                });
            });
        }

        // Al cambiar de página scrolleo al inicio del catálogo para que el usuario no quede
        // mirando el footer mientras los productos nuevos aparecen arriba
        function scrollAlCatalogo() {
            document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Al filtrar vuelvo a la página 1 porque la cantidad de resultados puede cambiar
        function aplicarFiltro(categoria) {
            tarjetasFiltradas = categoria === 'todos'
                ? todasLasTarjetas
                : todasLasTarjetas.filter(t => t.dataset.categoria === categoria);
            paginaActual = 1;
            actualizarVista();
        }

        filtros.forEach(botonFiltro => {
            botonFiltro.addEventListener('click', () => {
                filtros.forEach(f => f.classList.remove('activo'));
                botonFiltro.classList.add('activo');
                aplicarFiltro(botonFiltro.dataset.filtro);
            });
        });

        // Al redimensionar la ventana recalculo por si cambia la cantidad de columnas
        window.addEventListener('resize', actualizarVista);
        aplicarFiltro('todos');
    }

    // El evento "productosListos" lo dispara productos-api.js cuando termina de insertar el HTML.
    // Así garantizo que los filtros se inicialicen con las tarjetas ya en el DOM.
    document.addEventListener('productosListos', inicializarFiltros);
});
