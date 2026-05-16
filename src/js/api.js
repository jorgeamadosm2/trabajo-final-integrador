// Dirección base del servidor. Cuando trabajo en local cambio esto a http://127.0.0.1:5000/api
const API_BASE = "https://trabajo-final-integrador-58s4.onrender.com/api";

// ── Notificaciones toast ─────────────────────────────────────────────────────

// Esta función muestra un mensajito flotante al usuario, ya sea de éxito o de error.
// Lo primero que hago es ver si el elemento ya existe en el DOM para no crearlo dos veces.
// Si no existe, lo creo y lo agrego al body.
function mostrarNotificacion(mensaje, tipo = 'exito') {
  let toast = document.getElementById('notifToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'notifToast';
    document.body.appendChild(toast);
  }

  // Le pongo la clase correspondiente según si es éxito o error, eso controla el color en CSS
  toast.className = `notif-toast notif-toast--${tipo}`;
  toast.textContent = (tipo === 'exito' ? '✓ ' : '✕ ') + mensaje;

  // Acceder a offsetWidth fuerza al navegador a recalcular el layout,
  // lo que reinicia la animación si el toast ya estaba visible
  void toast.offsetWidth;

  toast.classList.add('notif-toast--visible');

  // Cancelo el timeout anterior por si el usuario dispara dos notificaciones seguidas
  clearTimeout(toast._timeout);

  // A los 3.2 segundos lo oculto quitándole la clase visible
  toast._timeout = setTimeout(() => toast.classList.remove('notif-toast--visible'), 3200);
}

// ── Cliente HTTP central ─────────────────────────────────────────────────────

// Acá centralizo todas las llamadas al backend. En vez de escribir fetch() en cada lado,
// uso esta función que ya se encarga de poner el token y manejar errores comunes.
async function apiFetch(path, opciones = {}) {

  // Busco el token guardado después del login. Si no hay sesión activa, token queda null.
  const token = localStorage.getItem("admin_token");

  // Armo los headers, empezando por el Content-Type y luego mezclo los que vengan de afuera
  const headers = {
    "Content-Type": "application/json",
    ...opciones.headers,
  };

  // Si hay token lo agrego como Bearer, que es el esquema que espera el backend con Flask-JWT
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const respuesta = await fetch(API_BASE + path, { ...opciones, headers });
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    // Si el servidor devuelve 401 y no estoy en la página de login, significa que
    // el token venció. En ese caso limpio el localStorage y mando al usuario a loguear de nuevo.
    if (respuesta.status === 401 && !window.location.pathname.includes("login.html")) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("usuario_data");

      // Ajusto la ruta relativa dependiendo de si estoy dentro de /pages/ o en la raíz
      const enPages = window.location.pathname.includes("/pages/");
      window.location.href = (enPages ? "../" : "") + "pages/login.html";
      return;
    }

    // Para cualquier otro error muestro el mensaje que mandó el backend
    throw new Error(datos.error || datos.errores?.join(", ") || "Error en la API");
  }

  // Si todo salió bien devuelvo los datos para que los use quien llamó a esta función
  return datos;
}
