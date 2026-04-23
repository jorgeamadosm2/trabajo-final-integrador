/**
 * main.js — Interacciones de UI y animaciones del sitio
 *
 * Este archivo maneja todo lo que es puramente visual/interactivo en el frontend:
 *   1. Menú hamburguesa (responsive mobile)
 *   2. Efecto de scroll en el encabezado
 *   3. Animaciones de aparición al hacer scroll (Intersection Observer)
 *   4. Scroll suave para enlaces ancla (#sección)
 *   5. Filtros de categoría + paginación del catálogo de productos
 *
 * IMPORTANTE: El filtro y la paginación escuchan el evento personalizado
 * "productosListos" que dispara productos-api.js cuando termina de insertar
 * las cards en el DOM. Esto asegura que las cards existan antes de aplicar
 * los filtros.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── Menú Hamburguesa (responsive mobile) ──────────────────────────────────
    // En pantallas pequeñas, el menú de navegación se colapsa en un ícono
    // de tres líneas (hamburguesa). Al hacer clic se muestra/oculta.
    const botonMenu = document.getElementById('botonMenu');
    const menuNav = document.getElementById('menuNav');

    if (botonMenu && menuNav) {
        // Toggle al hacer clic en el botón hamburguesa
        botonMenu.addEventListener('click', () => {
            botonMenu.classList.toggle('activo');
            menuNav.classList.toggle('activo');
        });

        // Cerrar el menú al hacer clic en un enlace (mejor UX en móvil)
        menuNav.querySelectorAll('.encabezado__enlace-nav').forEach(enlace => {
            enlace.addEventListener('click', () => {
                botonMenu.classList.remove('activo');
                menuNav.classList.remove('activo');
            });
        });

        // Cerrar el menú al hacer clic fuera de él
        document.addEventListener('click', (e) => {
            if (!menuNav.contains(e.target) && !botonMenu.contains(e.target)) {
                botonMenu.classList.remove('activo');
                menuNav.classList.remove('activo');
            }
        });
    }

    // ── Efecto de Scroll en el Encabezado ─────────────────────────────────────
    // Al bajar más de 80px se agrega una sombra al header para indicar profundidad
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

    // ── Animación de Aparición al Scroll (Intersection Observer) ──────────────
    // Los elementos comienzan invisibles (opacity:0, desplazados hacia abajo)
    // y aparecen suavemente cuando entran en el viewport del navegador.
    // IntersectionObserver es más eficiente que escuchar el evento scroll.
    const elementosRevelar = document.querySelectorAll(
        '.tarjeta-beneficio, .tarjeta-categoria, .tarjeta-producto, .tarjeta-testimonio, .vista-nosotros__grilla, .encabezado-seccion'
    );

    const observadorRevelar = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // El elemento entró en pantalla: animarlo a su posición final
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                // Dejar de observar para no re-disparar la animación
                observadorRevelar.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,          // Disparar cuando el 10% del elemento sea visible
        rootMargin: '0px 0px -60px 0px'  // Margen inferior negativo: animar un poco antes
    });

    // Inicializar cada elemento en estado invisible con un delay escalonado
    elementosRevelar.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        // El delay escalonado (i * 0.08s) crea un efecto cascada
        el.style.transition = `opacity 0.6s ease ${i * 0.08}s, transform 0.6s ease ${i * 0.08}s`;
        observadorRevelar.observe(el);
    });

    // ── Scroll Suave para enlaces ancla ────────────────────────────────────────
    // Los enlaces que apuntan a #secciones se desplazan suavemente en lugar
    // de saltar directamente (comportamiento nativo del navegador)
    document.querySelectorAll('a[href^="#"]').forEach(ancla => {
        ancla.addEventListener('click', function (e) {
            e.preventDefault();
            const destino = document.querySelector(this.getAttribute('href'));
            if (destino) {
                destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ── Filtro de Categorías + Paginación del Catálogo ─────────────────────────
    // Se inicializa SOLO cuando productos-api.js termina de cargar las cards.
    // Escuchar el evento personalizado "productosListos" en lugar de DOMContentLoaded
    // garantiza que las tarjetas ya estén en el DOM.
    function inicializarFiltros() {
        const filtros          = document.querySelectorAll('.catalogo__filtro');
        const todasLasTarjetas = Array.from(document.querySelectorAll('.catalogo__grilla .tarjeta-producto'));
        const resultado        = document.getElementById('catalogo__resultado');
        const contenedorPag   = document.getElementById('paginacion');

        if (filtros.length === 0 || todasLasTarjetas.length === 0) return;

        let tarjetasFiltradas = todasLasTarjetas;
        let paginaActual = 1;

        /**
         * Calcula cuántos productos mostrar por página según las columnas
         * actuales de la grilla CSS (2 filas de productos).
         * Esto hace que la paginación sea responsive: más columnas = más por página.
         */
        function calcularPorPagina() {
            const grilla = document.getElementById('grillaProductos');
            if (!grilla) return 8;
            const columnas = getComputedStyle(grilla).gridTemplateColumns.split(' ').length;
            return columnas * 2; // 2 filas
        }

        /** Muestra la página actual y actualiza el componente de paginación. */
        function actualizarVista() {
            const porPagina    = calcularPorPagina();
            const total        = tarjetasFiltradas.length;
            const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

            // Si la página actual quedó fuera de rango (ej: al aplicar un filtro), ir a la última
            if (paginaActual > totalPaginas) paginaActual = totalPaginas;

            const inicio = (paginaActual - 1) * porPagina;
            const fin    = inicio + porPagina;

            // Mostrar/ocultar cada tarjeta según si está en el rango de la página actual
            todasLasTarjetas.forEach(t => {
                const idx     = tarjetasFiltradas.indexOf(t);
                const visible = idx >= inicio && idx < fin;
                t.classList.toggle('oculto',  !visible);
                t.classList.toggle('mostrar',  visible);
            });

            // Actualizar texto de conteo (ej: "Mostrando 6 de 12 productos")
            if (resultado) {
                const mostrados = Math.min(fin, total) - inicio;
                resultado.innerHTML = `Mostrando <strong>${mostrados}</strong> de <strong>${total}</strong> producto${total !== 1 ? 's' : ''}`;
            }

            renderizarPaginacion(totalPaginas);
        }

        /** Genera los botones numéricos de paginación con flechas anterior/siguiente. */
        function renderizarPaginacion(totalPaginas) {
            if (!contenedorPag) return;
            if (totalPaginas <= 1) { contenedorPag.innerHTML = ''; return; }

            let html = `<button class="paginacion__btn paginacion__btn--nav" id="pag-anterior" ${paginaActual === 1 ? 'disabled' : ''}>&#8249;</button>`;

            for (let i = 1; i <= totalPaginas; i++) {
                html += `<button class="paginacion__btn${i === paginaActual ? ' paginacion__btn--activo' : ''}" data-pagina="${i}">${i}</button>`;
            }

            html += `<button class="paginacion__btn paginacion__btn--nav" id="pag-siguiente" ${paginaActual === totalPaginas ? 'disabled' : ''}>&#8250;</button>`;

            contenedorPag.innerHTML = html;

            // Eventos de los botones de paginación
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

        /** Al cambiar de página, hacer scroll al inicio del catálogo. */
        function scrollAlCatalogo() {
            document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        /** Filtra las tarjetas por categoría y reinicia la paginación a la página 1. */
        function aplicarFiltro(categoria) {
            tarjetasFiltradas = categoria === 'todos'
                ? todasLasTarjetas
                : todasLasTarjetas.filter(t => t.dataset.categoria === categoria);
            paginaActual = 1;
            actualizarVista();
        }

        // Asignar evento click a cada botón de filtro
        filtros.forEach(botonFiltro => {
            botonFiltro.addEventListener('click', () => {
                filtros.forEach(f => f.classList.remove('activo'));
                botonFiltro.classList.add('activo');
                aplicarFiltro(botonFiltro.dataset.filtro);
            });
        });

        // Recalcular al redimensionar la ventana (las columnas de la grilla cambian)
        window.addEventListener('resize', actualizarVista);

        // Mostrar todos los productos al cargar
        aplicarFiltro('todos');
    }

    // Esperar a que productos-api.js termine de insertar las cards en el DOM
    document.addEventListener('productosListos', inicializarFiltros);
});
