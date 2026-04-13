// ============================================
// CUERAR TUCUMÁN - Carrito de Compras
// ============================================

const CARRITO_KEY = 'cuerar_carrito';

function obtenerCarrito() {
    return JSON.parse(localStorage.getItem(CARRITO_KEY) || '[]');
}

function guardarCarrito(carrito) {
    localStorage.setItem(CARRITO_KEY, JSON.stringify(carrito));
    actualizarBadge();
    renderizarDropdownCarrito();
}

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

function eliminarDelCarrito(id) {
    const carrito = obtenerCarrito().filter(item => item.id !== id);
    guardarCarrito(carrito);
}

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

function calcularTotal(carrito) {
    return carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
}

function actualizarBadge() {
    const carrito = obtenerCarrito();
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    document.querySelectorAll('.carrito__badge').forEach(badge => {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

function renderizarDropdownCarrito() {
    const panel = document.getElementById('carritoPanel');
    if (!panel) return;

    const carrito = obtenerCarrito();
    const itemsEl = panel.querySelector('.carrito__items');
    const footerEl = panel.querySelector('.carrito__footer');

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

    footerEl.innerHTML = `
        <div class="carrito__total-row">
            <span>Total:</span><strong>$${total.toLocaleString('es-AR')}</strong>
        </div>
        <a href="${urlPedido}" class="boton boton--primario carrito__btn-comprar">Comprar</a>
    `;
}

function mostrarToast(mensaje) {
    let toast = document.getElementById('carritoToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'carritoToast';
        toast.className = 'carrito__toast';
        document.body.appendChild(toast);
    }
    toast.textContent = '✓ ' + mensaje;
    toast.classList.add('carrito__toast--visible');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('carrito__toast--visible'), 2500);
}

function inicializarCarrito() {
    const authDiv = document.getElementById('navAuth');
    if (!authDiv) return;

    // Wrapper relativo para posicionar el panel
    const wrapper = document.createElement('div');
    wrapper.className = 'carrito__wrapper';

    // Botón icono del carrito
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

    // Panel desplegable
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

    // Insertar antes del div de auth
    authDiv.parentNode.insertBefore(wrapper, authDiv);

    // Toggle panel
    botonCarrito.addEventListener('click', e => {
        e.stopPropagation();
        panel.classList.toggle('carrito__panel--abierto');
        if (panel.classList.contains('carrito__panel--abierto')) {
            renderizarDropdownCarrito();
        }
    });

    panel.querySelector('#carritoCerrar').addEventListener('click', () => {
        panel.classList.remove('carrito__panel--abierto');
    });

    document.addEventListener('click', e => {
        if (!wrapper.contains(e.target)) {
            panel.classList.remove('carrito__panel--abierto');
        }
    });

    actualizarBadge();
    renderizarDropdownCarrito();
}

// Escuchar clics en botones "Agregar al carrito" de las cards
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

document.addEventListener('DOMContentLoaded', inicializarCarrito);
