# ─────────────────────────────────────────────────────────────────────────────
# routes/auth.py — Rutas de autenticación y gestión de usuarios
#
# Este blueprint agrupa todo lo relacionado con cuentas de usuario:
#   POST /api/auth/register          → crear cuenta nueva
#   POST /api/auth/login             → iniciar sesión, obtener JWT
#   GET  /api/auth/me                → obtener datos del usuario actual
#   POST /api/auth/forgot-password   → solicitar recuperación por email
#   POST /api/auth/reset-password    → confirmar nueva contraseña con token
#   GET  /api/auth/usuarios          → listar usuarios (solo admin)
#   PUT  /api/auth/usuarios/<id>     → editar usuario (solo admin)
#   PATCH /api/auth/usuarios/<id>/estado → activar/desactivar usuario (solo admin)
# ─────────────────────────────────────────────────────────────────────────────

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_mail import Message
from bson.errors import InvalidId
from extensions import mail
from models import Usuario
from utils.decorators import admin_required
import secrets
from datetime import datetime, timedelta

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# ─────────────────────────────────────────────────────────────────────────────
# REGISTRO
# ─────────────────────────────────────────────────────────────────────────────

@auth_bp.post("/register")
def register():
    """
    Registrar un nuevo usuario.

    Body JSON requerido:
      { "nombre": "...", "email": "...", "password": "..." }

    Body JSON opcional para admin:
      { ..., "codigo_admin": "cuerar-admin-2024" }

    Si el código secreto coincide con ADMIN_SECRET_CODE en .env,
    el usuario se registra con es_admin=True y puede acceder al panel.
    """
    data = request.get_json()

    if not data:
        return jsonify({"ok": False, "error": "Body JSON requerido"}), 400

    nombre   = data.get("nombre", "").strip()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")
    codigo_admin = data.get("codigo_admin", "").strip()

    # Validaciones básicas de campos requeridos
    if not nombre or not email or not password:
        return jsonify({"ok": False, "error": "nombre, email y password son requeridos"}), 400

    if len(password) < 6:
        return jsonify({"ok": False, "error": "La contraseña debe tener al menos 6 caracteres"}), 400

    # Verificar que el email no esté ya registrado
    if Usuario.objects(email=email).first():
        return jsonify({"ok": False, "error": "Ya existe un usuario con ese email"}), 409

    # Determinar si el usuario es admin comparando el código secreto
    es_admin = (codigo_admin == current_app.config["ADMIN_SECRET_CODE"])

    # Crear el usuario (set_password hashea la contraseña automáticamente)
    usuario = Usuario(nombre=nombre, email=email, es_admin=es_admin)
    usuario.set_password(password)
    usuario.save()

    return jsonify({
        "ok": True,
        "mensaje": "Usuario creado" + (" (admin)" if es_admin else ""),
        "usuario": usuario.to_dict()
    }), 201


# ─────────────────────────────────────────────────────────────────────────────
# LOGIN
# ─────────────────────────────────────────────────────────────────────────────

