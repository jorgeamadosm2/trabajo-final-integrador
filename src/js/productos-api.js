// ── Tarjeta de producto ───────────────────────────────────────────────────────
// Genera el HTML de una tarjeta. Lo separé en su propia función para reutilizarlo
// tanto en el catálogo completo como en la sección de destacados del home.
function renderizarCard(producto) {
  const claseEtiqueta = producto.etiqueta === "Popular"
    ? "tarjeta-producto__etiqueta tarjeta-producto__etiqueta--popular"
    : "tarjeta-producto__etiqueta";

  const etiquetaHTML = producto.etiqueta
    ? `<div class="${claseEtiqueta}">${producto.etiqueta}</div>`
    : "";

  // stock=null significa que ese producto no tiene control de stock (cantidad ilimitada).
  // Es diferente a stock=0 que significa que está agotado. Hay que distinguir bien los dos casos.
  const sinStock = producto.stock !== null && producto.stock !== undefined && producto.stock === 0;

  const precioFormateado = producto.precio.toLocaleString("es-AR");
  const unidad = producto.unidad ? ` /${producto.unidad}` : "";
  const imagenSrc = producto.imagen_url || "../src/img/materia-prima.png";

  // La ruta al formulario de contacto cambia según si estoy en /pages/ o en la raíz
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

// ── Catálogo completo ─────────────────────────────────────────────────────────
// Carga todos los productos activos desde la API y los inserta en la grilla.
async function cargarCatalogo() {
  const grilla = document.getElementById("grillaProductos");
  if (!grilla) return;

  try {
    const datos = await apiFetch("/productos");
    const productos = datos.productos;

    grilla.innerHTML = productos.map(renderizarCard).join("");

    document.dispatchEvent(new CustomEvent("productosListos"));

  } catch (error) {
    grilla.innerHTML = `
      <p style="color: red; grid-column: 1/-1; text-align: center;">
        No se pudieron cargar los productos. Verificá que el servidor esté corriendo.<br>
        <small>${error.message}</small>
      </p>
    `;
  }
}

// ── Destacados del home ───────────────────────────────────────────────────────
// Solo carga hasta 3 productos marcados como destacados para la sección del home.
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
