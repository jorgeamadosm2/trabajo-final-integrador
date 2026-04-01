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

    // ---- Filtro de Productos (Catálogo) con paginación "Ver más" ----
    // Los filtros se inicializan después de que productos-api.js cargue las cards
    function inicializarFiltros() {
        const filtros    = document.querySelectorAll('.catalogo__filtro');
        const todasLasTarjetas = Array.from(document.querySelectorAll('.catalogo__grilla .tarjeta-producto'));
        const resultado  = document.getElementById('catalogo__resultado');
        const btnVerMas  = document.getElementById('btnVerMas');

        if (filtros.length === 0 || todasLasTarjetas.length === 0) return;

        const POR_PAGINA = 6;
        let tarjetasFiltradas = todasLasTarjetas; // cards que coinciden con el filtro activo
        let mostradas = 0;

        function actualizarVista() {
            todasLasTarjetas.forEach((t, i) => {
                const enFiltro = tarjetasFiltradas.includes(t);
                const visible  = enFiltro && tarjetasFiltradas.indexOf(t) < mostradas;
                t.classList.toggle('oculto', !visible);
                t.classList.toggle('mostrar', visible);
            });

            if (resultado) {
                const total = tarjetasFiltradas.length;
                const shown = Math.min(mostradas, total);
                resultado.innerHTML = `Mostrando <strong>${shown}</strong> de <strong>${total}</strong> producto${total !== 1 ? 's' : ''}`;
            }

            if (btnVerMas) {
                btnVerMas.style.display = mostradas >= tarjetasFiltradas.length ? 'none' : 'block';
            }
        }

        function aplicarFiltro(categoria) {
            tarjetasFiltradas = categoria === 'todos'
                ? todasLasTarjetas
                : todasLasTarjetas.filter(t => t.dataset.categoria === categoria);
            mostradas = Math.min(POR_PAGINA, tarjetasFiltradas.length);
            actualizarVista();
        }

        filtros.forEach(botonFiltro => {
            botonFiltro.addEventListener('click', () => {
                filtros.forEach(f => f.classList.remove('activo'));
                botonFiltro.classList.add('activo');
                aplicarFiltro(botonFiltro.dataset.filtro);
            });
        });

        if (btnVerMas) {
            btnVerMas.addEventListener('click', () => {
                mostradas = Math.min(mostradas + POR_PAGINA, tarjetasFiltradas.length);
                actualizarVista();
            });
        }

        // Mostrar los primeros 6 al cargar
        aplicarFiltro('todos');
    }

    document.addEventListener('productosListos', inicializarFiltros);
});
