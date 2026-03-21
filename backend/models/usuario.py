from mongoengine import Document, StringField, BooleanField, DateTimeField, EmailField
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class Usuario(Document):
    nombre        = StringField(required=True, max_length=100)
    email         = EmailField(required=True, unique=True)
    password_hash = StringField(required=True)
    es_admin      = BooleanField(default=False)
    created_at    = DateTimeField(default=datetime.utcnow)

    meta = {"collection": "usuarios"}

    def set_password(self, password_raw):
        """Hashea y guarda la contraseña."""
        self.password_hash = generate_password_hash(password_raw)

    def check_password(self, password_raw):
        """Verifica si la contraseña es correcta."""
        return check_password_hash(self.password_hash, password_raw)

    def to_dict(self):
        return {
            "id": str(self.id),
            "nombre": self.nombre,
            "email": self.email,
            "es_admin": self.es_admin,
            "created_at": self.created_at.isoformat()
        }
