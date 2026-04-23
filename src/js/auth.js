/**
 * auth.js — Gestión de sesión y autenticación en el frontend.
 *
 * Responsabilidades:
 *   1. Guardar y leer el token JWT y datos del usuario en localStorage
 *   2. Detectar si hay un usuario logueado y si es admin
 *   3. Actualizar dinámicamente el navbar según el estado de sesión
 *   4. Proveer la función logout()
 *
 * Flujo de autenticación:
 *   Login → backend devuelve JWT → guardarSesion() → navbar se actualiza
 *   Logout → cerrarSesion() → redirigir a index.html
 *
 * Este archivo se carga ANTES que main.js en todas las páginas HTML.
 * Las claves en localStorage son:
 *   "admin_token"   → el JWT (string)
 *   "usuario_data"  → los datos del usuario como JSON string
 */

// ─── Helpers de almacenamiento ────────────────────────────────────────────────

/** Guarda el token JWT y los datos del usuario al iniciar sesión. */
function guardarSesion(token, usuario) {
  localStorage.setItem("admin_token", token);
  localStorage.setItem("usuario_data", JSON.stringify(usuario));
}

/** Elimina el token y los datos del usuario al cerrar sesión. */
function cerrarSesion() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("usuario_data");
}

/** Retorna el token JWT o null si no hay sesión activa. */
function getToken() {
  return localStorage.getItem("admin_token");
}

/** Retorna el objeto usuario (nombre, email, es_admin) o null. */
function getUsuario() {
  const data = localStorage.getItem("usuario_data");
  return data ? JSON.parse(data) : null;
}

/** Retorna true si hay un token guardado (usuario logueado). */
function estaLogueado() {
  return !!getToken();
}

/** Retorna true si el usuario logueado tiene rol de administrador. */
function esAdmin() {
  const usuario = getUsuario();
  return usuario ? usuario.es_admin === true : false;
}

// ─── Navbar dinámico ──────────────────────────────────────────────────────────

/**
 * Calcula el prefijo de ruta correcto según la ubicación del HTML actual.
 * Las páginas en /pages/ necesitan "../" para llegar a la raíz del proyecto.
 */
function getPrefijo() {
  return window.location.pathname.includes("/pages/") ? "../" : "";
}

/**
 * Actualiza la sección de autenticación del navbar (#navAuth) según
 * si el usuario está logueado o no, y si es admin o cliente.
 *
 * Se llama automáticamente al cargar la página (DOMContentLoaded).
 *
 * Casos:
 *   - Visitante: muestra botón "Iniciar Sesión"
 *   - Cliente logueado: muestra nombre + badge "Usuario" + botón "Salir"
 *   - Admin logueado: muestra enlace "Panel Admin" + badge "Admin" + "Salir"
 */
function inicializarNavbar() {
  const contenedor = document.getElementById("navAuth");
  if (!contenedor) return;

  const prefijo = getPrefijo();

  if (!estaLogueado()) {
    // Visitante sin sesión: mostrar solo botón de login
    contenedor.innerHTML = `
      <a href="${prefijo}pages/login.html" class="nav-auth__boton nav-auth__boton--login">
        Iniciar Sesión
      </a>
    `;
    return;
  }

  const usuario = getUsuario();
  const nombreCorto = usuario.nombre.split(" ")[0]; // Solo el primer nombre para que quepa en el navbar

  // Enlace al panel admin (solo visible para admins)
  const enlaceAdmin = esAdmin()
    ? `<a href="${prefijo}pages/admin.html" class="nav-auth__enlace-admin">⚙ Panel Admin</a>`
    : "";

  // Badge de rol: color diferente para admin vs usuario normal
  const rolBadge = esAdmin()
    ? `<span class="nav-auth__rol nav-auth__rol--admin">Admin</span>`
    : `<span class="nav-auth__rol nav-auth__rol--usuario">Usuario</span>`;

  contenedor.innerHTML = `
    <div class="nav-auth__usuario">
      ${enlaceAdmin}
      <span class="nav-auth__nombre">Hola, ${nombreCorto}</span>
      ${rolBadge}
      <button class="nav-auth__boton nav-auth__boton--logout" onclick="logout()">
        Salir
      </button>
    </div>
  `;
}

/**
 * Cierra la sesión del usuario:
 * limpia localStorage y redirige a la página de inicio.
 */
function logout() {
  cerrarSesion();
  const prefijo = getPrefijo();
  window.location.href = prefijo + "index.html";
}

// ─── Inicializar al cargar el DOM ─────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", inicializarNavbar);
