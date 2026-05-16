from mongoengine import (Document, StringField, FloatField, IntField,
                         BooleanField, DateTimeField, ReferenceField)
from datetime import datetime

CATEGORIAS_VALIDAS = ["materia-prima", "elaborados", "herramientas"]

# ── Modelo: Producto ──────────────────────────────────────────────────────────
# El campo "activo" implementa soft-delete: en vez de borrar el producto de la base
# de datos, lo marco como inactivo. Así el catálogo no lo muestra pero el historial
# de pedidos que lo incluyen sigue siendo válido.
class Producto(Document):
    nombre      = StringField(required=True, max_length=200)
    descripcion = StringField()
    precio      = FloatField(required=True)
    unidad      = StringField(max_length=20)
    categoria   = StringField(required=True, choices=CATEGORIAS_VALIDAS)
    imagen_url  = StringField(max_length=300)
    etiqueta    = StringField(max_length=30)
    destacado   = BooleanField(default=False)
    activo      = BooleanField(default=True)   # False = producto desactivado (soft-delete)
    stock       = IntField(min_value=0)        # None = sin control de stock (cantidad ilimitada)
    creado_por  = ReferenceField("Usuario", null=True)
    created_at  = DateTimeField(default=datetime.utcnow)
    updated_at  = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "productos",
        "ordering": ["-created_at"]
    }

    def to_dict(self):
        return {
            "id":           str(self.id),
            "nombre":       self.nombre,
            "descripcion":  self.descripcion,
            "precio":       self.precio,
            "unidad":       self.unidad,
            "categoria":    self.categoria,
            "imagen_url":   self.imagen_url,
            "etiqueta":     self.etiqueta,
            "destacado":    self.destacado,
            "activo":       self.activo,
            "stock":        self.stock,
            "creado_por_id": str(self.creado_por.id) if self.creado_por else None,
            "created_at":   self.created_at.isoformat(),
            "updated_at":   self.updated_at.isoformat()
        }
