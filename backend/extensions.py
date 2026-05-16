from flask_jwt_extended import JWTManager
from flask_mail import Mail

# Creo las instancias acá sin pasarles la app todavía.
# El init_app() se hace en app.py una vez que la app ya existe.
# Si las inicializara acá con la app directamente, habría imports circulares
# porque los modelos importan de extensions y extensions importaría la app.
jwt = JWTManager()
mail = Mail()
