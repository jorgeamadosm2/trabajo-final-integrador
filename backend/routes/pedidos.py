# ─────────────────────────────────────────────────────────────────────────────
# routes/pedidos.py — Gestión de pedidos de compra
#
# Endpoints:
#   POST  /api/pedidos          → crear pedido (requiere login de cliente)
#   GET   /api/pedidos          → listar todos los pedidos (solo admin)
#   PATCH /api/pedidos/<id>/estado → cambiar estado (solo admin)
#   DELETE /api/pedidos/<id>    → eliminar pedido (solo admin)
#
# Flujo de un pedido:
#   1. El cliente agrega productos al carrito (localStorage)
#   2. Al confirmar la compra, el frontend envía los items al backend
#   3. El backend verifica stock, crea el pedido y descuenta el stock
#   4. El admin ve el pedido en estado "pendiente" en el panel
#   5. Cuando lo gestiona, lo marca como "procesado"
# ─────────────────────────────────────────────────────────────────────────────

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.errors import InvalidId
from datetime import datetime

from models.pedido import Pedido, ItemPedido
from models.producto import Producto
from models.usuario import Usuario
from utils.decorators import admin_required

pedidos_bp = Blueprint("pedidos", __name__, url_prefix="/api/pedidos")


# ─────────────────────────────────────────────────────────────────────────────
# CREAR PEDIDO (requiere login)
# ─────────────────────────────────────────────────────────────────────────────

@pedidos_bp.post("")
@jwt_required()
def crear_pedido():
    """
    POST /api/pedidos — Registra un nuevo pedido del cliente.

    Requiere: JWT de cualquier usuario activo (no necesariamente admin).

    Body JSON:
    {
      "numero": "CT-a3f8d2",
      "items": [
        { "id": "...", "nombre": "Cuero", "precio": 5000, "cantidad": 2, "unidad": "m²" }
      ],
      "total": 10000
    }

    El número de pedido se genera en el frontend (carrito.js) con el
    formato "CT-xxxxxx" para que sea legible por el cliente.

    Verificaciones que hace este endpoint:
      1. Que el usuario exista y esté activo
      2. Que el número de pedido sea único
      3. Que haya stock suficiente para cada item
      4. Que cada item tenga los campos requeridos

    Al crear el pedido, descuenta automáticamente el stock de cada producto.
    """
    user_id = get_jwt_identity()
    usuario = Usuario.objects(id=user_id).first()
    if not usuario or not usuario.activo:
        return jsonify({"ok": False, "error": "Usuario no encontrado o inactivo"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"ok": False, "error": "Body JSON requerido"}), 400

    numero    = data.get("numero", "").strip()
    items_raw = data.get("items", [])
    total     = data.get("total")

    # Validaciones básicas del pedido
    if not numero:
        return jsonify({"ok": False, "error": "El campo 'numero' es requerido"}), 400
    if not items_raw:
        return jsonify({"ok": False, "error": "El pedido debe tener al menos un item"}), 400
    if total is None or not isinstance(total, (int, float)) or total < 0:
        return jsonify({"ok": False, "error": "'total' es requerido y debe ser un número positivo"}), 400

    # Verificar que el número de pedido no esté duplicado
    if Pedido.objects(numero=numero).first():
        return jsonify({"ok": False, "error": "Ya existe un pedido con ese número"}), 409

    # ── Verificar stock ANTES de crear el pedido ──────────────────────────────
    # Si algún producto no tiene suficiente stock, rechazamos todo el pedido
    for item in items_raw:
        producto_id = item.get("id", "")
        if not producto_id:
            continue
        try:
            producto = Producto.objects(id=producto_id, activo=True).first()
        except Exception:
            continue
        if producto and producto.stock is not None:
            cantidad = int(item.get("cantidad", 1))
            if producto.stock < cantidad:
                disponible = producto.stock
                msg = (f"Sin stock para '{producto.nombre}'"
                       if disponible == 0
                       else f"Stock insuficiente para '{producto.nombre}' (disponible: {disponible})")
                return jsonify({"ok": False, "error": msg}), 409

    # ── Construir los items embebidos ─────────────────────────────────────────
    # Guardamos snapshots de nombre y precio para preservar el historial
    items = []
    for item in items_raw:
        if not item.get("nombre") or item.get("precio") is None or not item.get("cantidad"):
            return jsonify({"ok": False, "error": "Cada item requiere 'nombre', 'precio' y 'cantidad'"}), 400
        items.append(ItemPedido(
            producto_id = str(item.get("id", "")),
            nombre      = str(item["nombre"]),
            precio      = float(item["precio"]),
            cantidad    = int(item["cantidad"]),
            unidad      = str(item.get("unidad", "") or ""),
        ))

    # ── Crear y guardar el pedido ─────────────────────────────────────────────
    # Se guarda un snapshot del nombre y email del usuario al momento del pedido
    pedido = Pedido(
        numero         = numero,
        usuario_id     = str(usuario.id),
        usuario_nombre = usuario.nombre,
        usuario_email  = usuario.email,
        items          = items,
        total          = float(total),
    )
    pedido.save()

    # ── Descontar stock de cada producto confirmado ───────────────────────────
    for item in items_raw:
        producto_id = item.get("id", "")
        if not producto_id:
            continue
        try:
            producto = Producto.objects(id=producto_id, activo=True).first()
        except Exception:
            continue
        if producto and producto.stock is not None:
            producto.stock      = max(0, producto.stock - int(item["cantidad"]))
            producto.updated_at = datetime.utcnow()
            producto.save()

    return jsonify({"ok": True, "pedido": pedido.to_dict()}), 201


