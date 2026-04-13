from mongoengine import (Document, EmbeddedDocument, StringField, FloatField,
                         IntField, ListField, EmbeddedDocumentField, DateTimeField)
from datetime import datetime


class ItemPedido(EmbeddedDocument):
    producto_id = StringField()          # ID del producto en MongoDB (puede quedar obsoleto)
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


class Pedido(Document):
    numero     = StringField(required=True, unique=True)   # "CT-xxxxxx" generado en el frontend
    items      = ListField(EmbeddedDocumentField(ItemPedido))
    total      = FloatField(required=True)
    estado     = StringField(default="pendiente", choices=["pendiente", "procesado"])
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {"collection": "pedidos", "ordering": ["-created_at"]}

    def to_dict(self):
        return {
            "id":         str(self.id),
            "numero":     self.numero,
            "items":      [i.to_dict() for i in self.items],
            "total":      self.total,
            "estado":     self.estado,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
