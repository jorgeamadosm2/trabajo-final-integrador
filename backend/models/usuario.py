from mongoengine import Document, StringField, BooleanField, DateTimeField, EmailField
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# ── Modelo: Usuario ───────────────────────────────────────────────────────────
# Colección "usuarios" en MongoDB. Gestiona tanto clientes como administradores.
class Usuario(Document):
    nombre   = StringField(required=True, max_length=100)
    email    = EmailField(required=True, unique=True)
    password_hash = StringField(required=True)
    es_admin = BooleanField(default=False)
    activo   = BooleanField(default=True)
    created_at = DateTimeField(default=datetime.utcnow)

    # Campos para el flujo de recuperación de contraseña (token temporal de 1 hora)
    reset_token         = StringField(default=None)
    reset_token_expires = DateTimeField(default=None)

    meta = {"collection": "usuarios"}

    # ── Métodos de contraseña ─────────────────────────────────────────────────
    # Nunca se guarda la contraseña en texto plano, solo el hash de Werkzeug.
    def set_password(self, password_raw):
        self.password_hash = generate_password_hash(password_raw)

    def check_password(self, password_raw):
        return check_password_hash(self.password_hash, password_raw)

    def to_dict(self):
        return {
            "id":         str(self.id),
            "nombre":     self.nombre,
            "email":      self.email,
            "es_admin":   self.es_admin,
            "activo":     self.activo,
            "created_at": self.created_at.isoformat()
        }
