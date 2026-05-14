import os
from app import create_app

# ── Punto de entrada del servidor ─────────────────────────────────────────────
# Ejecutar con: python run.py
# El puerto lo puede sobreescribir la variable PORT (usado por Render en producción).
app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_ENV") == "development")
