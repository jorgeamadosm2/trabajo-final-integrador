// ============================================
// CUERAR TUCUMÁN - JavaScript Principal
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    // ---- Menú Móvil ----
    const botonMenu = document.getElementById('botonMenu');
    const menuNav = document.getElementById('menuNav');

    if (botonMenu && menuNav) {
        botonMenu.addEventListener('click', () => {
            botonMenu.classList.toggle('activo');
            menuNav.classList.toggle('activo');
        });

        // Cerrar menú al hacer clic en un enlace
        menuNav.querySelectorAll('.encabezado__enlace-nav').forEach(enlace => {
            enlace.addEventListener('click', () => {
                botonMenu.classList.remove('activo');
                menuNav.classList.remove('activo');
            });
        });

        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!menuNav.contains(e.target) && !botonMenu.contains(e.target)) {
                botonMenu.classList.remove('activo');
                menuNav.classList.remove('activo');
            }
        });
    }

    // ---- Efecto de Scroll en Encabezado ----
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

    // ---- Animación de Aparición al Scroll ----
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
        rootMargin: '0px 0px -60px 0px'
    });

    elementosRevelar.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${i * 0.08}s, transform 0.6s ease ${i * 0.08}s`;
        observadorRevelar.observe(el);
    });

    // ---- Scroll Suave para enlaces ancla ----
    document.querySelectorAll('a[href^="#"]').forEach(ancla => {
        ancla.addEventListener('click', function (e) {
            e.preventDefault();
            const destino = document.querySelector(this.getAttribute('href'));
            if (destino) {
                destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ---- Filtro de Productos (Catálogo) con paginación por páginas ----
    // Los filtros se inicializan después de que productos-api.js cargue las cards
    function inicializarFiltros() {
        const filtros          = document.querySelectorAll('.catalogo__filtro');
        const todasLasTarjetas = Array.from(document.querySelectorAll('.catalogo__grilla .tarjeta-producto'));
        const resultado        = document.getElementById('catalogo__resultado');
        const contenedorPag   = document.getElementById('paginacion');

        if (filtros.length === 0 || todasLasTarjetas.length === 0) return;

        let tarjetasFiltradas = todasLasTarjetas;
        let paginaActual = 1;

        // Calcula cuántos productos entran en 2 filas según las columnas actuales de la grilla
        function calcularPorPagina() {
            const grilla = document.getElementById('grillaProductos');
            if (!grilla) return 8;
            const columnas = getComputedStyle(grilla).gridTemplateColumns.split(' ').length;
            return columnas * 2; // 2 filas
        }

        function actualizarVista() {
            const porPagina    = calcularPorPagina();
            const total        = tarjetasFiltradas.length;
            const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

            // Ajustar página si quedó fuera de rango tras un cambio de filtro
            if (paginaActual > totalPaginas) paginaActual = totalPaginas;

            const inicio = (paginaActual - 1) * porPagina;
            const fin    = inicio + porPagina;

            todasLasTarjetas.forEach(t => {
                const idx     = tarjetasFiltradas.indexOf(t);
                const visible = idx >= inicio && idx < fin;
                t.classList.toggle('oculto',  !visible);
                t.classList.toggle('mostrar',  visible);
            });

            if (resultado) {
                const mostrados = Math.min(fin, total) - inicio;
                resultado.innerHTML = `Mostrando <strong>${mostrados}</strong> de <strong>${total}</strong> producto${total !== 1 ? 's' : ''}`;
            }

            renderizarPaginacion(totalPaginas);
        }

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

        function scrollAlCatalogo() {
            document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

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

        // Recalcular al cambiar tamaño de pantalla (las columnas pueden cambiar)
        window.addEventListener('resize', actualizarVista);

        aplicarFiltro('todos');
    }

    document.addEventListener('productosListos', inicializarFiltros);
});
