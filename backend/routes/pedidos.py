from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.errors import InvalidId
from datetime import datetime

from models.pedido import Pedido, ItemPedido
from models.producto import Producto
from models.usuario import Usuario
from utils.decorators import admin_required

pedidos_bp = Blueprint("pedidos", __name__, url_prefix="/api/pedidos")


# ─── POST /api/pedidos — requiere login, crea un pedido ──────────────────────

@pedidos_bp.post("")
@jwt_required()
def crear_pedido():
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

    # Validaciones básicas
    if not numero:
        return jsonify({"ok": False, "error": "El campo 'numero' es requerido"}), 400
    if not items_raw:
        return jsonify({"ok": False, "error": "El pedido debe tener al menos un item"}), 400
    if total is None or not isinstance(total, (int, float)) or total < 0:
        return jsonify({"ok": False, "error": "'total' es requerido y debe ser un número positivo"}), 400

    # Número de pedido único
    if Pedido.objects(numero=numero).first():
        return jsonify({"ok": False, "error": "Ya existe un pedido con ese número"}), 409

    # Verificar stock disponible para cada item
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

    # Construir items embebidos
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

    pedido = Pedido(
        numero         = numero,
        usuario_id     = str(usuario.id),
        usuario_nombre = usuario.nombre,
        usuario_email  = usuario.email,
        items          = items,
        total          = float(total),
    )
    pedido.save()

    # Descontar stock de cada producto
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


# ─── GET /api/pedidos — solo admin, lista todos los pedidos ──────────────────

@pedidos_bp.get("")
@admin_required
def listar_pedidos():
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


# ─── PATCH /api/pedidos/<id>/estado — admin, cambia estado ───────────────────

@pedidos_bp.patch("/<pedido_id>/estado")
@admin_required
def cambiar_estado(pedido_id):
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


# ─── DELETE /api/pedidos/<id> — admin, elimina pedido ────────────────────────

@pedidos_bp.delete("/<pedido_id>")
@admin_required
def eliminar_pedido(pedido_id):
    try:
        pedido = Pedido.objects(id=pedido_id).first()
    except InvalidId:
        return jsonify({"ok": False, "error": "ID inválido"}), 400

    if not pedido:
        return jsonify({"ok": False, "error": "Pedido no encontrado"}), 404

    numero = pedido.numero
    pedido.delete()
    return jsonify({"ok": True, "mensaje": f"Pedido {numero} eliminado"}), 200
