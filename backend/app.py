from flask import Flask
from flask_cors import CORS
import mongoengine

from config import Config
from extensions import jwt, mail

# Uso el patrón factory (create_app) para poder crear la app desde distintos lugares
# sin que haya conflictos de imports. También facilita correr tests más adelante.
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Conecto con MongoDB usando la URI que viene de config (local o Atlas según el entorno)
    mongoengine.connect(host=app.config["MONGO_URI"])

    # Las extensiones se inicializan acá y no en su propio archivo para evitar
    # importar la app antes de crearla, lo que causaría imports circulares.
    jwt.init_app(app)
    mail.init_app(app)

    # Configuro CORS para que el frontend pueda hacer requests a /api/*.
    # Incluyo "null" porque cuando se abre el HTML directo desde el sistema de archivos
    # (sin servidor), el origen que manda el browser es "null".
    CORS(app, resources={r"/api/*": {"origins": [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "null",
        "https://trabajo-final-integrador-58s4.onrender.com",
        "https://trabajo-final-integrador-coral.vercel.app",
    ]}})

    # Los blueprints los importo acá adentro (no arriba del archivo) para evitar
    # que los modelos intenten usar la base de datos antes de que esté conectada.
    from routes import register_blueprints
    register_blueprints(app)

    # Endpoint simple para saber si el servidor está corriendo desde Render o un browser
    @app.get("/")
    def index():
        return {"ok": True, "mensaje": "API CUERAR TUCUMÁN funcionando"}

    return app
