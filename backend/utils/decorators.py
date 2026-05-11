from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Usuario

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        usuario = Usuario.objects(id=get_jwt_identity()).first()
        if not usuario or not usuario.es_admin:
            return jsonify({"ok": False, "error": "Acceso denegado: se requiere rol admin"}), 403
        return fn(*args, **kwargs)
    return wrapper
