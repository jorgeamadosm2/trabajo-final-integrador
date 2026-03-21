from mongoengine import Document, StringField, BooleanField, DateTimeField, EmailField
from datetime import datetime

ASUNTOS_VALIDOS = ["consulta", "mayorista", "pedido", "otro"]

class MensajeContacto(Document):
    nombre     = StringField(required=True, max_length=150)
    email      = EmailField(required=True)
    asunto     = StringField(required=True, choices=ASUNTOS_VALIDOS)
    mensaje    = StringField(required=True, min_length=10)
    leido      = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {"collection": "mensajes_contacto", "ordering": ["-created_at"]}

    def to_dict(self):
        return {
            "id": str(self.id),
            "nombre": self.nombre,
            "email": self.email,
            "asunto": self.asunto,
            "mensaje": self.mensaje,
            "leido": self.leido,
            "created_at": self.created_at.isoformat()
        }
