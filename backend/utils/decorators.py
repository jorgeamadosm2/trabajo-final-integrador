from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Usuario

def admin_required(fn):
    """
    Decorator que exige JWT válido Y que el usuario sea admin.
    Uso: @admin_required encima de la función de la ruta.
    """
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        usuario = Usuario.objects(id=user_id).first()
        if not usuario or not usuario.es_admin:
            return jsonify({"ok": False, "error": "Acceso denegado: se requiere rol admin"}), 403
        return fn(*args, **kwargs)
    return wrapper
