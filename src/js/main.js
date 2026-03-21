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

    // ---- Filtro de Productos (Catálogo) ----
    const filtros = document.querySelectorAll('.catalogo__filtro');
    const productos = document.querySelectorAll('.catalogo__grilla .tarjeta-producto');
    const resultado = document.getElementById('catalogo__resultado');

    if (filtros.length > 0 && productos.length > 0) {
        filtros.forEach(botonFiltro => {
            botonFiltro.addEventListener('click', () => {
                filtros.forEach(f => f.classList.remove('activo'));
                botonFiltro.classList.add('activo');

                const categoriaSeleccionada = botonFiltro.dataset.filtro;
                let visibles = 0;

                productos.forEach(producto => {
                    const categoriaProducto = producto.dataset.categoria;
                    if (categoriaSeleccionada === 'todos' || categoriaProducto === categoriaSeleccionada) {
                        producto.classList.remove('oculto');
                        producto.classList.add('mostrar');
                        visibles++;
                    } else {
                        producto.classList.add('oculto');
                        producto.classList.remove('mostrar');
                    }
                });

                if (resultado) {
                    resultado.innerHTML = `Mostrando <strong>${visibles}</strong> producto${visibles !== 1 ? 's' : ''}`;
                }
            });
        });
    }
});
