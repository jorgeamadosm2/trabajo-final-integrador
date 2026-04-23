/**
 * productos-api.js — Carga y renderiza los productos desde la API.
 *
 * Este archivo tiene dos responsabilidades:
 *   1. cargarCatalogo()   → inserta todos los productos en productos.html
 *   2. cargarDestacados() → inserta los 3 productos destacados en index.html
 *
 * Se coordina con main.js mediante el evento personalizado "productosListos":
 * una vez que los productos están en el DOM, le avisa a main.js para que
 * inicialice los filtros y la paginación.
 *
 * Orden de carga en los HTML: api.js → auth.js → productos-api.js → main.js
 */

/**
 * Genera el HTML completo de una tarjeta de producto.
 *
 * Casos especiales que maneja:
 *   - Badge de etiqueta: "Nuevo" (marrón) o "Popular" (dorado)
 *   - Badge "Sin stock": aparece cuando stock === 0
 *   - Botón "Agregar": deshabilitado si no hay stock
 *   - Precio formateado: usa locale es-AR (puntos como separadores de miles)
 *   - Rutas de imagen: relativas según si estamos en raíz o en /pages/
 *
 * @param {object} producto - Objeto producto devuelto por la API
 * @returns {string} - HTML de la tarjeta como string
 */
function renderizarCard(producto) {
  // Clase especial para el badge "Popular" (color dorado diferente al café)
  const claseEtiqueta = producto.etiqueta === "Popular"
    ? "tarjeta-producto__etiqueta tarjeta-producto__etiqueta--popular"
    : "tarjeta-producto__etiqueta";

  // Renderizar badge de etiqueta solo si tiene una asignada
  const etiquetaHTML = producto.etiqueta
    ? `<div class="${claseEtiqueta}">${producto.etiqueta}</div>`
    : "";

  // Un producto está sin stock cuando el campo existe Y vale exactamente 0
  // (stock=null significa sin control de stock, no sin existencias)
  const sinStock = producto.stock !== null && producto.stock !== undefined && producto.stock === 0;

  // Formatear precio con separador de miles para Argentina (18500 → "18.500")
  const precioFormateado = producto.precio.toLocaleString("es-AR");
  const unidad = producto.unidad ? ` /${producto.unidad}` : "";

  // Ruta de imagen con fallback si no tiene imagen asignada
  const imagenSrc = producto.imagen_url || "../src/img/materia-prima.png";

  // La ruta al formulario de contacto cambia según dónde está el HTML que renderiza
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

/**
 * Carga todos los productos activos desde la API e inserta las tarjetas
 * en la grilla de productos.html.
 *
 * Al terminar, dispara el evento "productosListos" para que main.js
 * inicialice los filtros y la paginación con las tarjetas ya en el DOM.
 * También actualiza los contadores de cantidad por categoría en los botones
 * de filtro.
 */
async function cargarCatalogo() {
  const grilla = document.getElementById("grillaProductos");
  if (!grilla) return; // Esta función solo aplica en productos.html

  try {
    const datos = await apiFetch("/productos");
    const productos = datos.productos;

    // Insertar todas las tarjetas en la grilla
    grilla.innerHTML = productos.map(renderizarCard).join("");

    // Notificar a main.js que el DOM de productos ya está listo
    document.dispatchEvent(new CustomEvent("productosListos"));

    // Contar productos por categoría para mostrar en los botones de filtro
    const contadores = { "materia-prima": 0, "elaborados": 0, "herramientas": 0 };
    productos.forEach((p) => {
      if (contadores[p.categoria] !== undefined) contadores[p.categoria]++;
    });

    // Actualizar el número que aparece entre paréntesis en cada botón de filtro
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
 * Carga los productos marcados como "destacados" para mostrar en index.html.
 *
 * Adapta las rutas de imágenes: en index.html las imágenes son relativas a
 * la raíz del proyecto (sin "../"), a diferencia de las páginas en /pages/.
 */
async function cargarDestacados() {
  const grilla = document.querySelector(".destacados__grilla");
  if (!grilla) return; // Esta función solo aplica en index.html

  try {
    const datos = await apiFetch("/productos/destacados");

    // Ajustar rutas de imagen: en index.html no hay "../" porque está en la raíz
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

// Ejecutar al cargar el DOM — cada función verifica en qué página está antes de correr
document.addEventListener("DOMContentLoaded", () => {
  cargarCatalogo();    // Solo actúa en productos.html (busca #grillaProductos)
  cargarDestacados();  // Solo actúa en index.html (busca .destacados__grilla)
});
