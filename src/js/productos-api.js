// ── Renderizado de tarjetas ───────────────────────────────────────────────────
// Genera el HTML de una tarjeta de producto. Maneja etiquetas, estado sin stock
// y adapta la ruta de la imagen según desde qué página se renderiza.
function renderizarCard(producto) {
  const claseEtiqueta = producto.etiqueta === "Popular"
    ? "tarjeta-producto__etiqueta tarjeta-producto__etiqueta--popular"
    : "tarjeta-producto__etiqueta";

  const etiquetaHTML = producto.etiqueta
    ? `<div class="${claseEtiqueta}">${producto.etiqueta}</div>`
    : "";

  // stock=null significa sin control de stock (no sin existencias)
  const sinStock = producto.stock !== null && producto.stock !== undefined && producto.stock === 0;

  const precioFormateado = producto.precio.toLocaleString("es-AR");
  const unidad = producto.unidad ? ` /${producto.unidad}` : "";
  const imagenSrc = producto.imagenUrl || "../src/img/materia-prima.png";
  const esRaiz = !window.location.pathname.includes('/pages/');
  const rutaContacto = esRaiz ? "pages/contacto.html" : "contacto.html";

  return `
    <div class="tarjeta-producto" data-categoria="${producto.categoria}">
      ${etiquetaHTML}
      ${sinStock ? `<div class="tarjeta-producto__etiqueta tarjeta-producto__etiqueta--sin-stock">Sin stock</div>` : ""}
      <div class="tarjeta-producto__contenedor-img">
        <img
          src="${imagenSrc}"
          alt="${producto.nombre}"
          class="tarjeta-producto__imagen${sinStock ? " tarjeta-producto__imagen--sin-stock" : ""}"
          loading="lazy"
        >
      </div>
      <div class="tarjeta-producto__contenido">
        <h3 class="tarjeta-producto__titulo">${producto.nombre}</h3>
        <p class="tarjeta-producto__descripcion">${producto.descripcion || ""}</p>
        <div class="tarjeta-producto__pie">
          <span class="tarjeta-producto__precio">$${precioFormateado}${unidad}</span>
          <div class="tarjeta-producto__acciones">
            ${sinStock
      ? `<button class="tarjeta-producto__boton-carrito" disabled>Sin stock</button>`
      : `<button
                  class="tarjeta-producto__boton-carrito"
                  data-id="${producto.id}"
                  data-nombre="${producto.nombre}"
                  data-precio="${producto.precio}"
                  data-unidad="${producto.unidad || ''}"
                >🛒 Agregar</button>`
    }
            <a href="${rutaContacto}" class="tarjeta-producto__boton">Consultar</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Carga del catálogo completo ───────────────────────────────────────────────
// Llama a GET /productos, renderiza todas las cards en #grillaProductos y
// dispara el evento "productosListos" para que main.js active filtros y paginación.
// También actualiza los contadores de cantidad por categoría en los botones de filtro.
async function cargarCatalogo() {
  const grilla = document.getElementById("grillaProductos");
  if (!grilla) return;

  try {
    const datos = await apiFetch("/productos");
    const productos = datos.productos;

    grilla.innerHTML = productos.map(renderizarCard).join("");

    // Avisar a main.js que el DOM de productos está listo (filtros y paginación)
    document.dispatchEvent(new CustomEvent("productosListos"));

    const contadores = { "materia-prima": 0, "elaborados": 0, "herramientas": 0 };
    productos.forEach((p) => {
      if (contadores[p.categoria] !== undefined) contadores[p.categoria]++;
    });

    document.querySelectorAll("[data-filtro]").forEach((btn) => {
      const cat = btn.dataset.filtro;
      const span = btn.querySelector(".catalogo__filtro-count");
      if (span && contadores[cat] !== undefined) {
        span.textContent = contadores[cat];
      }
    });

  } catch (error) {
    grilla.innerHTML = `
      <p style="color: red; grid-column: 1/-1; text-align: center;">
        No se pudieron cargar los productos. Verificá que el servidor esté corriendo.<br>
        <small>${error.message}</small>
      </p>
    `;
  }
}

// ── Carga de productos destacados (home) ──────────────────────────────────────
// Llama a GET /productos/destacados y renderiza hasta 3 cards en .destacados__grilla.
// Limpia los paths "../src/img/" del seed para que funcionen desde la raíz del sitio.
async function cargarDestacados() {
  const grilla = document.querySelector(".destacados__grilla");
  if (!grilla) return;

  try {
    const datos = await apiFetch("/productos/destacados");

    const productosAdaptados = datos.productos.map((p) => ({
      ...p,
      imagen_url: p.imagen_url
        ? p.imagen_url.replace("../src/img/", "src/img/")
        : "src/img/materia-prima.png",
    }));

    grilla.innerHTML = productosAdaptados.map(renderizarCard).join("");
  } catch (error) {
    console.error("No se pudieron cargar los productos destacados:", error.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  cargarCatalogo();
  cargarDestacados();
});
