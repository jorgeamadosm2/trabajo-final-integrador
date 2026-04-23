# ─────────────────────────────────────────────────────────────────────────────
# models/pedido.py — Modelos de la colección "pedidos" en MongoDB
#
# Un pedido contiene la información de una compra realizada por un usuario.
# Usa el patrón de "documentos embebidos" (ItemPedido dentro de Pedido)
# que es una ventaja de MongoDB sobre las bases relacionales: toda la
# información del pedido queda en un solo documento, sin JOINs.
#
# SNAPSHOT de usuario: se guardan nombre y email del usuario en el momento
# del pedido. Así, si el usuario cambia su nombre después, el historial
# de pedidos queda intacto.
# ─────────────────────────────────────────────────────────────────────────────

from mongoengine import (Document, EmbeddedDocument, StringField, FloatField,
                         IntField, ListField, EmbeddedDocumentField, DateTimeField)
from datetime import datetime


class ItemPedido(EmbeddedDocument):
    """
    Representa un producto dentro del pedido. Es un documento embebido,
    lo que significa que vive DENTRO del documento Pedido en MongoDB,
    no en una colección separada.
    """
    # ID del producto en MongoDB (puede quedar obsoleto si el producto se elimina,
    # por eso guardamos también nombre y precio como snapshot)
    producto_id = StringField()

    # Snapshot del nombre del producto al momento de hacer el pedido
    nombre = StringField(required=True)

    # Snapshot del precio al momento de hacer el pedido
    precio = FloatField(required=True)

    # Cantidad solicitada (mínimo 1)
    cantidad = IntField(required=True, min_value=1)

    # Unidad de medida (puede ser "" para productos sin unidad)
    unidad = StringField()

    def to_dict(self):
        return {
            "producto_id": self.producto_id,
            "nombre":      self.nombre,
            "precio":      self.precio,
            "cantidad":    self.cantidad,
            "unidad":      self.unidad,
            "subtotal":    round(self.precio * self.cantidad, 2),  # precio × cantidad
        }


class Pedido(Document):
    """
    Representa un pedido completo. El número de pedido se genera en el
    frontend con el formato "CT-xxxxxx" para que sea legible por el cliente.
    """
    # Número legible del pedido (ej: "CT-a3f8d2"). Se genera en carrito.js
    numero = StringField(required=True, unique=True)

    # ID del usuario que realizó el pedido (guardado como string, no como FK)
    usuario_id = StringField()

    # Snapshot del nombre del usuario al momento del pedido
    usuario_nombre = StringField()

    # Snapshot del email del usuario al momento del pedido
    usuario_email = StringField()

    # Lista de productos pedidos (documentos embebidos ItemPedido)
    items = ListField(EmbeddedDocumentField(ItemPedido))

    # Total del pedido en pesos argentinos
    total = FloatField(required=True)

    # Estado del pedido: "pendiente" hasta que el admin lo procesa
    estado = StringField(default="pendiente", choices=["pendiente", "procesado"])

    # Timestamps
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "pedidos",
        "ordering": ["-created_at"]  # Los más recientes primero
    }

    def to_dict(self):
        """Serializa el pedido incluyendo todos los items embebidos."""
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
