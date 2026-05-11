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

function getPrefijo() {
  return window.location.pathname.includes("/pages/") ? "../" : "";
}

function inicializarNavbar() {
  const contenedor = document.getElementById("navAuth");
  if (!contenedor) return;

  const prefijo = getPrefijo();

  if (!estaLogueado()) {
    contenedor.innerHTML = `
      <a href="${prefijo}pages/login.html" class="nav-auth__boton nav-auth__boton--login">
        Iniciar Sesión
      </a>
    `;
    return;
  }

  const usuario     = getUsuario();
  const nombreCorto = usuario.nombre.split(" ")[0];

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

function logout() {
  cerrarSesion();
  window.location.href = getPrefijo() + "index.html";
}

document.addEventListener("DOMContentLoaded", inicializarNavbar);
