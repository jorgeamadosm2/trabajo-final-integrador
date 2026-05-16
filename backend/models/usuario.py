from mongoengine import Document, StringField, BooleanField, DateTimeField, EmailField
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# ── Modelo: Usuario ───────────────────────────────────────────────────────────
# Maneja tanto clientes normales como administradores con el mismo modelo.
# La diferencia entre roles está en el campo es_admin.
class Usuario(Document):
    nombre   = StringField(required=True, max_length=100)
    email    = EmailField(required=True, unique=True)
    password_hash = StringField(required=True)  # nunca se guarda la contraseña en texto plano
    es_admin = BooleanField(default=False)
    activo   = BooleanField(default=True)
    created_at = DateTimeField(default=datetime.utcnow)

    # Estos dos campos solo se usan en el flujo de recuperación de contraseña.
    # El token expira en 1 hora y se borra después de usarlo.
    reset_token         = StringField(default=None)
    reset_token_expires = DateTimeField(default=None)

    meta = {"collection": "usuarios"}

    # ── Contraseña ────────────────────────────────────────────────────────────
    # Werkzeug se encarga del hashing. Nunca toco password_hash directamente,
    # solo uso estos dos métodos para setear y verificar.
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
