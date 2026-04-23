# ─────────────────────────────────────────────────────────────────────────────
# utils/decorators.py — Decoradores personalizados para las rutas Flask
#
# Un decorador en Python es una función que "envuelve" a otra función para
# agregar comportamiento antes o después de ejecutarla.
#
# @admin_required hace dos verificaciones en secuencia:
#   1. ¿Hay un token JWT válido en el header Authorization?  (flask-jwt-extended)
#   2. ¿El usuario del token tiene es_admin=True?            (consulta a MongoDB)
#
# Si falla cualquiera de las dos, devuelve 401 o 403 sin ejecutar la ruta.
# ─────────────────────────────────────────────────────────────────────────────

from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Usuario

def admin_required(fn):
    """
    Decorador que protege una ruta exigiendo JWT válido + rol admin.

    Uso:
        @productos_bp.delete("/<id>")
        @admin_required
        def eliminar_producto(id):
            ...

    Respuestas de error:
        401 — Token ausente, expirado o mal formado
        403 — Token válido pero el usuario no es admin
    """
    @wraps(fn)  # Preserva el nombre y docstring de la función original
    @jwt_required()  # Primero verificar que el JWT sea válido
    def wrapper(*args, **kwargs):
        # Obtener el ID del usuario desde el payload del JWT
        user_id = get_jwt_identity()

        # Consultar la base de datos para verificar si es admin
        usuario = Usuario.objects(id=user_id).first()

        if not usuario or not usuario.es_admin:
            return jsonify({"ok": False, "error": "Acceso denegado: se requiere rol admin"}), 403

        # Todo OK: ejecutar la función original de la ruta
        return fn(*args, **kwargs)
    return wrapper
