from mongoengine import (Document, EmbeddedDocument, StringField, FloatField,
                         IntField, ListField, EmbeddedDocumentField, DateTimeField)
from datetime import datetime


# ── Modelo: ItemPedido ────────────────────────────────────────────────────────
# Cada item del pedido se guarda como documento embebido dentro de Pedido.
# Guardo un snapshot del nombre y precio en el momento de la compra, no una referencia
# al producto. Así si el precio cambia después, el historial no se altera.
class ItemPedido(EmbeddedDocument):
    producto_id = StringField()
    nombre      = StringField(required=True)
    precio      = FloatField(required=True)
    cantidad    = IntField(required=True, min_value=1)
    unidad      = StringField()

    def to_dict(self):
        return {
            "producto_id": self.producto_id,
            "nombre":      self.nombre,
            "precio":      self.precio,
            "cantidad":    self.cantidad,
            "unidad":      self.unidad,
            "subtotal":    round(self.precio * self.cantidad, 2),
        }


# ── Modelo: Pedido ────────────────────────────────────────────────────────────
# Colección principal de pedidos. Guarda también un snapshot del usuario
# (nombre y email) para que el historial quede intacto si esa cuenta se modifica o elimina.
class Pedido(Document):
    numero         = StringField(required=True, unique=True)
    usuario_id     = StringField()
    usuario_nombre = StringField()
    usuario_email  = StringField()
    items          = ListField(EmbeddedDocumentField(ItemPedido))
    total          = FloatField(required=True)
    estado         = StringField(default="pendiente", choices=["pendiente", "procesado"])
    created_at     = DateTimeField(default=datetime.utcnow)
    updated_at     = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "pedidos",
        "ordering": ["-created_at"]  # los más recientes primero en el panel admin
    }

    def to_dict(self):
        return {
            "id":             str(self.id),
            "numero":         self.numero,
            "usuario_id":     self.usuario_id,
            "usuario_nombre": self.usuario_nombre,
            "usuario_email":  self.usuario_email,
            "items":          [i.to_dict() for i in self.items],
            "total":          self.total,
            "estado":         self.estado,
            "created_at":     self.created_at.isoformat(),
            "updated_at":     self.updated_at.isoformat(),
        }
