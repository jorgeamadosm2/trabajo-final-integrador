from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime

from models import Producto
from models.producto import CATEGORIAS_VALIDAS
from utils.decorators import admin_required

productos_bp = Blueprint("productos", __name__, url_prefix="/api/productos")


def _validar_producto(data):
    """Valida los campos del body. Devuelve lista de errores o [] si todo OK."""
    errores = []
    if not data.get("nombre", "").strip():
        errores.append("El campo 'nombre' es requerido")
    if data.get("precio") is None:
        errores.append("El campo 'precio' es requerido")
    elif not isinstance(data["precio"], (int, float)) or data["precio"] < 0:
        errores.append("El campo 'precio' debe ser un número positivo")
    if not data.get("categoria"):
        errores.append("El campo 'categoria' es requerido")
    elif data["categoria"] not in CATEGORIAS_VALIDAS:
        errores.append(f"'categoria' debe ser uno de: {CATEGORIAS_VALIDAS}")
    return errores


@productos_bp.get("")
def listar_productos():
    """
    GET /api/productos
    Query params opcionales:
      ?categoria=materia-prima|elaborados|herramientas
      ?destacado=true
      ?todos=true  (solo admin con JWT — muestra también los inactivos)
    """
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    from models import Usuario

    # Si el admin pasa ?todos=true y tiene JWT válido, mostrar todos (activos e inactivos)
    mostrar_todos = request.args.get("todos", "").lower() == "true"
    if mostrar_todos:
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            usuario = Usuario.objects(id=user_id).first()
            if not usuario or not usuario.es_admin:
                mostrar_todos = False
        except Exception:
            mostrar_todos = False

    filtros = {} if mostrar_todos else {"activo": True}
    categoria = request.args.get("categoria")
    destacado  = request.args.get("destacado")

    if categoria:
        if categoria not in CATEGORIAS_VALIDAS:
            return jsonify({"ok": False, "error": f"Categoría inválida. Opciones: {CATEGORIAS_VALIDAS}"}), 400
        filtros["categoria"] = categoria

    if destacado and destacado.lower() == "true":
        filtros["destacado"] = True

    productos = Producto.objects(**filtros).order_by("categoria", "nombre")
    return jsonify({
        "ok": True,
        "total": productos.count(),
        "productos": [p.to_dict() for p in productos]
    }), 200


@productos_bp.get("/destacados")
def productos_destacados():
    """GET /api/productos/destacados — devuelve los 3 primeros productos destacados."""
    productos = Producto.objects(activo=True, destacado=True).limit(3)
    return jsonify({
        "ok": True,
        "productos": [p.to_dict() for p in productos]
    }), 200


@productos_bp.get("/<producto_id>")
def obtener_producto(producto_id):
    """GET /api/productos/<id> — un producto por su ID de MongoDB."""
    try:
        producto = Producto.objects(id=producto_id, activo=True).first()
    except InvalidId:
        return jsonify({"ok": False, "error": "ID inválido"}), 400

    if not producto:
        return jsonify({"ok": False, "error": "Producto no encontrado"}), 404

    return jsonify({"ok": True, "producto": producto.to_dict()}), 200


@productos_bp.post("")
@admin_required
def crear_producto():
    """POST /api/productos — crea un nuevo producto (requiere JWT admin)."""
    data = request.get_json()
    if not data:
        return jsonify({"ok": False, "error": "Body JSON requerido"}), 400

    errores = _validar_producto(data)
    if errores:
        return jsonify({"ok": False, "errores": errores}), 400

    producto = Producto(
        nombre      = data["nombre"].strip(),
        descripcion = data.get("descripcion", ""),
        precio      = float(data["precio"]),
        unidad      = data.get("unidad"),
        categoria   = data["categoria"],
        imagen_url  = data.get("imagen_url"),
        etiqueta    = data.get("etiqueta"),
        destacado   = bool(data.get("destacado", False)),
    )
    producto.save()
    return jsonify({"ok": True, "producto": producto.to_dict()}), 201


@productos_bp.put("/<producto_id>")
@admin_required
def editar_producto(producto_id):
    """PUT /api/productos/<id> — actualiza un producto (requiere JWT admin)."""
    try:
        producto = Producto.objects(id=producto_id).first()
    except InvalidId:
        return jsonify({"ok": False, "error": "ID inválido"}), 400

    if not producto:
        return jsonify({"ok": False, "error": "Producto no encontrado"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"ok": False, "error": "Body JSON requerido"}), 400

    errores = _validar_producto(data)
    if errores:
        return jsonify({"ok": False, "errores": errores}), 400

    producto.nombre      = data["nombre"].strip()
    producto.descripcion = data.get("descripcion", producto.descripcion)
    producto.precio      = float(data["precio"])
    producto.unidad      = data.get("unidad", producto.unidad)
    producto.categoria   = data["categoria"]
    producto.imagen_url  = data.get("imagen_url", producto.imagen_url)
    producto.etiqueta    = data.get("etiqueta", producto.etiqueta)
    producto.destacado   = bool(data.get("destacado", producto.destacado))
    producto.updated_at  = datetime.utcnow()
    producto.save()

    return jsonify({"ok": True, "producto": producto.to_dict()}), 200


@productos_bp.delete("/<producto_id>")
@admin_required
def eliminar_producto(producto_id):
    """
    DELETE /api/productos/<id> — soft-delete: pone activo=False (requiere JWT admin).
    El producto queda en Atlas pero no aparece en el listado público.
    """
    try:
        producto = Producto.objects(id=producto_id, activo=True).first()
    except InvalidId:
        return jsonify({"ok": False, "error": "ID inválido"}), 400

    if not producto:
        return jsonify({"ok": False, "error": "Producto no encontrado"}), 404

    producto.activo = False
    producto.updated_at = datetime.utcnow()
    producto.save()

    return jsonify({"ok": True, "mensaje": f"Producto '{producto.nombre}' desactivado"}), 200
