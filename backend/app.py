# ─────────────────────────────────────────────────────────────────────────────
# app.py — Application Factory de Flask
#
# En lugar de crear la app como variable global, usamos una función create_app().
# Esto permite crear múltiples instancias (por ejemplo, una para tests y otra
# para producción) sin conflictos de estado global.
#
# Responsabilidades de este archivo:
#   1. Cargar la configuración desde config.py
#   2. Conectar a la base de datos MongoDB Atlas
#   3. Inicializar las extensiones JWT y Mail
#   4. Configurar CORS (qué dominios pueden hacer peticiones a la API)
#   5. Registrar los blueprints (grupos de rutas)
# ─────────────────────────────────────────────────────────────────────────────

from flask import Flask
from flask_cors import CORS
import mongoengine

from config import Config
from extensions import jwt, mail

def create_app():
    app = Flask(__name__)

    # Cargar todas las variables de configuración desde la clase Config (config.py)
    app.config.from_object(Config)

    # Conectar a MongoDB Atlas usando la URI del archivo .env
    # MongoEngine es el ODM (Object Document Mapper) que usamos para
    # trabajar con documentos de MongoDB como si fueran clases Python.
    mongoengine.connect(host=app.config["MONGO_URI"])

    # Inicializar las extensiones con la app ya configurada
    jwt.init_app(app)
    mail.init_app(app)

    # Configurar CORS (Cross-Origin Resource Sharing):
    # Solo estos orígenes pueden hacer peticiones a /api/*
    # Sin esto, el navegador bloquea las peticiones del frontend al backend.
    CORS(app, resources={r"/api/*": {"origins": [
        "http://127.0.0.1:5500",    # Live Server de VS Code (desarrollo)
        "http://localhost:5500",    # Variante con localhost
        "http://127.0.0.1:3000",    # Puerto alternativo de desarrollo
        "null",                     # Permite abrir el HTML directamente como archivo local
        "https://trabajo-final-integrador-58s4.onrender.com",  # Backend en Render
        "https://trabajo-final-integrador-coral.vercel.app",   # Frontend en Vercel
    ]}})

    # Registrar todos los blueprints (ver routes/__init__.py)
    # Cada blueprint agrupa las rutas de un recurso: auth, productos, pedidos, contacto
    from routes import register_blueprints
    register_blueprints(app)

    # Ruta raíz: health check para verificar que la API está funcionando
    @app.get("/")
    def index():
        return {"ok": True, "mensaje": "API CUERAR TUCUMÁN funcionando"}

    return app
