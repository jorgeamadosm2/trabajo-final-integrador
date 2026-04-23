# ─────────────────────────────────────────────────────────────────────────────
# models/usuario.py — Modelo de la colección "usuarios" en MongoDB
#
# Representa a los usuarios de la plataforma. Puede ser cliente normal o admin.
# Las contraseñas NUNCA se guardan en texto plano: se hashean con werkzeug
# (algoritmo bcrypt/pbkdf2) antes de guardarlas en la base de datos.
# ─────────────────────────────────────────────────────────────────────────────

from mongoengine import Document, StringField, BooleanField, DateTimeField, EmailField
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class Usuario(Document):
    # Nombre completo del usuario (ej: "Jorge Amado")
    nombre = StringField(required=True, max_length=100)

    # Email único — se usa como identificador para el login
    email = EmailField(required=True, unique=True)

    # Hash de la contraseña. Nunca se guarda la contraseña real.
    password_hash = StringField(required=True)

    # True = tiene acceso al Panel de Administración
    es_admin = BooleanField(default=False)

    # False = baja lógica (el usuario no puede iniciar sesión pero no se borra de la BD)
    activo = BooleanField(default=True)

    # Fecha de creación del registro
    created_at = DateTimeField(default=datetime.utcnow)

    # Token temporal para recuperar contraseña (se genera al pedir el reset)
    reset_token = StringField(default=None)

    # Fecha límite de validez del token (1 hora desde que se generó)
    reset_token_expires = DateTimeField(default=None)

    # Nombre de la colección en MongoDB Atlas
    meta = {"collection": "usuarios"}

    def set_password(self, password_raw):
        """Convierte la contraseña en texto plano a un hash seguro y la guarda."""
        self.password_hash = generate_password_hash(password_raw)

    def check_password(self, password_raw):
        """Verifica si la contraseña ingresada coincide con el hash guardado."""
        return check_password_hash(self.password_hash, password_raw)

    def to_dict(self):
        """Serializa el usuario a un diccionario JSON-compatible.
        IMPORTANTE: nunca incluye password_hash por seguridad."""
        return {
            "id": str(self.id),
            "nombre": self.nombre,
            "email": self.email,
            "es_admin": self.es_admin,
            "activo": self.activo,
            "created_at": self.created_at.isoformat()
        }
