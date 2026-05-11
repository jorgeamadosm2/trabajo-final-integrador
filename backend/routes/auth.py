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


@auth_bp.post("/register")
def register():
    data = request.get_json()
    if not data:
        return jsonify({"ok": False, "error": "Body JSON requerido"}), 400

    nombre       = data.get("nombre", "").strip()
    email        = data.get("email", "").strip().lower()
    password     = data.get("password", "")
    codigo_admin = data.get("codigo_admin", "").strip()

    if not nombre or not email or not password:
        return jsonify({"ok": False, "error": "nombre, email y password son requeridos"}), 400

    if len(password) < 6:
        return jsonify({"ok": False, "error": "La contraseña debe tener al menos 6 caracteres"}), 400

    if Usuario.objects(email=email).first():
        return jsonify({"ok": False, "error": "Ya existe un usuario con ese email"}), 409

    es_admin = (codigo_admin == current_app.config["ADMIN_SECRET_CODE"])
    usuario  = Usuario(nombre=nombre, email=email, es_admin=es_admin)
    usuario.set_password(password)
    usuario.save()

    return jsonify({
        "ok": True,
        "mensaje": "Usuario creado" + (" (admin)" if es_admin else ""),
        "usuario": usuario.to_dict()
    }), 201


@auth_bp.post("/login")
def login():
    data = request.get_json()
    if not data:
        return jsonify({"ok": False, "error": "Body JSON requerido"}), 400

    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")
    usuario  = Usuario.objects(email=email).first()

    # Mensaje genérico para no revelar si el email existe
    if not usuario or not usuario.check_password(password):
        return jsonify({"ok": False, "error": "Email o contraseña incorrectos"}), 401

    if not usuario.activo:
        return jsonify({"ok": False, "error": "Tu cuenta ha sido desactivada. Contactá al administrador."}), 403

    access_token = create_access_token(identity=str(usuario.id))
    return jsonify({
        "ok": True,
        "access_token": access_token,
        "usuario": usuario.to_dict()
    }), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    usuario = Usuario.objects(id=get_jwt_identity()).first()
    if not usuario:
        return jsonify({"ok": False, "error": "Usuario no encontrado"}), 404
    return jsonify({"ok": True, "usuario": usuario.to_dict()}), 200


@auth_bp.post("/forgot-password")
def forgot_password():
    data = request.get_json()
    if not data:
        return jsonify({"ok": False, "error": "Body JSON requerido"}), 400

    email = data.get("email", "").strip().lower()
    if not email:
        return jsonify({"ok": False, "error": "El email es requerido"}), 400

    usuario = Usuario.objects(email=email).first()

    # Respuesta genérica para no revelar si el email está registrado
    if not usuario:
        return jsonify({"ok": True, "mensaje": "Si el email existe, recibirás las instrucciones."}), 200

    token = secrets.token_urlsafe(32)
    usuario.reset_token         = token
    usuario.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    usuario.save()

    frontend_url = current_app.config.get("FRONTEND_URL", "")
    reset_link   = f"{frontend_url}/pages/nueva-contrasena.html?token={token}"

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
    data = request.get_json()
    if not data:
        return jsonify({"ok": False, "error": "Body JSON requerido"}), 400

    token    = data.get("token", "").strip()
    password = data.get("password", "")

    if not token or not password:
        return jsonify({"ok": False, "error": "token y password son requeridos"}), 400

    if len(password) < 6:
        return jsonify({"ok": False, "error": "La contraseña debe tener al menos 6 caracteres"}), 400

    usuario = Usuario.objects(reset_token=token).first()

    if not usuario or usuario.reset_token_expires < datetime.utcnow():
        return jsonify({"ok": False, "error": "El link es inválido o ha expirado"}), 400

    usuario.set_password(password)
    usuario.reset_token         = None
    usuario.reset_token_expires = None
    usuario.save()

    return jsonify({"ok": True, "mensaje": "Contraseña actualizada correctamente"}), 200


@auth_bp.get("/usuarios")
@admin_required
def listar_usuarios():
    user_id  = get_jwt_identity()
    usuarios = Usuario.objects(id__ne=user_id).order_by("nombre")
    return jsonify({
        "ok":       True,
        "total":    usuarios.count(),
        "usuarios": [u.to_dict() for u in usuarios]
    }), 200


@auth_bp.put("/usuarios/<usuario_id>")
@admin_required
def editar_usuario(usuario_id):
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
