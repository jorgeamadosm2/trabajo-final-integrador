from mongoengine import (Document, StringField, FloatField,
                         BooleanField, DateTimeField, ReferenceField)
from datetime import datetime

CATEGORIAS_VALIDAS = ["materia-prima", "elaborados", "herramientas"]

class Producto(Document):
    nombre      = StringField(required=True, max_length=200)
    descripcion = StringField()
    precio      = FloatField(required=True)
    unidad      = StringField(max_length=20)    # "m²", None para unidades sueltas
    categoria   = StringField(required=True, choices=CATEGORIAS_VALIDAS)
    imagen_url  = StringField(max_length=300)
    etiqueta    = StringField(max_length=30)    # "Nuevo", "Popular", None
    destacado   = BooleanField(default=False)   # aparece en la sección de index.html
    activo      = BooleanField(default=True)    # False = soft-delete (no se borra de Atlas)
    creado_por  = ReferenceField("Usuario", null=True)  # FK → Usuario admin que lo creó
    created_at  = DateTimeField(default=datetime.utcnow)
    updated_at  = DateTimeField(default=datetime.utcnow)

    meta = {"collection": "productos", "ordering": ["-created_at"]}

    def to_dict(self):
        return {
            "id": str(self.id),
            "nombre": self.nombre,
            "descripcion": self.descripcion,
            "precio": self.precio,
            "unidad": self.unidad,
            "categoria": self.categoria,
            "imagen_url": self.imagen_url,
            "etiqueta": self.etiqueta,
            "destacado": self.destacado,
            "activo": self.activo,
            "creado_por_id": str(self.creado_por.id) if self.creado_por else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
