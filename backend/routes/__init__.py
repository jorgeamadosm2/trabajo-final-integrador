# ─────────────────────────────────────────────────────────────────────────────
# routes/__init__.py — Registro central de todos los blueprints
#
# Un Blueprint en Flask es un grupo de rutas relacionadas. En lugar de
# definir todas las rutas en app.py, las organizamos por recurso:
#
#   auth_bp     → /api/auth/*      (login, registro, recuperar contraseña, usuarios)
#   productos_bp → /api/productos/* (catálogo, CRUD de productos)
#   contacto_bp → /api/contacto/*  (formulario de contacto)
#   pedidos_bp  → /api/pedidos/*   (crear y gestionar pedidos)
#
# La función register_blueprints() es llamada desde app.py.
# ─────────────────────────────────────────────────────────────────────────────

from .auth import auth_bp
from .productos import productos_bp
from .contacto import contacto_bp
from .pedidos import pedidos_bp

def register_blueprints(app):
    """Registra todos los blueprints en la aplicación Flask."""
    app.register_blueprint(auth_bp)
    app.register_blueprint(productos_bp)
    app.register_blueprint(contacto_bp)
    app.register_blueprint(pedidos_bp)
