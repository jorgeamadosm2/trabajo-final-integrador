import os
from dotenv import load_dotenv

# Cargo el archivo .env para tener las variables disponibles en desarrollo.
# En producción (Render) esas variables se configuran directamente en el panel.
load_dotenv()

class Config:
    # ── Base de datos ─────────────────────────────────────────────────────────
    # Si no hay variable de entorno, conecto a MongoDB local. En producción
    # esta variable apunta a MongoDB Atlas.
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/cuerar_db")

    # ── JWT ───────────────────────────────────────────────────────────────────
    # La clave secreta para firmar los tokens. En producción hay que cambiarla
    # por algo seguro y no dejarla en el código.
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-key-cambiar-en-produccion")
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 horas expresadas en segundos

    DEBUG = os.environ.get("FLASK_ENV") == "development"

    # Código especial que el usuario ingresa al registrarse para obtener rol admin.
    # Lo mantengo fuera del código en producción para que no quede expuesto.
    ADMIN_SECRET_CODE = os.environ.get("ADMIN_SECRET_CODE", "cuerar-admin-2024")

    # ── Email ─────────────────────────────────────────────────────────────────
    # URL del frontend para armar el link que se manda en el email de recuperación
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://trabajo-final-integrador-coral.vercel.app")

    MAIL_SERVER   = "smtp.gmail.com"
    MAIL_PORT     = 587
    MAIL_USE_TLS  = True
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_USERNAME")
