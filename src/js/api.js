// URL base del backend. En desarrollo cambiar a: http://127.0.0.1:5000/api
const API_BASE = "https://trabajo-final-integrador-58s4.onrender.com/api";

// ── Notificaciones toast ─────────────────────────────────────────────────────
// Muestra un mensaje flotante en pantalla (éxito o error) durante 3.2 segundos.
// Reutiliza el mismo elemento si ya existe para evitar duplicados.
function mostrarNotificacion(mensaje, tipo = 'exito') {
  let toast = document.getElementById('notifToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'notifToast';
    document.body.appendChild(toast);
  }
  toast.className = `notif-toast notif-toast--${tipo}`;
  toast.textContent = (tipo === 'exito' ? '✓ ' : '✕ ') + mensaje;
  void toast.offsetWidth; // forzar reflow para reiniciar la animación CSS
  toast.classList.add('notif-toast--visible');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('notif-toast--visible'), 3200);
}

// ── Cliente HTTP central ─────────────────────────────────────────────────────
// Wrapper sobre fetch que agrega el token JWT automáticamente y maneja errores
// globales (401 = sesión expirada → limpiar y redirigir al login).
async function apiFetch(path, opciones = {}) {
  const token = localStorage.getItem("admin_token");

  const headers = {
    "Content-Type": "application/json",
    ...opciones.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const respuesta = await fetch(API_BASE + path, { ...opciones, headers });
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    // 401 fuera del login = token expirado, limpiar sesión y redirigir
    if (respuesta.status === 401 && !window.location.pathname.includes("login.html")) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("usuario_data");
      const enPages = window.location.pathname.includes("/pages/");
      window.location.href = (enPages ? "../" : "") + "pages/login.html";
      return;
    }
    throw new Error(datos.error || datos.errores?.join(", ") || "Error en la API");
  }

  return datos;
}
