import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/cuerar_db")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-key-cambiar-en-produccion")
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 horas en segundos
    DEBUG = os.environ.get("FLASK_ENV") == "development"
    # Código secreto que debe ingresar quien quiera registrarse como admin
    ADMIN_SECRET_CODE = os.environ.get("ADMIN_SECRET_CODE", "cuerar-admin-2024")
    # URL del frontend (para armar el link de reset en el email)
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://trabajo-final-integrador-coral.vercel.app")
    # Flask-Mail (Gmail)
    MAIL_SERVER   = "smtp.gmail.com"
    MAIL_PORT     = 587
    MAIL_USE_TLS  = True
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")   # tu-cuenta@gmail.com
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")   # contraseña de aplicación de Gmail
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_USERNAME")
