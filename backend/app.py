from flask import Flask
from flask_cors import CORS
import mongoengine

from config import Config
from extensions import jwt, mail

def create_app(): #funcion que crea la app, la configura y la retorna
    app = Flask(__name__)
    app.config.from_object(Config)

    # conecta la app con la base de datos
    mongoengine.connect(host=app.config["MONGO_URI"])

    # inicializa las extensiones y las vincula a la app
    jwt.init_app(app)
    mail.init_app(app)

    # configura la app para que pueda recibir peticiones desde diferentes origenes
    # "null" cubre los archivos HTML abiertos directamente en el browser (file://)
    CORS(app, resources={r"/api/*": {"origins": [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "null",
        "https://trabajo-final-integrador-58s4.onrender.com",
        "https://trabajo-final-integrador-coral.vercel.app",
    ]}})

    # registra los blueprints (rutas) con el objeto app
    # Importar adentro de create_app para evitar imports circulares con los modelos
    from routes import register_blueprints
    register_blueprints(app)

    # endpoint de salud para verificar que la API funciona
    @app.get("/")
    def index():
        return {"ok": True, "mensaje": "API CUERAR TUCUMÁN funcionando"}

    return app
