/**
 * admin.js — Lógica del Panel de Administración.
 * Requiere: api.js y auth.js cargados antes.
 */

// ─── Estado global del panel ──────────────────────────────────────────────────
let todosLosProductos = [];  // cache de productos cargados
let filtroCategoriaActual = "";
let modoEdicion = false;     // false = agregar, true = editar
let todosUsuarios = [];      // cache de usuarios cargados
let todosPedidos  = [];      // cache de pedidos (MongoDB via API)

// ─── Inicialización ───────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
    // Verificar que el usuario sea admin
    if (!estaLogueado() || !esAdmin()) {
        window.location.href = "../pages/login.html";
        return;
    }

    // Cargar datos en paralelo
    await Promise.all([cargarProductos(), cargarMensajes(), cargarUsuarios(), cargarPedidos()]);

    // Listener del formulario de producto
    document.getElementById("formProducto").addEventListener("submit", guardarProducto);

    // Listener del formulario de edición de usuario
    document.getElementById("formUsuario").addEventListener("submit", guardarUsuario);
});

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function mostrarTab(tab) {
    const secciones = {
        productos: "seccionProductos",
        mensajes:  "seccionMensajes",
        usuarios:  "seccionUsuarios",
        pedidos:   "seccionPedidos"
    };
    const tabs = {
        productos: "tabProductos",
        mensajes:  "tabMensajes",
        usuarios:  "tabUsuarios",
        pedidos:   "tabPedidos"
    };

    Object.entries(secciones).forEach(([key, id]) => {
        document.getElementById(id).style.display = key === tab ? "block" : "none";
    });
    Object.entries(tabs).forEach(([key, id]) => {
        document.getElementById(id).classList.toggle("admin__tab--activo", key === tab);
    });
}

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────

async function cargarProductos() {
    try {
        // ?todos=true incluye productos inactivos (admin JWT)
        const datos = await apiFetch("/productos?todos=true");
        todosLosProductos = datos.productos;
        renderizarTablaProductos(todosLosProductos);
        actualizarStats(todosLosProductos);
    } catch (e) {
        document.getElementById("listaProductos").innerHTML =
            `<p style="color:red;padding:1rem;">Error al cargar productos: ${e.message}</p>`;
    }
}

function actualizarStats(productos) {
    const activos   = productos.filter(p => p.activo).length;
    const inactivos = productos.filter(p => !p.activo).length;
    document.getElementById("statProductos").textContent = activos;
    document.getElementById("statInactivos").textContent = inactivos;
}

function renderizarTablaProductos(productos) {
    const contenedor = document.getElementById("listaProductos");

    if (!productos.length) {
        contenedor.innerHTML = `<p class="admin__vacio">No hay productos en esta categoría.</p>`;
        return;
    }

    const filas = productos.map(p => `
        <div class="admin__fila ${!p.activo ? "admin__fila--inactiva" : ""}">
            <div class="admin__fila-img">
                <img src="${p.imagen_url || "../src/img/materia-prima.png"}" alt="${p.nombre}" onerror="this.src='../src/img/materia-prima.png'">
            </div>
            <div class="admin__fila-info">
                <span class="admin__fila-nombre">${p.nombre}</span>
                <span class="admin__fila-meta">
                    <span class="admin__badge admin__badge--${p.categoria}">${labelCategoria(p.categoria)}</span>
                    ${p.etiqueta ? `<span class="admin__badge admin__badge--etiqueta">${p.etiqueta}</span>` : ""}
                    ${p.destacado ? `<span class="admin__badge admin__badge--destacado">⭐ Destacado</span>` : ""}
                    ${!p.activo ? `<span class="admin__badge admin__badge--inactivo">Inactivo</span>` : ""}
                </span>
            </div>
            <div class="admin__fila-precio">
                $${p.precio.toLocaleString("es-AR")}${p.unidad ? " /" + p.unidad : ""}
            </div>
            <div class="admin__fila-acciones">
                <button class="admin__btn admin__btn--editar" onclick="abrirEditar(${JSON.stringify(p).replace(/"/g, "&quot;")})">
                    ✏ Editar
                </button>
                <button class="admin__btn ${p.activo ? "admin__btn--eliminar" : "admin__btn--restaurar"}"
                    onclick="toggleActivo('${p.id}', ${p.activo})">
                    ${p.activo ? "🗑 Desactivar" : "♻ Restaurar"}
                </button>
            </div>
        </div>
    `).join("");

    contenedor.innerHTML = `<div class="admin__tabla">${filas}</div>`;
}

