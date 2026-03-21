/**
 * admin.js — Lógica del Panel de Administración.
 * Requiere: api.js y auth.js cargados antes.
 */

// ─── Estado global del panel ──────────────────────────────────────────────────
let todosLosProductos = [];  // cache de productos cargados
let filtroCategoriaActual = "";
let modoEdicion = false;     // false = agregar, true = editar

// ─── Inicialización ───────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
    // Verificar que el usuario sea admin
    if (!estaLogueado() || !esAdmin()) {
        window.location.href = "../pages/login.html";
        return;
    }

    // Cargar datos en paralelo
    await Promise.all([cargarProductos(), cargarMensajes()]);

    // Listener del formulario de producto
    document.getElementById("formProducto").addEventListener("submit", guardarProducto);
});

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function mostrarTab(tab) {
    const secciones = { productos: "seccionProductos", mensajes: "seccionMensajes" };
    const tabs      = { productos: "tabProductos",     mensajes: "tabMensajes" };

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
        <div class="admin__mensaje ${!m.leido ? "admin__mensaje--nuevo" : ""}">
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
            ${!m.leido
                ? `<button class="admin__btn admin__btn--leido" onclick="marcarLeido('${m.id}', this)">✓ Marcar como leído</button>`
                : `<span class="admin__mensaje-leido">✓ Leído</span>`
            }
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

// ─── Utilidades ───────────────────────────────────────────────────────────────

function formatearFecha(isoString) {
    const fecha = new Date(isoString);
    return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
        + " " + fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}
