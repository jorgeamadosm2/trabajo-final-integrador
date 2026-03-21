from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import Usuario

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    """
    Registrar un nuevo usuario admin.
    Body JSON: { "nombre": "...", "email": "...", "password": "..." }
    """
    data = request.get_json()

    # Validaciones básicas
    if not data:
        return jsonify({"ok": False, "error": "Body JSON requerido"}), 400

    nombre   = data.get("nombre", "").strip()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not nombre or not email or not password:
        return jsonify({"ok": False, "error": "nombre, email y password son requeridos"}), 400

    if len(password) < 6:
        return jsonify({"ok": False, "error": "La contraseña debe tener al menos 6 caracteres"}), 400

    # Verificar que el email no esté en uso
    if Usuario.objects(email=email).first():
        return jsonify({"ok": False, "error": "Ya existe un usuario con ese email"}), 409

    # Crear y guardar usuario
    usuario = Usuario(nombre=nombre, email=email)
    usuario.set_password(password)
    usuario.save()

    return jsonify({"ok": True, "mensaje": "Usuario creado", "usuario": usuario.to_dict()}), 201


@auth_bp.post("/login")
def login():
    """
    Iniciar sesión.
    Body JSON: { "email": "...", "password": "..." }
    Devuelve un JWT access_token.
    """
    data = request.get_json()

    if not data:
        return jsonify({"ok": False, "error": "Body JSON requerido"}), 400

    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    usuario = Usuario.objects(email=email).first()

    if not usuario or not usuario.check_password(password):
        return jsonify({"ok": False, "error": "Email o contraseña incorrectos"}), 401

    # Crear token JWT — el identity es el ID del usuario como string
    access_token = create_access_token(identity=str(usuario.id))

    return jsonify({
        "ok": True,
        "access_token": access_token,
        "usuario": usuario.to_dict()
    }), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    """
    Obtener el usuario actualmente logueado.
    Header requerido: Authorization: Bearer <token>
    """
    user_id = get_jwt_identity()
    usuario = Usuario.objects(id=user_id).first()

    if not usuario:
        return jsonify({"ok": False, "error": "Usuario no encontrado"}), 404

    return jsonify({"ok": True, "usuario": usuario.to_dict()}), 200
