/**
 * productos-api.js
 * Carga los productos desde la API y renderiza las cards en el HTML.
 * Debe cargarse ANTES de main.js para que el DOM esté listo cuando
 * main.js aplique los filtros y animaciones.
 */

/**
 * Genera el HTML de una card de producto.
 * Usa exactamente los mismos nombres de clase CSS que el sitio ya tiene.
 */
function renderizarCard(producto) {
  // Determinar si la etiqueta es "Popular" para aplicar la clase especial
  const claseEtiqueta = producto.etiqueta === "Popular"
    ? "tarjeta-producto__etiqueta tarjeta-producto__etiqueta--popular"
    : "tarjeta-producto__etiqueta";

  const etiquetaHTML = producto.etiqueta
    ? `<div class="${claseEtiqueta}">${producto.etiqueta}</div>`
    : "";

  // Formatear el precio con puntos (ej: 18.500)
  const precioFormateado = producto.precio.toLocaleString("es-AR");
  const unidad = producto.unidad ? ` /${producto.unidad}` : "";

  // La ruta de la imagen viene de la API relativa a la carpeta pages/
  const imagenSrc = producto.imagen_url || "../src/img/materia-prima.png";

  return `
    <div class="tarjeta-producto" data-categoria="${producto.categoria}">
      ${etiquetaHTML}
      <div class="tarjeta-producto__contenedor-img">
        <img
          src="${imagenSrc}"
          alt="${producto.nombre}"
          class="tarjeta-producto__imagen"
          loading="lazy"
        >
      </div>
      <div class="tarjeta-producto__contenido">
        <h3 class="tarjeta-producto__titulo">${producto.nombre}</h3>
        <p class="tarjeta-producto__descripcion">${producto.descripcion || ""}</p>
        <div class="tarjeta-producto__pie">
          <span class="tarjeta-producto__precio">$${precioFormateado}${unidad}</span>
          <a href="contacto.html" class="tarjeta-producto__boton">Consultar</a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Carga todos los productos desde la API y los inserta en la grilla.
 * También actualiza los contadores de los botones de filtro.
 */
async function cargarCatalogo() {
  const grilla = document.getElementById("grillaProductos");
  if (!grilla) return; // Solo corre en productos.html

  try {
    const datos = await apiFetch("/productos");
    const productos = datos.productos;

    // Renderizar todas las cards
    grilla.innerHTML = productos.map(renderizarCard).join("");

    // Notificar a main.js que los productos ya están en el DOM
    document.dispatchEvent(new CustomEvent("productosListos"));

    // Actualizar los contadores en los botones de filtro
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

/**
 * Carga los productos DESTACADOS para mostrar en index.html.
 */
async function cargarDestacados() {
  const grilla = document.querySelector(".destacados__grilla");
  if (!grilla) return; // Solo corre en index.html

  try {
    const datos = await apiFetch("/productos/destacados");

    // En index.html las imágenes son relativas a la raíz (sin ../)
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

// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  cargarCatalogo();   // Para productos.html
  cargarDestacados(); // Para index.html
});
