# ─────────────────────────────────────────────────────────────────────────────
# models/producto.py — Modelo de la colección "productos" en MongoDB
#
# Representa los artículos del catálogo: materias primas (cuero, hilos),
# productos elaborados (carteras, cinturones) y herramientas.
#
# Patrón SOFT-DELETE: los productos nunca se eliminan físicamente.
# Cuando el admin "borra" un producto, solo se pone activo=False.
# Esto preserva el historial de pedidos que referencian ese producto.
# ─────────────────────────────────────────────────────────────────────────────

from mongoengine import (Document, StringField, FloatField, IntField,
                         BooleanField, DateTimeField, ReferenceField)
from datetime import datetime

# Categorías permitidas — el frontend muestra estas tres secciones en el catálogo
CATEGORIAS_VALIDAS = ["materia-prima", "elaborados", "herramientas"]

class Producto(Document):
    # Nombre del producto visible en el catálogo (ej: "Cuero Vacuno Premium")
    nombre = StringField(required=True, max_length=200)

    # Descripción opcional que aparece en la card del producto
    descripcion = StringField()

    # Precio en pesos argentinos
    precio = FloatField(required=True)

    # Unidad de medida: "m²" para materias primas, None para unidades sueltas
    unidad = StringField(max_length=20)

    # Categoría: determina en qué sección del catálogo aparece
    categoria = StringField(required=True, choices=CATEGORIAS_VALIDAS)

    # Ruta relativa a la imagen (ej: "../src/img/cuero.png")
    imagen_url = StringField(max_length=300)

    # Badge visual en la card: "Nuevo", "Popular", o None (sin badge)
    etiqueta = StringField(max_length=30)

    # Si True, aparece en la sección "Productos Destacados" de index.html
    destacado = BooleanField(default=False)

    # SOFT-DELETE: False = producto desactivado, no aparece en el catálogo público
    activo = BooleanField(default=True)

    # Cantidad en stock. None = sin control de stock (stock ilimitado)
    stock = IntField(min_value=0)

    # Referencia al Usuario admin que creó este producto (FK → usuarios)
    creado_por = ReferenceField("Usuario", null=True)

    # Timestamps automáticos
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "productos",
        "ordering": ["-created_at"]  # Los más nuevos primero
    }

    def to_dict(self):
        """Serializa el producto a JSON. Incluye todos los campos excepto el objeto
        Usuario completo (solo guarda el ID del creador)."""
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
            "stock": self.stock,
            "creado_por_id": str(self.creado_por.id) if self.creado_por else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
