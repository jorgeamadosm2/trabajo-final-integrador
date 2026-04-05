from flask import Blueprint, request, jsonify
from bson.errors import InvalidId

from models import MensajeContacto
from models.contacto import ASUNTOS_VALIDOS
from utils.decorators import admin_required

contacto_bp = Blueprint("contacto", __name__, url_prefix="/api/contacto")


def _validar_mensaje(data):
    """Devuelve lista de errores o [] si todo OK."""
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


@contacto_bp.post("")
def enviar_mensaje():
    """
    POST /api/contacto — guarda el formulario de contacto.
    Body JSON: { "nombre": "...", "email": "...", "asunto": "...", "mensaje": "..." }
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


@contacto_bp.get("")
@admin_required
def listar_mensajes():
    """GET /api/contacto — lista todos los mensajes (requiere JWT admin)."""
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


@contacto_bp.patch("/<mensaje_id>/leido")
@admin_required
def marcar_leido(mensaje_id):
    """PATCH /api/contacto/<id>/leido — marca un mensaje como leído (requiere JWT admin)."""
    try:
        mensaje = MensajeContacto.objects(id=mensaje_id).first()
    except InvalidId:
        return jsonify({"ok": False, "error": "ID inválido"}), 400

    if not mensaje:
        return jsonify({"ok": False, "error": "Mensaje no encontrado"}), 404

    mensaje.leido = True
    mensaje.save()
    return jsonify({"ok": True, "mensaje": mensaje.to_dict()}), 200


@contacto_bp.delete("/<mensaje_id>")
@admin_required
def eliminar_mensaje(mensaje_id):
    """DELETE /api/contacto/<id> — elimina definitivamente un mensaje (requiere JWT admin)."""
    try:
        mensaje = MensajeContacto.objects(id=mensaje_id).first()
    except InvalidId:
        return jsonify({"ok": False, "error": "ID inválido"}), 400

    if not mensaje:
        return jsonify({"ok": False, "error": "Mensaje no encontrado"}), 404

    mensaje.delete()
    return jsonify({"ok": True, "mensaje": "Mensaje eliminado correctamente"}), 200