function labelCategoria(cat) {
    const labels = { "materia-prima": "Materia Prima", "elaborados": "Elaborados", "herramientas": "Herramientas" };
    return labels[cat] || cat;
}

function filtrarAdmin(btn, categoria) {
    // Resaltar botón activo
    document.querySelectorAll(".admin__filtros .admin__filtro").forEach(b => b.classList.remove("admin__filtro--activo"));
    btn.classList.add("admin__filtro--activo");

    filtroCategoriaActual = categoria;
    const filtrados = categoria
        ? todosLosProductos.filter(p => p.categoria === categoria)
        : todosLosProductos;
    renderizarTablaProductos(filtrados);
}

// ─── Formulario producto ──────────────────────────────────────────────────────

function toggleFormulario() {
    const form = document.getElementById("formularioProducto");
    const visible = form.style.display !== "none";
    if (visible) {
        cancelarFormulario();
    } else {
        modoEdicion = false;
        document.getElementById("formTitulo").textContent = "Agregar Producto";
        document.getElementById("formProducto").reset();
        document.getElementById("productoId").value = "";
        document.getElementById("checkActivoLabel").style.display = "none";
        document.getElementById("formError").style.display = "none";
        form.style.display = "block";
        form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function cancelarFormulario() {
    document.getElementById("formularioProducto").style.display = "none";
    document.getElementById("formProducto").reset();
    document.getElementById("productoId").value = "";
    modoEdicion = false;
}

function abrirEditar(producto) {
    modoEdicion = true;
    document.getElementById("formTitulo").textContent = "Editar Producto";
    document.getElementById("productoId").value      = producto.id;
    document.getElementById("pNombre").value         = producto.nombre;
    document.getElementById("pPrecio").value         = producto.precio;
    document.getElementById("pCategoria").value      = producto.categoria;
    document.getElementById("pUnidad").value         = producto.unidad || "";
    document.getElementById("pDescripcion").value    = producto.descripcion || "";
    document.getElementById("pImagenUrl").value      = producto.imagen_url || "";
    document.getElementById("pEtiqueta").value       = producto.etiqueta || "";
    document.getElementById("pDestacado").checked    = producto.destacado;
    document.getElementById("pActivo").checked       = producto.activo;
    document.getElementById("checkActivoLabel").style.display = "flex";
    document.getElementById("formError").style.display = "none";

    const form = document.getElementById("formularioProducto");
    form.style.display = "block";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function guardarProducto(e) {
    e.preventDefault();
    const errorDiv = document.getElementById("formError");
    const btnGuardar = document.getElementById("btnGuardar");
    errorDiv.style.display = "none";

    const payload = {
        nombre:      document.getElementById("pNombre").value.trim(),
        precio:      parseFloat(document.getElementById("pPrecio").value),
        categoria:   document.getElementById("pCategoria").value,
        unidad:      document.getElementById("pUnidad").value.trim() || null,
        descripcion: document.getElementById("pDescripcion").value.trim(),
        imagen_url:  document.getElementById("pImagenUrl").value.trim() || null,
        etiqueta:    document.getElementById("pEtiqueta").value || null,
        destacado:   document.getElementById("pDestacado").checked,
    };

    if (modoEdicion) {
        payload.activo = document.getElementById("pActivo").checked;
    }

    btnGuardar.disabled = true;
    btnGuardar.textContent = "Guardando...";

    try {
        const id = document.getElementById("productoId").value;
        if (modoEdicion) {
            await apiFetch(`/productos/${id}`, { method: "PUT", body: JSON.stringify(payload) });
        } else {
            await apiFetch("/productos", { method: "POST", body: JSON.stringify(payload) });
        }
        cancelarFormulario();
        await cargarProductos(); // recargar la lista
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = "block";
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = "Guardar";
    }
}

async function toggleActivo(id, estadoActual) {
    const accion = estadoActual ? "desactivar" : "restaurar";
    if (!confirm(`¿Seguro que querés ${accion} este producto?`)) return;

    try {
        if (estadoActual) {
            // Soft-delete
            await apiFetch(`/productos/${id}`, { method: "DELETE" });
        } else {
            // Reactivar via PUT
            const producto = todosLosProductos.find(p => p.id === id);
            await apiFetch(`/productos/${id}`, {
                method: "PUT",
                body: JSON.stringify({ ...producto, activo: true })
            });
        }
        await cargarProductos();
    } catch (e) {
        alert("Error: " + e.message);
    }
}

// ─── MENSAJES ─────────────────────────────────────────────────────────────────

let todosMensajes = [];

async function cargarMensajes() {
    try {
        const datos = await apiFetch("/contacto");
        todosMensajes = datos.mensajes;
        const noLeidos = todosMensajes.filter(m => !m.leido).length;

        // Actualizar badge del tab y stat
        document.getElementById("statMensajes").textContent = noLeidos;
        if (noLeidos > 0) {
            document.getElementById("badgeMensajes").textContent = noLeidos;
            document.getElementById("badgeMensajes").style.display = "inline-flex";
            document.getElementById("statMensajesBox").classList.add("admin__stat--alerta-activa");
        }

        renderizarMensajes(todosMensajes);
    } catch (e) {
        document.getElementById("listaMensajes").innerHTML =
            `<p style="color:red;padding:1rem;">Error al cargar mensajes: ${e.message}</p>`;
    }
}

function filtrarMensajes(btn, filtro) {
    document.querySelectorAll(".admin__filtros-mensajes .admin__filtro").forEach(b => b.classList.remove("admin__filtro--activo"));
    btn.classList.add("admin__filtro--activo");

    const lista = filtro === "no_leidos"
        ? todosMensajes.filter(m => !m.leido)
        : todosMensajes;
    renderizarMensajes(lista);
}

function renderizarMensajes(mensajes) {
    const contenedor = document.getElementById("listaMensajes");

    if (!mensajes.length) {
        contenedor.innerHTML = `<p class="admin__vacio">No hay mensajes para mostrar.</p>`;
        return;
    }

    const labelAsunto = {
        consulta: "Consulta",
        mayorista: "Mayorista",
        pedido: "Pedido",
        otro: "Otro"
    };

    contenedor.innerHTML = mensajes.map(m => `
        <div class="admin__mensaje ${!m.leido ? "admin__mensaje--nuevo" : ""}" id="msg-${m.id}">
            <div class="admin__mensaje-cabecera">
                <div class="admin__mensaje-origen">
                    <span class="admin__mensaje-nombre">${m.nombre}</span>
                    <span class="admin__mensaje-email">${m.email}</span>
                </div>
                <div class="admin__mensaje-meta">
                    <span class="admin__badge admin__badge--asunto">${labelAsunto[m.asunto] || m.asunto}</span>
                    ${!m.leido ? `<span class="admin__badge admin__badge--nuevo">Nuevo</span>` : ""}
                    <span class="admin__mensaje-fecha">${formatearFecha(m.created_at)}</span>
                </div>
            </div>
            <p class="admin__mensaje-texto">${m.mensaje}</p>
            <div class="admin__fila-acciones">
                ${!m.leido
                    ? `<button class="admin__btn admin__btn--leido" onclick="marcarLeido('${m.id}', this)">✓ Marcar como leído</button>`
                    : `<span class="admin__mensaje-leido">✓ Leído</span>`
                }
                <button class="admin__btn admin__btn--eliminar" onclick="eliminarMensaje('${m.id}')">🗑 Eliminar</button>
            </div>
        </div>
    `).join("");
}

async function marcarLeido(id, btn) {
    try {
        await apiFetch(`/contacto/${id}/leido`, { method: "PATCH" });
        // Actualizar el mensaje en el cache local sin recargar todo
        const idx = todosMensajes.findIndex(m => m.id === id);
        if (idx !== -1) todosMensajes[idx].leido = true;

        // Actualizar la UI del mensaje
        const tarjeta = btn.closest(".admin__mensaje");
        tarjeta.classList.remove("admin__mensaje--nuevo");
        btn.replaceWith(Object.assign(document.createElement("span"), {
            className: "admin__mensaje-leido",
            textContent: "✓ Leído"
        }));
        tarjeta.querySelector(".admin__badge--nuevo")?.remove();

        // Actualizar contador
        const noLeidos = todosMensajes.filter(m => !m.leido).length;
        document.getElementById("statMensajes").textContent = noLeidos;
        const badge = document.getElementById("badgeMensajes");
        if (noLeidos > 0) {
            badge.textContent = noLeidos;
        } else {
            badge.style.display = "none";
        }
    } catch (e) {
        alert("Error: " + e.message);
    }
}

async function eliminarMensaje(id) {
    if (!confirm("¿Seguro que querés eliminar este mensaje? Esta acción no se puede deshacer.")) return;
    try {
        await apiFetch(`/contacto/${id}`, { method: "DELETE" });
        // Quitar del cache y del DOM
        todosMensajes = todosMensajes.filter(m => m.id !== id);
        document.getElementById(`msg-${id}`)?.remove();

        // Actualizar contador
        const noLeidos = todosMensajes.filter(m => !m.leido).length;
        document.getElementById("statMensajes").textContent = noLeidos;
        const badge = document.getElementById("badgeMensajes");
        badge.textContent = noLeidos;
        if (noLeidos === 0) badge.style.display = "none";

        if (!todosMensajes.length) {
            document.getElementById("listaMensajes").innerHTML =
                `<p class="admin__vacio">No hay mensajes para mostrar.</p>`;
        }
    } catch (e) {
        alert("Error al eliminar: " + e.message);
    }
}

// ─── USUARIOS ─────────────────────────────────────────────────────────────────

async function cargarUsuarios() {
    try {
        const datos = await apiFetch("/auth/usuarios");
        todosUsuarios = datos.usuarios;
        document.getElementById("statUsuarios").textContent = todosUsuarios.length;
        renderizarUsuarios(todosUsuarios);
    } catch (e) {
        document.getElementById("listaUsuarios").innerHTML =
            `<p style="color:red;padding:1rem;">Error al cargar usuarios: ${e.message}</p>`;
    }
}

function renderizarUsuarios(usuarios) {
    const contenedor = document.getElementById("listaUsuarios");

    if (!usuarios.length) {
        contenedor.innerHTML = `<p class="admin__vacio">No hay otros usuarios registrados.</p>`;
        return;
    }

    const filas = usuarios.map(u => `
        <div class="admin__fila ${!u.activo ? "admin__fila--inactiva" : ""}" id="usr-${u.id}">
            <div class="admin__fila-info">
                <span class="admin__fila-nombre">${u.nombre}</span>
                <span class="admin__fila-meta">
                    <span class="admin__badge ${u.es_admin ? "admin__badge--destacado" : "admin__badge--etiqueta"}">
                        ${u.es_admin ? "Admin" : "Usuario"}
                    </span>
                    ${!u.activo ? `<span class="admin__badge admin__badge--inactivo">Inactivo</span>` : ""}
                    <span style="font-size:.8rem;color:#888;">${u.email}</span>
                </span>
            </div>
            <div class="admin__fila-acciones">
                <button class="admin__btn admin__btn--editar" onclick="abrirEditarUsuario(${JSON.stringify(u).replace(/"/g, "&quot;")})">
                    ✏ Editar
                </button>
                <button class="admin__btn ${u.activo ? "admin__btn--eliminar" : "admin__btn--restaurar"}"
                    onclick="toggleEstadoUsuario('${u.id}', ${u.activo})">
                    ${u.activo ? "🚫 Dar de baja" : "✔ Reactivar"}
                </button>
            </div>
        </div>
    `).join("");

    contenedor.innerHTML = `<div class="admin__tabla">${filas}</div>`;
}

function abrirEditarUsuario(usuario) {
    document.getElementById("usuarioEditId").value = usuario.id;
    document.getElementById("uNombre").value        = usuario.nombre;
    document.getElementById("uEsAdmin").checked     = usuario.es_admin;
    document.getElementById("formUsuarioError").style.display = "none";

    const form = document.getElementById("formularioUsuario");
    form.style.display = "block";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelarFormUsuario() {
    document.getElementById("formularioUsuario").style.display = "none";
    document.getElementById("formUsuario").reset();
}

async function guardarUsuario(e) {
    e.preventDefault();
    const errorDiv  = document.getElementById("formUsuarioError");
    const btnGuardar = document.getElementById("btnGuardarUsuario");
    errorDiv.style.display = "none";

    const id      = document.getElementById("usuarioEditId").value;
    const payload = {
        nombre:   document.getElementById("uNombre").value.trim(),
        es_admin: document.getElementById("uEsAdmin").checked,
    };

    btnGuardar.disabled = true;
    btnGuardar.textContent = "Guardando...";

    try {
        await apiFetch(`/auth/usuarios/${id}`, { method: "PUT", body: JSON.stringify(payload) });
        cancelarFormUsuario();
        await cargarUsuarios();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = "block";
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = "Guardar cambios";
    }
}

async function toggleEstadoUsuario(id, estadoActual) {
    const accion = estadoActual ? "dar de baja" : "reactivar";
    if (!confirm(`¿Seguro que querés ${accion} a este usuario?`)) return;

    try {
        await apiFetch(`/auth/usuarios/${id}/estado`, {
            method: "PATCH",
            body: JSON.stringify({ activo: !estadoActual })
        });
        await cargarUsuarios();
    } catch (e) {
        alert("Error: " + e.message);
    }
}

// ─── PEDIDOS ──────────────────────────────────────────────────────────────────

async function cargarPedidos() {
    try {
        const datos = await apiFetch("/pedidos");
        todosPedidos = datos.pedidos;

        const pendientes = todosPedidos.filter(p => p.estado === "pendiente").length;
        document.getElementById("statPedidos").textContent = pendientes;

        if (pendientes > 0) {
            document.getElementById("badgePedidos").textContent = pendientes;
            document.getElementById("badgePedidos").style.display = "inline-flex";
            document.getElementById("statPedidosBox").classList.add("admin__stat--alerta-activa");
        }

        renderizarPedidos(todosPedidos);
    } catch (e) {
        document.getElementById("listaPedidos").innerHTML =
            `<p style="color:red;padding:1rem;">Error al cargar pedidos: ${e.message}</p>`;
    }
}

function filtrarPedidos(btn, filtro) {
    document.querySelectorAll("#seccionPedidos .admin__filtro").forEach(b => b.classList.remove("admin__filtro--activo"));
    btn.classList.add("admin__filtro--activo");

    const lista = filtro === 'todos'
        ? todosPedidos
        : todosPedidos.filter(p => p.estado === filtro);
    renderizarPedidos(lista);
}

function renderizarPedidos(pedidos) {
    const contenedor = document.getElementById("listaPedidos");

    if (!pedidos.length) {
        contenedor.innerHTML = `<p class="admin__vacio">No hay pedidos para mostrar.</p>`;
        return;
    }

    contenedor.innerHTML = pedidos.map(p => {
        const esPendiente  = p.estado === "pendiente";
        const resumenItems = p.items.map(i => `${i.nombre} x${i.cantidad}`).join(", ");
        const nuevoEstado  = esPendiente ? "procesado" : "pendiente";
        const usuarioInfo  = p.usuario_nombre
            ? `<span class="admin__pedido-usuario">👤 ${p.usuario_nombre} &mdash; <em>${p.usuario_email}</em></span>`
            : `<span class="admin__pedido-usuario admin__pedido-usuario--anonimo">👤 Usuario no registrado</span>`;

        return `
        <div class="admin__pedido ${esPendiente ? "admin__pedido--pendiente" : ""}" id="pedido-${p.id}">
            <div class="admin__pedido-cabecera">
                <div class="admin__pedido-id">
                    <span class="admin__pedido-numero">${p.numero}</span>
                    <span class="admin__mensaje-fecha">${formatearFecha(p.created_at)}</span>
                </div>
                <div class="admin__pedido-meta">
                    <span class="admin__badge ${esPendiente ? "admin__badge--pendiente" : "admin__badge--procesado"}">
                        ${esPendiente ? "⏳ Pendiente" : "✓ Procesado"}
                    </span>
                    <span class="admin__pedido-total">$${p.total.toLocaleString("es-AR")}</span>
                </div>
            </div>
            ${usuarioInfo}
            <p class="admin__pedido-items">${resumenItems}</p>
            <div class="admin__fila-acciones">
                <button class="admin__btn ${esPendiente ? "admin__btn--leido" : "admin__btn--editar"}"
                    onclick="toggleEstadoPedido('${p.id}', '${nuevoEstado}')">
                    ${esPendiente ? "✓ Marcar procesado" : "↩ Marcar pendiente"}
                </button>
                <button class="admin__btn admin__btn--eliminar" onclick="eliminarPedido('${p.id}', '${p.numero}')">
                    🗑 Eliminar
                </button>
            </div>
        </div>
        `;
    }).join("");
}

async function toggleEstadoPedido(id, nuevoEstado) {
    try {
        await apiFetch(`/pedidos/${id}/estado`, {
            method: "PATCH",
            body: JSON.stringify({ estado: nuevoEstado }),
        });
        await cargarPedidos(); // recargar desde la API para reflejar el cambio
    } catch (e) {
        alert("Error al cambiar el estado: " + e.message);
    }
}

async function eliminarPedido(id, numero) {
    if (!confirm(`¿Seguro que querés eliminar el pedido ${numero}? Esta acción no se puede deshacer.`)) return;
    try {
        await apiFetch(`/pedidos/${id}`, { method: "DELETE" });
        await cargarPedidos();
    } catch (e) {
        alert("Error al eliminar: " + e.message);
    }
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

function formatearFecha(isoString) {
    const fecha = new Date(isoString);
    return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
        + " " + fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Exportación CSV ──────────────────────────────────────────────────────────

/**
 * Genera y descarga un archivo CSV a partir de un array de filas.
 * La primera fila debe ser el array de encabezados.
 * Incluye BOM UTF-8 para compatibilidad con Excel (tildes y ñ).
 */
function exportarCSV(filas, nombreArchivo) {
    const contenido = filas
        .map(fila => fila.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
        .join("\n");
    const blob = new Blob(["\uFEFF" + contenido], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: nombreArchivo });
    a.click();
    URL.revokeObjectURL(url);
}

function exportarProductos() {
    if (!todosLosProductos.length) { alert("No hay productos cargados para exportar."); return; }
    const fecha = new Date().toISOString().slice(0, 10);
    const filas = [
        ["Nombre", "Descripción", "Precio (ARS)", "Unidad", "Categoría", "Etiqueta", "Destacado", "Activo", "Fecha de creación"],
        ...todosLosProductos.map(p => [
            p.nombre, p.descripcion ?? "", p.precio, p.unidad ?? "",
            p.categoria, p.etiqueta ?? "", p.destacado ? "Sí" : "No",
            p.activo ? "Sí" : "No", formatearFecha(p.created_at)
        ])
    ];
    exportarCSV(filas, `productos_${fecha}.csv`);
}

function exportarMensajes() {
    if (!todosMensajes.length) { alert("No hay mensajes cargados para exportar."); return; }
    const fecha = new Date().toISOString().slice(0, 10);
    const filas = [
        ["Nombre", "Email", "Asunto", "Mensaje", "Leído", "Fecha de envío"],
        ...todosMensajes.map(m => [
            m.nombre, m.email, m.asunto, m.mensaje,
            m.leido ? "Sí" : "No", formatearFecha(m.created_at)
        ])
    ];
    exportarCSV(filas, `mensajes_${fecha}.csv`);
}

function exportarPedidos() {
    if (!todosPedidos.length) { alert("No hay pedidos cargados para exportar."); return; }
    const fecha = new Date().toISOString().slice(0, 10);
    const filas = [
        ["Número de Pedido", "Fecha", "Estado", "Productos", "Total (ARS)"],
        ...todosPedidos.map(p => [
            p.numero,
            formatearFecha(p.created_at),
            p.estado === "pendiente" ? "Pendiente" : "Procesado",
            p.items.map(i => `${i.nombre} x${i.cantidad}`).join(" | "),
            p.total
        ])
    ];
    exportarCSV(filas, `pedidos_${fecha}.csv`);
}

function exportarUsuarios() {
    if (!todosUsuarios.length) { alert("No hay usuarios cargados para exportar."); return; }
    const fecha = new Date().toISOString().slice(0, 10);
    const filas = [
        ["Nombre", "Email", "Administrador", "Activo", "Fecha de registro"],
        ...todosUsuarios.map(u => [
            u.nombre, u.email, u.es_admin ? "Sí" : "No",
            u.activo ? "Sí" : "No", formatearFecha(u.created_at)
        ])
    ];
    exportarCSV(filas, `usuarios_${fecha}.csv`);
}
