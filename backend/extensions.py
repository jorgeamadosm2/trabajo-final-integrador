# ─────────────────────────────────────────────────────────────────────────────
# extensions.py — Instancias de extensiones Flask
#
# Las extensiones se crean aquí SIN inicializar (sin app) para evitar
# importaciones circulares. La inicialización real ocurre en app.py con
# jwt.init_app(app) y mail.init_app(app).
#
# Este patrón se llama "Application Factory" y es una buena práctica en Flask.
# ─────────────────────────────────────────────────────────────────────────────

from flask_jwt_extended import JWTManager
from flask_mail import Mail

# JWTManager: maneja la creación y verificación de tokens JWT (JSON Web Tokens)
# para autenticar usuarios sin guardar estado en el servidor.
jwt = JWTManager()

# Mail: envía correos electrónicos a través de SMTP (Gmail en este proyecto).
# Se usa para el flujo de recuperación de contraseña.
mail = Mail()
