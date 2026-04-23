# ─────────────────────────────────────────────────────────────────────────────
# run.py — Punto de entrada del servidor Flask
#
# Este archivo es el que ejecuta el servidor. En desarrollo lo corremos
# directamente: `python run.py`. En producción (Render.com) lo ejecuta
# Gunicorn: `gunicorn run:app`.
#
# Puerto: usa la variable de entorno PORT (Render la setea automáticamente).
#         Si no existe, usa 5000 por defecto (desarrollo local).
# ─────────────────────────────────────────────────────────────────────────────

import os
from app import create_app

# Crear la aplicación Flask usando el factory de app.py
app = create_app()

if __name__ == "__main__":
    # Leer el puerto del entorno (necesario para Render) o usar 5000 en local
    port = int(os.environ.get("PORT", 5000))

    # debug=True recarga el servidor automáticamente al guardar cambios
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_ENV") == "development")
