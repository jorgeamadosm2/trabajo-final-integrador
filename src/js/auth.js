// ── Manejo de sesión con localStorage ───────────────────────────────────────
// Uso localStorage para guardar el token JWT y los datos del usuario porque
// necesito que persistan entre páginas sin depender de cookies ni del servidor.

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

// El dato del usuario se guardó como string JSON, así que hay que parsearlo al leerlo
function getUsuario() {
  const data = localStorage.getItem("usuario_data");
  return data ? JSON.parse(data) : null;
}

// Estas dos las uso en varios archivos para saber si hay sesión activa o si es admin
function estaLogueado() {
  return !!getToken();
}

function esAdmin() {
  const usuario = getUsuario();
  return usuario ? usuario.es_admin === true : false;
}

// ── Prefijo para rutas relativas ─────────────────────────────────────────────
// El problema es que algunos HTML están en /pages/ y otros en la raíz.
// Si estoy en /pages/ y quiero ir a login.html, necesito subir un nivel con "../".
// Esta función me evita hardcodear el path en cada archivo.
function getPrefijo() {
  return window.location.pathname.includes("/pages/") ? "../" : "";
}

// ── Navbar dinámica ──────────────────────────────────────────────────────────
// Dependiendo del estado de sesión, muestro un botón de login o los datos del usuario.
// Lo inyecto directo en el div #navAuth que está en el HTML.
function inicializarNavbar() {
  const contenedor = document.getElementById("navAuth");
  if (!contenedor) return;

  const prefijo = getPrefijo();

  // Si no hay sesión activa, solo muestro el botón de login
  if (!estaLogueado()) {
    contenedor.innerHTML = `
      <a href="${prefijo}pages/login.html" class="nav-auth__boton nav-auth__boton--login">
        Iniciar Sesión
      </a>
    `;
    return;
  }

  const usuario     = getUsuario();
  const nombreCorto = usuario.nombre.split(" ")[0]; // solo el primer nombre para que no quede largo

  // El enlace al panel admin solo aparece si el usuario tiene ese rol
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

// ── Logout ───────────────────────────────────────────────────────────────────
// Limpia el localStorage y manda a la home, calculando el path según dónde esté
function logout() {
  cerrarSesion();
  window.location.href = getPrefijo() + "index.html";
}

document.addEventListener("DOMContentLoaded", inicializarNavbar);
