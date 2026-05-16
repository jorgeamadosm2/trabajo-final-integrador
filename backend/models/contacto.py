from mongoengine import Document, StringField, BooleanField, DateTimeField, EmailField
from datetime import datetime

# Los asuntos posibles los defino acá como constante para reutilizarlos
# en la validación del backend sin repetir la lista en dos lugares.
ASUNTOS_VALIDOS = ["consulta", "mayorista", "pedido", "otro"]

# ── Modelo: MensajeContacto ───────────────────────────────────────────────────
# Representa un mensaje enviado desde el formulario de contacto.
# El campo "leido" me permite distinguir en el panel admin cuáles ya fueron revisados.
class MensajeContacto(Document):
    nombre   = StringField(required=True, max_length=150)
    email    = EmailField(required=True)
    asunto   = StringField(required=True, choices=ASUNTOS_VALIDOS)
    mensaje  = StringField(required=True, min_length=10)
    leido    = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "mensajes_contacto",
        "ordering": ["-created_at"]  # los más nuevos primero
    }

    # Convierto el documento a dict para poder devolverlo en las respuestas JSON.
    # El id de MongoDB es un ObjectId, así que lo paso a string.
    def to_dict(self):
        return {
            "id":         str(self.id),
            "nombre":     self.nombre,
            "email":      self.email,
            "asunto":     self.asunto,
            "mensaje":    self.mensaje,
            "leido":      self.leido,
            "created_at": self.created_at.isoformat()
        }
