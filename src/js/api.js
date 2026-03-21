/**
 * api.js — Cliente central para comunicarse con el backend Flask.
 * Todos los demás archivos JS usan esta función para hacer peticiones.
 */

const API_BASE = "https://trabajo-final-integrador-58s4.onrender.com/api";

/**
 * Hace una petición HTTP a la API.
 * Agrega automáticamente el token JWT si existe en localStorage.
 *
 * @param {string} path  - Ruta relativa, ej: "/productos"
 * @param {object} opciones - Opciones de fetch (method, body, etc.)
 * @returns {Promise<object>} - La respuesta JSON de la API
 */
async function apiFetch(path, opciones = {}) {
  const token = localStorage.getItem("admin_token");

  const headers = {
    "Content-Type": "application/json",
    ...opciones.headers,
  };

  // Si hay un token guardado, lo agrega al header de autorización
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const respuesta = await fetch(API_BASE + path, { ...opciones, headers });
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    // Lanza un error con el mensaje que devuelve la API
    throw new Error(datos.error || datos.errores?.join(", ") || "Error en la API");
  }

  return datos;
}
