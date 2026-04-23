# ─────────────────────────────────────────────────────────────────────────────
# routes/productos.py — CRUD de productos del catálogo
#
# Este blueprint expone los endpoints para:
#   GET    /api/productos            → listar productos (público)
#   GET    /api/productos/destacados → productos para la home (público)
#   GET    /api/productos/<id>       → detalle de un producto (público)
#   POST   /api/productos            → crear producto (solo admin)
#   PUT    /api/productos/<id>       → editar producto (solo admin)
#   DELETE /api/productos/<id>       → soft-delete (solo admin)
#
# Patrón SOFT-DELETE: eliminar un producto solo pone activo=False.
# El producto desaparece del catálogo público pero queda en la BD
# para preservar el historial de pedidos que lo referencian.
# ─────────────────────────────────────────────────────────────────────────────

from flask import Blueprint, request, jsonify
from bson.errors import InvalidId
from datetime import datetime

from models import Producto
from models.producto import CATEGORIAS_VALIDAS
from utils.decorators import admin_required

productos_bp = Blueprint("productos", __name__, url_prefix="/api/productos")


def _validar_producto(data):
    """
    Valida los campos del body al crear o editar un producto.
    Devuelve una lista de mensajes de error, o [] si todo está correcto.
    Al centralizar la validación aquí evitamos repetir código en POST y PUT.
    """
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
    stock = data.get("stock")
    if stock is not None and (not isinstance(stock, int) or stock < 0):
        errores.append("'stock' debe ser un número entero positivo o nulo")
    return errores


# ─────────────────────────────────────────────────────────────────────────────
# LISTAR PRODUCTOS
# ─────────────────────────────────────────────────────────────────────────────

@productos_bp.get("")
def listar_productos():
    """
    GET /api/productos — Devuelve los productos del catálogo.

    Query params opcionales:
      ?categoria=materia-prima|elaborados|herramientas  → filtrar por sección
      ?destacado=true                                    → solo los destacados
      ?todos=true                                        → incluir inactivos (solo admin con JWT)

    El parámetro ?todos=true permite al panel de admin ver los productos
    desactivados para poder restaurarlos. Si lo pasa un usuario sin JWT
    de admin, se ignora y solo se muestran los activos.
    """
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    from models import Usuario

    # Verificar si el admin quiere ver todos (activos + inactivos)
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

    # Si no es admin con ?todos=true, solo mostrar los activos
    filtros = {} if mostrar_todos else {"activo": True}

    # Aplicar filtros opcionales de categoría y destacado
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


# ─────────────────────────────────────────────────────────────────────────────
# PRODUCTOS DESTACADOS (para la home)
# ─────────────────────────────────────────────────────────────────────────────

