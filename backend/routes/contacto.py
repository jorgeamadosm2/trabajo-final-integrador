# ─────────────────────────────────────────────────────────────────────────────
# routes/contacto.py — Formulario de contacto y mensajes al negocio
#
# Endpoints:
#   POST  /api/contacto          → enviar mensaje (público, sin login)
#   GET   /api/contacto          → listar mensajes (solo admin)
#   PATCH /api/contacto/<id>/leido → marcar como leído (solo admin)
#   DELETE /api/contacto/<id>   → eliminar mensaje (solo admin)
#
# Cualquier visitante puede enviar un mensaje sin estar registrado.
# Los mensajes no leídos muestran un badge rojo en el panel de admin.
# ─────────────────────────────────────────────────────────────────────────────

from flask import Blueprint, request, jsonify
from bson.errors import InvalidId

from models import MensajeContacto
from models.contacto import ASUNTOS_VALIDOS
from utils.decorators import admin_required

contacto_bp = Blueprint("contacto", __name__, url_prefix="/api/contacto")


def _validar_mensaje(data):
    """
    Valida los campos del formulario de contacto.
    Devuelve una lista de mensajes de error, o [] si todo está correcto.
    """
    errores = []
    if not data.get("nombre", "").strip():
        errores.append("El campo 'nombre' es requerido")
    email = data.get("email", "").strip()
    if not email or "@" not in email:
        errores.append("El campo 'email' debe ser un email válido")
    if data.get("asunto") not in ASUNTOS_VALIDOS:
        errores.append(f"'asunto' debe ser uno de: {ASUNTOS_VALIDOS}")
    if len(data.get("mensaje", "")) < 10:
        errores.append("El 'mensaje' debe tener al menos 10 caracteres")
    return errores


# ─────────────────────────────────────────────────────────────────────────────
# ENVIAR MENSAJE (público)
# ─────────────────────────────────────────────────────────────────────────────

@contacto_bp.post("")
def enviar_mensaje():
    """
    POST /api/contacto — Guarda un mensaje del formulario de contacto.

    No requiere autenticación: cualquier visitante puede contactar al negocio.

    Body JSON:
    {
      "nombre": "Ana García",
      "email": "ana@example.com",
      "asunto": "consulta",   ← opciones: consulta, mayorista, pedido, otro
      "mensaje": "Quiero saber si tienen cuero de color azul..."
    }

    El mensaje queda guardado con leido=False hasta que el admin lo revise.
    """
    data = request.get_json()
    if not data:
        return jsonify({"ok": False, "error": "Body JSON requerido"}), 400

    errores = _validar_mensaje(data)
    if errores:
        return jsonify({"ok": False, "errores": errores}), 400

    mensaje = MensajeContacto(
        nombre  = data["nombre"].strip(),
        email   = data["email"].strip().lower(),
        asunto  = data["asunto"],
        mensaje = data["mensaje"].strip()
    )
    mensaje.save()

    return jsonify({
        "ok": True,
        "mensaje": "¡Gracias! Recibimos tu consulta y te contactamos pronto."
    }), 201


# ─────────────────────────────────────────────────────────────────────────────
# LISTAR MENSAJES (solo admin)
# ─────────────────────────────────────────────────────────────────────────────

@contacto_bp.get("")
@admin_required
def listar_mensajes():
    """
    GET /api/contacto — Lista todos los mensajes recibidos.

    Requiere: JWT de admin.
    Query param opcional: ?no_leidos=true → solo los no leídos
    Ordenados del más reciente al más antiguo.
    """
    solo_no_leidos = request.args.get("no_leidos", "").lower() == "true"
    filtros = {}
    if solo_no_leidos:
        filtros["leido"] = False

    mensajes = MensajeContacto.objects(**filtros).order_by("-created_at")
    return jsonify({
        "ok": True,
        "total": mensajes.count(),
        "mensajes": [m.to_dict() for m in mensajes]
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# MARCAR COMO LEÍDO (solo admin)
# ─────────────────────────────────────────────────────────────────────────────

@contacto_bp.patch("/<mensaje_id>/leido")
@admin_required
def marcar_leido(mensaje_id):
    """
    PATCH /api/contacto/<id>/leido — Marca un mensaje como leído.

    Requiere: JWT de admin.
    Al marcar como leído, el mensaje desaparece del contador de
    notificaciones no leídas en el panel de administración.
    """
    try:
        mensaje = MensajeContacto.objects(id=mensaje_id).first()
    except InvalidId:
        return jsonify({"ok": False, "error": "ID inválido"}), 400

    if not mensaje:
        return jsonify({"ok": False, "error": "Mensaje no encontrado"}), 404

    mensaje.leido = True
    mensaje.save()
    return jsonify({"ok": True, "mensaje": mensaje.to_dict()}), 200


# ─────────────────────────────────────────────────────────────────────────────
# ELIMINAR MENSAJE (solo admin)
# ─────────────────────────────────────────────────────────────────────────────

@contacto_bp.delete("/<mensaje_id>")
@admin_required
def eliminar_mensaje(mensaje_id):
    """
    DELETE /api/contacto/<id> — Elimina definitivamente un mensaje.

    Requiere: JWT de admin.
    Los mensajes de contacto SÍ se eliminan físicamente (no hay soft-delete)
    porque no tienen relaciones con otros documentos.
    """
    try:
        mensaje = MensajeContacto.objects(id=mensaje_id).first()
    except InvalidId:
        return jsonify({"ok": False, "error": "ID inválido"}), 400

    if not mensaje:
        return jsonify({"ok": False, "error": "Mensaje no encontrado"}), 404

    mensaje.delete()
    return jsonify({"ok": True, "mensaje": "Mensaje eliminado correctamente"}), 200
