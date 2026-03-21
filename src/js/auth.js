/**
 * auth.js — Manejo de autenticación en el frontend.
 * Carga antes de main.js en todas las páginas.
 *
 * Responsabilidades:
 *  - Guardar/leer token y datos del usuario en localStorage
 *  - Actualizar el navbar según el estado de sesión
 *  - Funciones de login, registro y logout
 */

// ─── Helpers de almacenamiento ────────────────────────────────────────────────

function guardarSesion(token, usuario) {
  localStorage.setItem("admin_token", token);
  localStorage.setItem("usuario_data", JSON.stringify(usuario));
}

function cerrarSesion() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("usuario_data");
}

function getToken() {
  return localStorage.getItem("admin_token");
}

function getUsuario() {
  const data = localStorage.getItem("usuario_data");
  return data ? JSON.parse(data) : null;
}

function estaLogueado() {
  return !!getToken();
}

function esAdmin() {
  const usuario = getUsuario();
  return usuario ? usuario.es_admin === true : false;
}

// ─── Navbar dinámico ──────────────────────────────────────────────────────────

/**
 * Detecta si la página actual está dentro de /pages/ para
 * calcular correctamente las rutas relativas de los links.
 */
function getPrefijo() {
  return window.location.pathname.includes("/pages/") ? "../" : "";
}

/**
 * Actualiza la sección de autenticación en el navbar.
 * Se llama en cada carga de página.
 */
function inicializarNavbar() {
  const contenedor = document.getElementById("navAuth");
  if (!contenedor) return;

  const prefijo = getPrefijo();

  if (!estaLogueado()) {
    // Visitante: mostrar botón de ingreso
    contenedor.innerHTML = `
      <a href="${prefijo}pages/login.html" class="nav-auth__boton nav-auth__boton--login">
        Iniciar Sesión
      </a>
    `;
    return;
  }

  const usuario = getUsuario();
  const nombreCorto = usuario.nombre.split(" ")[0]; // Solo el primer nombre

  // Usuario logueado: mostrar nombre + rol + logout
  const enlaceAdmin = esAdmin()
    ? `<a href="${prefijo}pages/admin.html" class="nav-auth__enlace-admin">⚙ Panel Admin</a>`
    : "";

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
 * Cierra la sesión y redirige al inicio.
 */
function logout() {
  cerrarSesion();
  const prefijo = getPrefijo();
  window.location.href = prefijo + "index.html";
}

// ─── Inicializar al cargar ────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", inicializarNavbar);