@productos_bp.get("/destacados")
def productos_destacados():
    """
    GET /api/productos/destacados — Devuelve hasta 3 productos marcados como
    destacados para mostrar en la sección de la página principal (index.html).
    """
    productos = Producto.objects(activo=True, destacado=True).limit(3)
    return jsonify({
        "ok": True,
        "productos": [p.to_dict() for p in productos]
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# DETALLE DE UN PRODUCTO
# ─────────────────────────────────────────────────────────────────────────────

@productos_bp.get("/<producto_id>")
def obtener_producto(producto_id):
    """
    GET /api/productos/<id> — Devuelve los datos de un producto específico
    buscándolo por su ObjectId de MongoDB.
    """
    try:
        producto = Producto.objects(id=producto_id, activo=True).first()
    except InvalidId:
        return jsonify({"ok": False, "error": "ID inválido"}), 400

    if not producto:
        return jsonify({"ok": False, "error": "Producto no encontrado"}), 404

    return jsonify({"ok": True, "producto": producto.to_dict()}), 200


# ─────────────────────────────────────────────────────────────────────────────
# CREAR PRODUCTO (solo admin)
# ─────────────────────────────────────────────────────────────────────────────

@productos_bp.post("")
@admin_required
def crear_producto():
    """
    POST /api/productos — Crea un nuevo producto en el catálogo.

    Requiere: JWT de admin en el header Authorization.
    Body JSON con los campos del producto (ver _validar_producto).
    Guarda una referencia al admin que creó el producto (FK → usuarios).
    """
    from flask_jwt_extended import get_jwt_identity
    from models import Usuario

    data = request.get_json()
    if not data:
        return jsonify({"ok": False, "error": "Body JSON requerido"}), 400

    errores = _validar_producto(data)
    if errores:
        return jsonify({"ok": False, "errores": errores}), 400

    # Obtener el admin para registrar quién creó el producto (relación FK)
    admin = Usuario.objects(id=get_jwt_identity()).first()

    stock_raw = data.get("stock")
    producto = Producto(
        nombre      = data["nombre"].strip(),
        descripcion = data.get("descripcion", ""),
        precio      = float(data["precio"]),
        unidad      = data.get("unidad"),
        categoria   = data["categoria"],
        imagen_url  = data.get("imagen_url"),
        etiqueta    = data.get("etiqueta"),
        destacado   = bool(data.get("destacado", False)),
        stock       = int(stock_raw) if stock_raw is not None else None,
        creado_por  = admin,
    )
    producto.save()
    return jsonify({"ok": True, "producto": producto.to_dict()}), 201


# ─────────────────────────────────────────────────────────────────────────────
# EDITAR PRODUCTO (solo admin)
# ─────────────────────────────────────────────────────────────────────────────

@productos_bp.put("/<producto_id>")
@admin_required
def editar_producto(producto_id):
    """
    PUT /api/productos/<id> — Actualiza todos los campos de un producto.

    Requiere: JWT de admin.
    Se puede usar también para RESTAURAR un producto desactivado enviando
    { "activo": true } junto con los campos requeridos.
    """
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

    stock_raw = data.get("stock")
    producto.nombre      = data["nombre"].strip()
    producto.descripcion = data.get("descripcion", producto.descripcion)
    producto.precio      = float(data["precio"])
    producto.unidad      = data.get("unidad", producto.unidad)
    producto.categoria   = data["categoria"]
    producto.imagen_url  = data.get("imagen_url", producto.imagen_url)
    producto.etiqueta    = data.get("etiqueta", producto.etiqueta)
    producto.destacado   = bool(data.get("destacado", producto.destacado))
    producto.stock       = int(stock_raw) if stock_raw is not None else None
    if "activo" in data:
        producto.activo  = bool(data["activo"])
    producto.updated_at  = datetime.utcnow()  # Actualizar timestamp de modificación
    producto.save()

    return jsonify({"ok": True, "producto": producto.to_dict()}), 200


# ─────────────────────────────────────────────────────────────────────────────
# ELIMINAR PRODUCTO — SOFT DELETE (solo admin)
# ─────────────────────────────────────────────────────────────────────────────

@productos_bp.delete("/<producto_id>")
@admin_required
def eliminar_producto(producto_id):
    """
    DELETE /api/productos/<id> — Desactiva un producto (soft-delete).

    Requiere: JWT de admin.

    NO borra el documento de MongoDB. Solo pone activo=False para que
    no aparezca en el catálogo público. Esto preserva el historial de
    pedidos que referencian este producto por nombre/precio.

    Para restaurar un producto desactivado, usar PUT con { "activo": true }.
    """
    try:
        producto = Producto.objects(id=producto_id, activo=True).first()
    except InvalidId:
        return jsonify({"ok": False, "error": "ID inválido"}), 400

    if not producto:
        return jsonify({"ok": False, "error": "Producto no encontrado"}), 404

    # Soft-delete: solo cambiar el flag, no hacer .delete()
    producto.activo = False
    producto.updated_at = datetime.utcnow()
    producto.save()

    return jsonify({"ok": True, "mensaje": f"Producto '{producto.nombre}' desactivado"}), 200
