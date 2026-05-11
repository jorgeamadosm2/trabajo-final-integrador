from flask_jwt_extended import JWTManager
from flask_mail import Mail

# Instancias sin inicializar — se inicializan en app.py con init_app()
jwt = JWTManager()
mail = Mail()
