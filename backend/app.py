from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import mongoengine

from config import Config

jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Conectar a MongoDB Atlas
    mongoengine.connect(host=app.config["MONGO_URI"])

    # Inicializar extensiones
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "null"  # permite abrir el HTML directamente como archivo
    ]}})

    # Registrar blueprints (rutas)
    from routes import register_blueprints
    register_blueprints(app)

    @app.get("/")
    def index():
        return {"ok": True, "mensaje": "API CUERAR TUCUMÁN funcionando"}

    return app
