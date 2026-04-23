/**
 * api.js — Cliente HTTP centralizado para comunicarse con el backend Flask.
 *
 * TODOS los archivos JS que necesiten datos del servidor usan esta función.
 * Centralizar las peticiones aquí permite:
 *   - Agregar el token JWT automáticamente en cada petición autenticada
 *   - Manejar errores de autenticación (401) en un solo lugar
 *   - Cambiar la URL base del servidor sin tocar otros archivos
 *
 * Orden de carga en los HTML: api.js debe cargarse PRIMERO, antes de
 * auth.js, productos-api.js, carrito.js, etc.
 */

// URL base del backend. En desarrollo local cambiar a: http://127.0.0.1:5000/api
const API_BASE = "https://trabajo-final-integrador-58s4.onrender.com/api";

/**
 * Muestra una notificación tipo toast en la esquina superior derecha.
 * @param {string} mensaje - Texto a mostrar
 * @param {'exito'|'error'} tipo - Color del toast
 */
function mostrarNotificacion(mensaje, tipo = 'exito') {
  let toast = document.getElementById('notifToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'notifToast';
    document.body.appendChild(toast);
  }
  toast.className = `notif-toast notif-toast--${tipo}`;
  toast.textContent = (tipo === 'exito' ? '✓ ' : '✕ ') + mensaje;
  void toast.offsetWidth; // forzar reflow para reiniciar la transición
  toast.classList.add('notif-toast--visible');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('notif-toast--visible'), 3200);
}

/**
 * Hace una petición HTTP a la API del backend.
 *
 * Agrega automáticamente el token JWT si existe en localStorage,
 * y maneja el caso de token expirado redirigiendo al login.
 *
 * @param {string} path      - Ruta relativa al endpoint, ej: "/productos"
 * @param {object} opciones  - Opciones de fetch: method, body, headers adicionales
 * @returns {Promise<object>} - El objeto JSON devuelto por la API
 * @throws {Error}           - Si la respuesta no es OK (status >= 400)
 *
 * Ejemplos de uso:
 *   const datos = await apiFetch("/productos");
 *   const nuevo = await apiFetch("/productos", { method: "POST", body: JSON.stringify({...}) });
 */
async function apiFetch(path, opciones = {}) {
  // Obtener el token JWT guardado al iniciar sesión
  const token = localStorage.getItem("admin_token");

  const headers = {
    "Content-Type": "application/json",
    ...opciones.headers,  // Permitir headers adicionales del llamador
  };

  // Si hay un token, incluirlo como Bearer token en el header de autorización
  // El backend Flask-JWT verifica este header en cada ruta protegida
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const respuesta = await fetch(API_BASE + path, { ...opciones, headers });
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    // 401 = Token vencido, inválido o ausente.
    // Si estamos en la página de login el 401 significa credenciales incorrectas,
    // no token expirado, así que dejamos que el formulario maneje el error.
    if (respuesta.status === 401 && !window.location.pathname.includes("login.html")) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("usuario_data");
      const enPages = window.location.pathname.includes("/pages/");
      window.location.href = (enPages ? "../" : "") + "pages/login.html";
      return;
    }
    // Para otros errores (400, 401 en login, 403, 404, 500), lanzar el mensaje que envió la API
    throw new Error(datos.error || datos.errores?.join(", ") || "Error en la API");
  }

  return datos;
}
