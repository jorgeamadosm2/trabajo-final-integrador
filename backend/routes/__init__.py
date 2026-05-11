from .auth import auth_bp
from .productos import productos_bp
from .contacto import contacto_bp
from .pedidos import pedidos_bp

def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(productos_bp)
    app.register_blueprint(contacto_bp)
    app.register_blueprint(pedidos_bp)
