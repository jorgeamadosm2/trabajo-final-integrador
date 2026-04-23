/**
 * carrito.js — Carrito de compras con persistencia en localStorage
 *
 * El carrito se guarda en localStorage bajo la clave "cuerar_carrito" como
 * un array JSON. Esto permite que persista entre páginas y entre sesiones
 * del navegador sin necesidad de guardar nada en el servidor.
 *
 * Estructura de cada item en el carrito:
 * { id, nombre, precio, unidad, cantidad }
 *
 * Componentes visuales que maneja este archivo:
 *   - Badge con cantidad de items en el ícono del carrito del navbar
 *   - Panel desplegable con el detalle de items y total
 *   - Toast de confirmación al agregar un producto
 *
 * Integración con otros archivos:
 *   - carrito.js escucha clicks en botones .tarjeta-producto__boton-carrito
 *     (renderizados por productos-api.js)
 *   - Si el usuario no está logueado, el botón "Comprar" redirige al login
 *     (usa estaLogueado() de auth.js)
 *   - Al hacer clic en "Comprar", redirige a pedido.html que consume el carrito
 */

const CARRITO_KEY = 'cuerar_carrito';

// ─── Lectura y escritura en localStorage ─────────────────────────────────────

/** Lee el carrito actual desde localStorage. Devuelve [] si está vacío. */
function obtenerCarrito() {
    return JSON.parse(localStorage.getItem(CARRITO_KEY) || '[]');
}

/** Guarda el carrito en localStorage y actualiza la UI (badge + panel). */
function guardarCarrito(carrito) {
    localStorage.setItem(CARRITO_KEY, JSON.stringify(carrito));
    actualizarBadge();
    renderizarDropdownCarrito();
}

// ─── Operaciones del carrito ──────────────────────────────────────────────────

/**
 * Agrega un producto al carrito.
 * Si el producto ya está, incrementa su cantidad en 1.
 * Si es nuevo, lo agrega con cantidad=1.
 */
function agregarAlCarrito(producto) {
    const carrito = obtenerCarrito();
    const existente = carrito.find(item => item.id === producto.id);
    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }
    guardarCarrito(carrito);
    mostrarToast(`"${producto.nombre}" agregado al carrito`);
}

/** Elimina completamente un producto del carrito por su ID. */
function eliminarDelCarrito(id) {
    const carrito = obtenerCarrito();
    const item = carrito.find(i => i.id === id);
    guardarCarrito(carrito.filter(i => i.id !== id));
    if (item) mostrarNotificacion(`"${item.nombre}" eliminado del carrito`);
}

/**
 * Incrementa o decrementa la cantidad de un item.
 * Si la cantidad llega a 0 o menos, elimina el item del carrito.
 * @param {string} id    - ID del producto
 * @param {number} delta - +1 para incrementar, -1 para decrementar
 */
function cambiarCantidad(id, delta) {
    const carrito = obtenerCarrito();
    const item = carrito.find(i => i.id === id);
    if (!item) return;
    item.cantidad += delta;
    if (item.cantidad <= 0) {
        eliminarDelCarrito(id);
        return;
    }
    guardarCarrito(carrito);
}

/** Calcula el total del carrito sumando precio × cantidad de cada item. */
function calcularTotal(carrito) {
    return carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
}

// ─── Actualizar UI ────────────────────────────────────────────────────────────

/**
 * Actualiza el badge numérico que aparece sobre el ícono del carrito.
 * Muestra el número total de unidades (no de productos distintos).
 * Se oculta cuando el carrito está vacío.
 */
