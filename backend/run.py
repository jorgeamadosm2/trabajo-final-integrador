import os
from app import create_app

# Punto de entrada para correr el servidor.
# En local ejecuto: python run.py
# En Render, el puerto viene de la variable PORT que ellos asignan automáticamente.
app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_ENV") == "development")
