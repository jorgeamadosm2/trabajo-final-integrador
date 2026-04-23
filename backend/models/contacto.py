# ─────────────────────────────────────────────────────────────────────────────
# models/contacto.py — Modelo de la colección "mensajes_contacto" en MongoDB
#
# Guarda los mensajes enviados por visitantes desde el formulario de contacto.
# No requiere que el visitante esté registrado: cualquier persona puede enviar
# un mensaje solo con nombre, email, asunto y texto.
# ─────────────────────────────────────────────────────────────────────────────

from mongoengine import Document, StringField, BooleanField, DateTimeField, EmailField
from datetime import datetime

# Opciones válidas para el campo "asunto" del formulario de contacto
ASUNTOS_VALIDOS = ["consulta", "mayorista", "pedido", "otro"]

class MensajeContacto(Document):
    # Nombre de quien envía el mensaje
    nombre = StringField(required=True, max_length=150)

    # Email de respuesta (MongoEngine valida el formato automáticamente)
    email = EmailField(required=True)

    # Asunto predefinido que categoriza el tipo de consulta
    asunto = StringField(required=True, choices=ASUNTOS_VALIDOS)

    # Contenido del mensaje (mínimo 10 caracteres para evitar mensajes vacíos)
    mensaje = StringField(required=True, min_length=10)

    # False = el admin aún no lo leyó (aparece con badge en el panel)
    # True  = el admin ya lo marcó como leído
    leido = BooleanField(default=False)

    # Fecha y hora en que se envió el mensaje
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "mensajes_contacto",
        "ordering": ["-created_at"]  # Los más nuevos primero
    }

    def to_dict(self):
        """Serializa el mensaje a un diccionario JSON-compatible."""
        return {
            "id": str(self.id),
            "nombre": self.nombre,
            "email": self.email,
            "asunto": self.asunto,
            "mensaje": self.mensaje,
            "leido": self.leido,
            "created_at": self.created_at.isoformat()
        }
