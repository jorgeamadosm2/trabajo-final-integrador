// Clave con la que guardo el carrito en localStorage. La defino acá arriba
// para poder cambiarla fácilmente si hace falta sin buscar en el código.
const CARRITO_KEY = 'cuerar_carrito';

// ── Lectura y escritura en localStorage ──────────────────────────────────────
// El carrito vive en localStorage como JSON, así sobrevive cuando el usuario
// cambia de página o recarga. Cada vez que se guarda, se actualiza el badge y el panel.

function obtenerCarrito() {
    return JSON.parse(localStorage.getItem(CARRITO_KEY) || '[]');
}

function guardarCarrito(carrito) {
    localStorage.setItem(CARRITO_KEY, JSON.stringify(carrito));
    actualizarBadge();
    renderizarDropdownCarrito();
}

// ── Operaciones sobre los items ───────────────────────────────────────────────

// Si el producto ya estaba en el carrito, sumo uno. Si no, lo agrego con cantidad 1.
// Esto evita duplicados: no quiero dos filas del mismo producto.
function agregarAlCarrito(producto) {
    const carrito   = obtenerCarrito();
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
    const carrito = obtenerCarrito();
    const item    = carrito.find(i => i.id === id);
    guardarCarrito(carrito.filter(i => i.id !== id));
    if (item) mostrarNotificacion(`"${item.nombre}" eliminado del carrito`);
}

// delta es +1 o -1. Si la cantidad baja a 0, directamente elimino el item
// para no dejar productos con cantidad 0 colgando en el carrito.
function cambiarCantidad(id, delta) {
    const carrito = obtenerCarrito();
    const item    = carrito.find(i => i.id === id);
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

// ── Badge del ícono de carrito ────────────────────────────────────────────────
// Uso querySelectorAll porque el badge puede aparecer en más de un lugar del HTML
// (por ejemplo, en mobile y en desktop con clases distintas).
function actualizarBadge() {
    const carrito    = obtenerCarrito();
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    document.querySelectorAll('.carrito__badge').forEach(badge => {
        badge.textContent  = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

// ── Panel desplegable del carrito ─────────────────────────────────────────────
// Renderiza la lista de items y el pie con el total.
// Si el usuario no está logueado, el botón de comprar lleva al login en vez de al pedido.
function renderizarDropdownCarrito() {
    const panel = document.getElementById('carritoPanel');
    if (!panel) return;

    const carrito  = obtenerCarrito();
    const itemsEl  = panel.querySelector('.carrito__items');
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

    const total       = calcularTotal(carrito);

    // La ruta a pedido.html es relativa, así que hay que ajustarla según dónde estemos
    const esPaginaRaiz = !window.location.pathname.includes('/pages/');
    const urlPedido   = esPaginaRaiz ? 'pages/pedido.html' : 'pedido.html';

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

    // Si no hay sesión, muestro aviso y redirijo al login en vez de dejar comprar sin cuenta
    if (typeof estaLogueado === 'function' && !estaLogueado()) {
        const urlLogin = esPaginaRaiz ? 'pages/login.html' : 'login.html';
        footerEl.innerHTML = `
            <div class="carrito__total-row">
                <span>Total:</span><strong>$${total.toLocaleString('es-AR')}</strong>
            </div>
            <p class="carrito__aviso-login">Iniciá sesión para realizar tu pedido</p>
            <a href="${urlLogin}" class="boton boton--primario carrito__btn-comprar">Iniciar Sesión</a>
        `;
    } else {
        footerEl.innerHTML = `
            <div class="carrito__total-row">
                <span>Total:</span><strong>$${total.toLocaleString('es-AR')}</strong>
            </div>
            <a href="${urlPedido}" class="boton boton--primario carrito__btn-comprar">Comprar</a>
        `;
    }
}

function mostrarToast(mensaje) {
    mostrarNotificacion(mensaje);
}

// ── Construcción del widget del carrito ───────────────────────────────────────
// Creo el botón y el panel por JavaScript porque el carrito se usa en todas las páginas
// y así no tengo que copiar el HTML en cada una. Lo inserto antes de #navAuth en el nav.
function inicializarCarrito() {
    const authDiv = document.getElementById('navAuth');
    if (!authDiv) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'carrito__wrapper';

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
    authDiv.parentNode.insertBefore(wrapper, authDiv);

    botonCarrito.addEventListener('click', e => {
        e.stopPropagation(); // evito que el click cierre el panel al instante por el listener global
        panel.classList.toggle('carrito__panel--abierto');
        if (panel.classList.contains('carrito__panel--abierto')) {
            renderizarDropdownCarrito();
        }
    });

    panel.querySelector('#carritoCerrar').addEventListener('click', () => {
        panel.classList.remove('carrito__panel--abierto');
    });

    // Cierra el panel si el usuario hace clic en cualquier parte fuera de él
    document.addEventListener('click', e => {
        if (!wrapper.contains(e.target)) {
            panel.classList.remove('carrito__panel--abierto');
        }
    });

    actualizarBadge();
    renderizarDropdownCarrito();
}

// ── Event delegation para botones de tarjetas ─────────────────────────────────
// No puedo poner el listener directamente en los botones de las tarjetas porque
// esas tarjetas las genera productos-api.js después de que esta función corre.
// La solución es escuchar el click a nivel del document y filtrar por clase.
document.addEventListener('click', e => {
    const btn = e.target.closest('.tarjeta-producto__boton-carrito');
    if (!btn) return;
    agregarAlCarrito({
        id:     btn.dataset.id,
        nombre: btn.dataset.nombre,
        precio: parseFloat(btn.dataset.precio),
        unidad: btn.dataset.unidad || '',
    });
});

document.addEventListener('DOMContentLoaded', inicializarCarrito);
