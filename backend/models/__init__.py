# ─────────────────────────────────────────────────────────────────────────────
# models/__init__.py — Re-exporta todos los modelos desde un único punto
#
# Esto permite importar cualquier modelo con:
#   from models import Usuario, Producto, MensajeContacto, Pedido
# en lugar de tener que recordar en qué archivo está cada uno.
# ─────────────────────────────────────────────────────────────────────────────

from .usuario import Usuario
from .producto import Producto
from .contacto import MensajeContacto
from .pedido import Pedido, ItemPedido
