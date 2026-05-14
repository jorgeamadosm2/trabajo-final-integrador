from flask_jwt_extended import JWTManager
from flask_mail import Mail

# Instancias sin inicializar — se vinculan a la app en app.py con init_app()
# para evitar imports circulares entre módulos.
jwt = JWTManager()
mail = Mail()