@auth_bp.post("/login")
def login():
    """
    Iniciar sesión.

    Body JSON: { "email": "...", "password": "..." }

    Devuelve un JWT access_token que el frontend guarda en localStorage
    y envía en cada petición autenticada como: Authorization: Bearer <token>
    """
    data = request.get_json()

    if not data:
        return jsonify({"ok": False, "error": "Body JSON requerido"}), 400

    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    usuario = Usuario.objects(email=email).first()

    # Mensaje genérico para no revelar si el email existe o la contraseña es incorrecta
    if not usuario or not usuario.check_password(password):
        return jsonify({"ok": False, "error": "Email o contraseña incorrectos"}), 401

    # Verificar que la cuenta esté activa (no dada de baja por el admin)
    if not usuario.activo:
        return jsonify({"ok": False, "error": "Tu cuenta ha sido desactivada. Contactá al administrador."}), 403

    # Crear token JWT — el "identity" es el ID del usuario (se recupera luego con get_jwt_identity())
    # El token expira en 24 horas (configurado en config.py como JWT_ACCESS_TOKEN_EXPIRES)
    access_token = create_access_token(identity=str(usuario.id))

    return jsonify({
        "ok": True,
        "access_token": access_token,
        "usuario": usuario.to_dict()
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# PERFIL DEL USUARIO ACTUAL
# ─────────────────────────────────────────────────────────────────────────────

@auth_bp.get("/me")
@jwt_required()
def me():
    """
    Obtener los datos del usuario actualmente logueado.

    Header requerido: Authorization: Bearer <token>
    Útil para que el frontend sepa si el token sigue siendo válido
    y para obtener datos actualizados del usuario.
    """
    user_id = get_jwt_identity()
    usuario = Usuario.objects(id=user_id).first()

    if not usuario:
        return jsonify({"ok": False, "error": "Usuario no encontrado"}), 404

    return jsonify({"ok": True, "usuario": usuario.to_dict()}), 200


# ─────────────────────────────────────────────────────────────────────────────
# RECUPERACIÓN DE CONTRASEÑA
# ─────────────────────────────────────────────────────────────────────────────

@auth_bp.post("/forgot-password")
def forgot_password():
    """
    Paso 1 del flujo de recuperación: solicitar el email de reset.

    Body JSON: { "email": "..." }

    Genera un token seguro de 32 bytes, lo guarda en el usuario con
    una expiración de 1 hora, y envía un email con el link de reset.

    La respuesta es SIEMPRE la misma (éxito) para no revelar si el
    email está registrado o no (protección contra enumeración de usuarios).
    """
    data = request.get_json()
    if not data:
        return jsonify({"ok": False, "error": "Body JSON requerido"}), 400

    email = data.get("email", "").strip().lower()
    if not email:
        return jsonify({"ok": False, "error": "El email es requerido"}), 400

    usuario = Usuario.objects(email=email).first()

    # Respuesta genérica: no revelamos si el email existe en nuestra BD
    if not usuario:
        return jsonify({"ok": True, "mensaje": "Si el email existe, recibirás las instrucciones."}), 200

    # Generar token criptográficamente seguro y guardarlo con expiración de 1 hora
    token = secrets.token_urlsafe(32)
    usuario.reset_token = token
    usuario.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    usuario.save()

    # Construir el link que se enviará al usuario
    frontend_url = current_app.config.get("FRONTEND_URL", "")
    reset_link = f"{frontend_url}/pages/nueva-contrasena.html?token={token}"

    # Enviar email con HTML estilizado usando Flask-Mail
    msg = Message(
        subject="Recuperar contraseña - CUERAR TUCUMÁN",
        recipients=[email],
        html=f"""
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px;">
            <h2 style="color:#8B4513;">CUERAR TUCUMÁN</h2>
            <p>Hola <strong>{usuario.nombre}</strong>,</p>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
            <p>Hacé clic en el botón para crear una nueva contraseña. El link es válido por <strong>1 hora</strong>.</p>
            <a href="{reset_link}"
               style="display:inline-block;background:#8B4513;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">
               Restablecer contraseña
            </a>
            <p style="font-size:12px;color:#888;">Si no solicitaste esto, ignorá este email. Tu contraseña no cambiará.</p>
        </div>
        """
    )
    mail.send(msg)

    return jsonify({"ok": True, "mensaje": "Si el email existe, recibirás las instrucciones."}), 200


@auth_bp.post("/reset-password")
def reset_password():
    """
    Paso 2 del flujo de recuperación: confirmar la nueva contraseña con el token.

    Body JSON: { "token": "...", "password": "nueva-contraseña" }

    Verifica que el token exista y no haya expirado, luego hashea
    y guarda la nueva contraseña, y borra el token para que no pueda
    usarse de nuevo.
    """
    data = request.get_json()
    if not data:
        return jsonify({"ok": False, "error": "Body JSON requerido"}), 400

    token    = data.get("token", "").strip()
    password = data.get("password", "")

    if not token or not password:
        return jsonify({"ok": False, "error": "token y password son requeridos"}), 400

    if len(password) < 6:
        return jsonify({"ok": False, "error": "La contraseña debe tener al menos 6 caracteres"}), 400

    # Buscar el usuario por el token
    usuario = Usuario.objects(reset_token=token).first()

    # Verificar que el token exista Y no haya expirado
    if not usuario or usuario.reset_token_expires < datetime.utcnow():
        return jsonify({"ok": False, "error": "El link es inválido o ha expirado"}), 400

    # Actualizar contraseña y limpiar el token para que no pueda reutilizarse
    usuario.set_password(password)
    usuario.reset_token = None
    usuario.reset_token_expires = None
    usuario.save()

    return jsonify({"ok": True, "mensaje": "Contraseña actualizada correctamente"}), 200


# ─────────────────────────────────────────────────────────────────────────────
# ABM DE USUARIOS (solo admin)
# ─────────────────────────────────────────────────────────────────────────────

@auth_bp.get("/usuarios")
@admin_required
def listar_usuarios():
    """
    GET /api/auth/usuarios — Lista todos los usuarios del sistema.

    Requiere: JWT de un usuario con es_admin=True.
    El admin que hace la consulta no aparece en su propia lista
    para evitar que se auto-gestione accidentalmente.
    """
    user_id = get_jwt_identity()

    # id__ne = "id not equal" — excluye al admin que está consultando
    usuarios = Usuario.objects(id__ne=user_id).order_by("nombre")

    return jsonify({
        "ok": True,
        "total": usuarios.count(),
        "usuarios": [u.to_dict() for u in usuarios]
    }), 200


@auth_bp.put("/usuarios/<usuario_id>")
@admin_required
def editar_usuario(usuario_id):
    """
    PUT /api/auth/usuarios/<id> — Edita nombre y/o rol de un usuario.

    Requiere: JWT admin.
    Body JSON: { "nombre": "...", "es_admin": true/false }
    """
    try:
        usuario = Usuario.objects(id=usuario_id).first()
    except InvalidId:
        return jsonify({"ok": False, "error": "ID inválido"}), 400

    if not usuario:
        return jsonify({"ok": False, "error": "Usuario no encontrado"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"ok": False, "error": "Body JSON requerido"}), 400

    nombre = data.get("nombre", "").strip()
    if not nombre:
        return jsonify({"ok": False, "error": "El campo 'nombre' es requerido"}), 400

    usuario.nombre   = nombre
    usuario.es_admin = bool(data.get("es_admin", usuario.es_admin))
    usuario.save()

    return jsonify({"ok": True, "usuario": usuario.to_dict()}), 200


@auth_bp.patch("/usuarios/<usuario_id>/estado")
@admin_required
def toggle_estado_usuario(usuario_id):
    """
    PATCH /api/auth/usuarios/<id>/estado — Activa o desactiva un usuario (baja lógica).

    Requiere: JWT admin.
    Body JSON: { "activo": true/false }

    Un usuario desactivado no puede iniciar sesión pero su historial
    de pedidos y datos quedan intactos en la base de datos.
    """
    try:
        usuario = Usuario.objects(id=usuario_id).first()
    except InvalidId:
        return jsonify({"ok": False, "error": "ID inválido"}), 400

    if not usuario:
        return jsonify({"ok": False, "error": "Usuario no encontrado"}), 404

    data = request.get_json()
    if data is None or "activo" not in data:
        return jsonify({"ok": False, "error": "El campo 'activo' es requerido"}), 400

    usuario.activo = bool(data["activo"])
    usuario.save()

    estado = "activado" if usuario.activo else "desactivado"
    return jsonify({"ok": True, "mensaje": f"Usuario {estado} correctamente", "usuario": usuario.to_dict()}), 200