# ─────────────────────────────────────────────────────────────────────────────
# LISTAR PEDIDOS (solo admin)
# ─────────────────────────────────────────────────────────────────────────────

@pedidos_bp.get("")
@admin_required
def listar_pedidos():
    """
    GET /api/pedidos — Lista todos los pedidos del sistema.

    Requiere: JWT de admin.
    Query param opcional: ?estado=pendiente|procesado
    Los pedidos se devuelven ordenados del más reciente al más antiguo.
    """
    estado = request.args.get("estado")
    filtros = {}
    if estado in ("pendiente", "procesado"):
        filtros["estado"] = estado

    pedidos = Pedido.objects(**filtros).order_by("-created_at")
    return jsonify({
        "ok":      True,
        "total":   pedidos.count(),
        "pedidos": [p.to_dict() for p in pedidos],
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# CAMBIAR ESTADO (solo admin)
# ─────────────────────────────────────────────────────────────────────────────

@pedidos_bp.patch("/<pedido_id>/estado")
@admin_required
def cambiar_estado(pedido_id):
    """
    PATCH /api/pedidos/<id>/estado — Cambia el estado de un pedido.

    Requiere: JWT de admin.
    Body JSON: { "estado": "pendiente" | "procesado" }

    Flujo típico: el admin revisa el pedido → lo marca como "procesado".
    """
    try:
        pedido = Pedido.objects(id=pedido_id).first()
    except InvalidId:
        return jsonify({"ok": False, "error": "ID inválido"}), 400

    if not pedido:
        return jsonify({"ok": False, "error": "Pedido no encontrado"}), 404

    data = request.get_json()
    nuevo_estado = (data or {}).get("estado")
    if nuevo_estado not in ("pendiente", "procesado"):
        return jsonify({"ok": False, "error": "Estado debe ser 'pendiente' o 'procesado'"}), 400

    pedido.estado     = nuevo_estado
    pedido.updated_at = datetime.utcnow()
    pedido.save()

    return jsonify({"ok": True, "pedido": pedido.to_dict()}), 200


# ─────────────────────────────────────────────────────────────────────────────
# ELIMINAR PEDIDO (solo admin)
# ─────────────────────────────────────────────────────────────────────────────

@pedidos_bp.delete("/<pedido_id>")
@admin_required
def eliminar_pedido(pedido_id):
    """
    DELETE /api/pedidos/<id> — Elimina un pedido de la base de datos.

    Requiere: JWT de admin.
    A diferencia de los productos, los pedidos se borran físicamente
    cuando el admin los elimina del panel.
    """
    try:
        pedido = Pedido.objects(id=pedido_id).first()
    except InvalidId:
        return jsonify({"ok": False, "error": "ID inválido"}), 400

    if not pedido:
        return jsonify({"ok": False, "error": "Pedido no encontrado"}), 404

    numero = pedido.numero
    pedido.delete()  # Eliminación física del documento en MongoDB
    return jsonify({"ok": True, "mensaje": f"Pedido {numero} eliminado"}), 200
