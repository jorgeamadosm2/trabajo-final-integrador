"""
Ejecutar UNA SOLA VEZ para poblar MongoDB Atlas con los 12 productos del sitio.
Uso: python utils/seed.py  (desde la carpeta backend/)
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import Producto

PRODUCTOS = [
    # ── MATERIA PRIMA ──────────────────────────────────────────────────
    {
        "nombre": "Cuero Curtido al Vegetal",
        "descripcion": "Cuero de alta calidad curtido con taninos naturales. Ideal para marroquinería y artesanías.",
        "precio": 18500,
        "unidad": "m²",
        "categoria": "materia-prima",
        "imagen_url": "../src/img/materia-prima.png",
        "etiqueta": "Nuevo",
        "destacado": True,
    },
    {
        "nombre": "Cuero Crudo Natural",
        "descripcion": "Cuero sin curtir en su estado natural. Disponible en distintos tamaños y grosores.",
        "precio": 12000,
        "unidad": "m²",
        "categoria": "materia-prima",
        "imagen_url": "../src/img/cuero-crudo.png",
        "etiqueta": None,
        "destacado": False,
    },
    {
        "nombre": "Cuero Napa Premium",
        "descripcion": "Cuero suave y flexible de primera calidad. Perfecto para carteras, billeteras y calzado.",
        "precio": 22000,
        "unidad": "m²",
        "categoria": "materia-prima",
        "imagen_url": "../src/img/materia-prima.png",
        "etiqueta": "Popular",
        "destacado": False,
    },
    {
        "nombre": "Cuero Repujado",
        "descripcion": "Cuero tratado especialmente para técnicas de repujado. Textura firme y uniforme.",
        "precio": 20000,
        "unidad": "m²",
        "categoria": "materia-prima",
        "imagen_url": "../src/img/materia-prima.png",
        "etiqueta": None,
        "destacado": False,
    },
    # ── ELABORADOS ─────────────────────────────────────────────────────
    {
        "nombre": "Cartera Artesanal Premium",
        "descripcion": "Cartera de cuero genuino hecha a mano. Diseño clásico con terminación premium.",
        "precio": 45000,
        "unidad": None,
        "categoria": "elaborados",
        "imagen_url": "../src/img/productos-elaborados.png",
        "etiqueta": "Nuevo",
        "destacado": True,
    },
    {
        "nombre": "Cinturón Artesanal",
        "descripcion": "Cinturón de cuero con hebilla de bronce. Disponible en varios talles y colores.",
        "precio": 15000,
        "unidad": None,
        "categoria": "elaborados",
        "imagen_url": "../src/img/cinturon-cuero.png",
        "etiqueta": "Popular",
        "destacado": True,
    },
    {
        "nombre": "Billetera Clásica",
        "descripcion": "Billetera de cuero genuino con múltiples compartimentos. Costura a mano.",
        "precio": 12500,
        "unidad": None,
        "categoria": "elaborados",
        "imagen_url": "../src/img/billetera-cuero.png",
        "etiqueta": None,
        "destacado": False,
    },
    {
        "nombre": "Mochila Artesanal",
        "descripcion": "Mochila de cuero genuino con correas reforzadas. Diseño moderno y funcional.",
        "precio": 68000,
        "unidad": None,
        "categoria": "elaborados",
        "imagen_url": "../src/img/productos-elaborados.png",
        "etiqueta": "Popular",
        "destacado": False,
    },
    # ── HERRAMIENTAS ───────────────────────────────────────────────────
    {
        "nombre": "Kit Herramientas Profesional",
        "descripcion": "Kit completo con herramientas esenciales para trabajar el cuero: sacabocados, punzones y más.",
        "precio": 32000,
        "unidad": None,
        "categoria": "herramientas",
        "imagen_url": "../src/img/accesorios-cuero.png",
        "etiqueta": None,
        "destacado": False,
    },
    {
        "nombre": "Hilos Encerados (Pack x10)",
        "descripcion": "Set de hilos encerados en 10 colores. Resistentes y duraderos para costura a mano.",
        "precio": 4500,
        "unidad": None,
        "categoria": "herramientas",
        "imagen_url": "../src/img/accesorios-cuero.png",
        "etiqueta": None,
        "destacado": False,
    },
    {
        "nombre": "Hebillas y Broches Surtidos",
        "descripcion": "Pack variado de hebillas, broches y remaches metálicos. Acabado bronce y plata.",
        "precio": 6800,
        "unidad": None,
        "categoria": "herramientas",
        "imagen_url": "../src/img/accesorios-cuero.png",
        "etiqueta": None,
        "destacado": False,
    },
    {
        "nombre": "Cera y Tinte para Cuero",
        "descripcion": "Kit de cera natural y tintes para terminación y conservación del cuero artesanal.",
        "precio": 3200,
        "unidad": None,
        "categoria": "herramientas",
        "imagen_url": "../src/img/accesorios-cuero.png",
        "etiqueta": "Nuevo",
        "destacado": False,
    },
]

def seed():
    app = create_app()
    with app.app_context():
        existentes = Producto.objects.count()
        if existentes > 0:
            print(f"⚠️  Ya hay {existentes} productos en la base de datos.")
            respuesta = input("¿Querés borrar todo y cargar de nuevo? (s/N): ")
            if respuesta.lower() != "s":
                print("Operación cancelada.")
                return
            Producto.objects.delete()
            print("Productos anteriores eliminados.")

        for datos in PRODUCTOS:
            p = Producto(**datos)
            p.save()
            print(f"  ✓ {p.nombre} ({p.categoria}) — ${p.precio:,.0f}")

        print(f"\n✅ {len(PRODUCTOS)} productos cargados en MongoDB Atlas.")

if __name__ == "__main__":
    seed()