function actualizarBadge() {
    const carrito = obtenerCarrito();
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    document.querySelectorAll('.carrito__badge').forEach(badge => {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

/**
 * Re-renderiza el panel desplegable del carrito con el estado actual.
 *
 * Casos que maneja:
 *   - Carrito vacío: muestra mensaje + botón deshabilitado
 *   - Usuario no logueado: muestra enlace al login en lugar de "Comprar"
 *   - Usuario logueado: muestra total + botón "Comprar" → /pages/pedido.html
 */
function renderizarDropdownCarrito() {
    const panel = document.getElementById('carritoPanel');
    if (!panel) return;

    const carrito = obtenerCarrito();
    const itemsEl = panel.querySelector('.carrito__items');
    const footerEl = panel.querySelector('.carrito__footer');

    // Carrito vacío
    if (carrito.length === 0) {
        itemsEl.innerHTML = `
            <div class="carrito__vacio">
                <span class="carrito__vacio-icono">🛒</span>
                <p>Tu carrito está vacío</p>
            </div>
        `;
        footerEl.innerHTML = `
            <div class="carrito__total-row">
                <span>Total:</span><strong>$0</strong>
            </div>
            <button class="boton boton--primario carrito__btn-comprar" disabled>Comprar</button>
        `;
        return;
    }

    const total = calcularTotal(carrito);
    const esPaginaRaiz = !window.location.pathname.includes('/pages/');
    const urlPedido = esPaginaRaiz ? 'pages/pedido.html' : 'pedido.html';

    // Renderizar cada item con controles de cantidad (+/-) y botón de eliminar
    itemsEl.innerHTML = carrito.map(item => `
        <div class="carrito__item">
            <div class="carrito__item-info">
                <span class="carrito__item-nombre">${item.nombre}</span>
                <span class="carrito__item-precio">$${(item.precio * item.cantidad).toLocaleString('es-AR')}</span>
            </div>
            <div class="carrito__item-controles">
                <button class="carrito__ctrl-btn" onclick="cambiarCantidad('${item.id}', -1)">−</button>
                <span class="carrito__item-cantidad">${item.cantidad}</span>
                <button class="carrito__ctrl-btn" onclick="cambiarCantidad('${item.id}', 1)">+</button>
                <button class="carrito__ctrl-btn carrito__ctrl-btn--eliminar" onclick="eliminarDelCarrito('${item.id}')">×</button>
            </div>
        </div>
    `).join('');

    // Footer del carrito: diferente según si el usuario está logueado
    if (typeof estaLogueado === 'function' && !estaLogueado()) {
        // No logueado: invitar a iniciar sesión para poder comprar
        const urlLogin = esPaginaRaiz ? 'pages/login.html' : 'login.html';
        footerEl.innerHTML = `
            <div class="carrito__total-row">
                <span>Total:</span><strong>$${total.toLocaleString('es-AR')}</strong>
            </div>
            <p class="carrito__aviso-login">Iniciá sesión para realizar tu pedido</p>
            <a href="${urlLogin}" class="boton boton--primario carrito__btn-comprar">Iniciar Sesión</a>
        `;
    } else {
        // Logueado: botón "Comprar" lleva a la página de confirmación del pedido
        footerEl.innerHTML = `
            <div class="carrito__total-row">
                <span>Total:</span><strong>$${total.toLocaleString('es-AR')}</strong>
            </div>
            <a href="${urlPedido}" class="boton boton--primario carrito__btn-comprar">Comprar</a>
        `;
    }
}

// ─── Toast de notificación ────────────────────────────────────────────────────

/** Alias para compatibilidad interna — usa el sistema global de notificaciones. */
function mostrarToast(mensaje) {
    mostrarNotificacion(mensaje);
}

// ─── Inicialización del widget del carrito en el navbar ───────────────────────

/**
 * Crea e inserta el botón del carrito y su panel desplegable en el navbar.
 * Se inserta justo antes del div #navAuth (que contiene el login/usuario).
 *
 * Estructura creada:
 *   .carrito__wrapper
 *     button.carrito__boton (ícono SVG + badge)
 *     div.carrito__panel#carritoPanel
 *       .carrito__header (título + botón cerrar)
 *       .carrito__items  (lista de productos)
 *       .carrito__footer (total + botón comprar)
 */
function inicializarCarrito() {
    const authDiv = document.getElementById('navAuth');
    if (!authDiv) return;

    // Wrapper relativo para posicionar el panel desplegable
    const wrapper = document.createElement('div');
    wrapper.className = 'carrito__wrapper';

    // Botón ícono del carrito con ícono SVG
    const botonCarrito = document.createElement('button');
    botonCarrito.className = 'carrito__boton';
    botonCarrito.setAttribute('aria-label', 'Carrito de compras');
    botonCarrito.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span class="carrito__badge" style="display:none">0</span>
    `;

    // Panel desplegable (inicialmente oculto)
    const panel = document.createElement('div');
    panel.className = 'carrito__panel';
    panel.id = 'carritoPanel';
    panel.innerHTML = `
        <div class="carrito__header">
            <h3 class="carrito__header-titulo">Tu Carrito</h3>
            <button class="carrito__cerrar" id="carritoCerrar" aria-label="Cerrar carrito">×</button>
        </div>
        <div class="carrito__items"></div>
        <div class="carrito__footer"></div>
    `;

    wrapper.appendChild(botonCarrito);
    wrapper.appendChild(panel);

    // Insertar el carrito antes del área de auth en el navbar
    authDiv.parentNode.insertBefore(wrapper, authDiv);

    // Toggle: abrir/cerrar el panel al hacer clic en el ícono
    botonCarrito.addEventListener('click', e => {
        e.stopPropagation();
        panel.classList.toggle('carrito__panel--abierto');
        if (panel.classList.contains('carrito__panel--abierto')) {
            renderizarDropdownCarrito();
        }
    });

    // Cerrar al hacer clic en la X
    panel.querySelector('#carritoCerrar').addEventListener('click', () => {
        panel.classList.remove('carrito__panel--abierto');
    });

    // Cerrar al hacer clic fuera del panel
    document.addEventListener('click', e => {
        if (!wrapper.contains(e.target)) {
            panel.classList.remove('carrito__panel--abierto');
        }
    });

    // Mostrar badge inicial con items que ya estaban en el carrito
    actualizarBadge();
    renderizarDropdownCarrito();
}

// ─── Escuchar clics en "Agregar al carrito" (event delegation) ────────────────
// En lugar de asignar un listener a cada botón de cada tarjeta, escuchamos
// el click en el documento completo y verificamos si el target es un botón
// de agregar. Esto funciona incluso con tarjetas cargadas dinámicamente.
document.addEventListener('click', e => {
    const btn = e.target.closest('.tarjeta-producto__boton-carrito');
    if (!btn) return;
    agregarAlCarrito({
        id: btn.dataset.id,
        nombre: btn.dataset.nombre,
        precio: parseFloat(btn.dataset.precio),
        unidad: btn.dataset.unidad || '',
    });
});

// Inicializar el widget del carrito en el navbar al cargar el DOM
document.addEventListener('DOMContentLoaded', inicializarCarrito);
