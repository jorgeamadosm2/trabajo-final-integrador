# ─────────────────────────────────────────────────────────────────────────────
# config.py — Configuración centralizada de la aplicación
#
# Todas las variables de entorno (secretos, URLs, claves) se leen desde el
# archivo .env usando python-dotenv. Esto evita escribir contraseñas o claves
# directamente en el código fuente.
#
# Flujo: .env → os.environ → Config → app.config
# ─────────────────────────────────────────────────────────────────────────────

import os
from dotenv import load_dotenv

# Cargar las variables del archivo .env al entorno del sistema operativo
load_dotenv()

class Config:
    # ── Base de datos ─────────────────────────────────────────────────────────
    # URI de conexión a MongoDB Atlas. En desarrollo local puede apuntar
    # a una instancia local: mongodb://localhost:27017/cuerar_db
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/cuerar_db")

    # ── Autenticación JWT ──────────────────────────────────────────────────────
    # Clave secreta para firmar los tokens JWT. NUNCA debe publicarse.
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-key-cambiar-en-produccion")

    # Los tokens expiran a las 24 horas (86400 segundos).
    # Después el usuario debe volver a iniciar sesión.
    JWT_ACCESS_TOKEN_EXPIRES = 86400

    # ── Modo de ejecución ─────────────────────────────────────────────────────
    # DEBUG=True activa el modo de desarrollo (reloader, mensajes de error detallados)
    DEBUG = os.environ.get("FLASK_ENV") == "development"

    # ── Panel de administración ───────────────────────────────────────────────
    # Código secreto que debe ingresar quien quiera registrarse como administrador.
    # Si no se provee al registrar, el usuario queda como cliente normal.
    ADMIN_SECRET_CODE = os.environ.get("ADMIN_SECRET_CODE", "cuerar-admin-2024")

    # ── Recuperación de contraseña ────────────────────────────────────────────
    # URL base del frontend para armar el link que se envía por email.
    # Ej: https://mi-sitio.vercel.app/pages/nueva-contrasena.html?token=xxx
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://trabajo-final-integrador-coral.vercel.app")

    # ── Correo electrónico (Gmail SMTP) ───────────────────────────────────────
    # Flask-Mail usa estas configuraciones para enviar emails.
    # Se usa TLS (puerto 587) en lugar de SSL (465) porque Gmail lo requiere así.
    MAIL_SERVER   = "smtp.gmail.com"
    MAIL_PORT     = 587
    MAIL_USE_TLS  = True
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")   # tu-cuenta@gmail.com
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")   # contraseña de aplicación de Gmail (no la real)
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_USERNAME")
