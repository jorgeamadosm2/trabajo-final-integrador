# CUERAR TUCUMÁN — Trabajo Final Integrador

Sitio web e-commerce para una empresa de cueros ubicada en Tucumán, Argentina. Permite a los visitantes explorar el catálogo de productos, contactarse con la empresa y, a los administradores, gestionar el inventario y los mensajes recibidos desde un panel dedicado.

---

## Tecnologías utilizadas

### Frontend
- HTML5, CSS3 (metodología BEM), JavaScript vanilla
- Google Fonts: Playfair Display + Inter

### Backend
- **Python 3** + **Flask** — API REST
- **MongoEngine** — ODM para MongoDB
- **Flask-JWT-Extended** — autenticación con tokens JWT
- **Flask-CORS** — habilitación de CORS para el frontend
- **Werkzeug** — hashing seguro de contraseñas
- **python-dotenv** — variables de entorno

### Base de datos
- **MongoDB Atlas** (cloud, tier gratuito M0)

---

## Estructura del proyecto

```
TRABAJO-FINAL-INTEGRADOR/
├── index.html                  # Página principal
├── style.css                   # Estilos globales (BEM)
├── pages/
│   ├── productos.html          # Catálogo completo
│   ├── sobre-nosotros.html     # Historia y equipo
│   ├── contacto.html           # Formulario de contacto
│   ├── login.html              # Inicio de sesión
│   ├── registro.html           # Crear cuenta
│   └── admin.html              # Panel de administración
├── src/
│   ├── js/
│   │   ├── api.js              # Cliente central HTTP (apiFetch)
│   │   ├── auth.js             # Sesión, navbar dinámico, logout
│   │   ├── productos-api.js    # Carga y renderiza productos desde la API
│   │   ├── contacto-api.js     # Envía formulario de contacto a la API
│   │   ├── admin.js            # Lógica del panel de administración
│   │   └── main.js             # Interacciones generales de UI
│   └── img/                    # Imágenes del sitio
└── backend/
    ├── app.py                  # Factory function create_app()
    ├── config.py               # Configuración (lee variables de entorno)
    ├── run.py                  # Punto de entrada del servidor
    ├── requirements.txt        # Dependencias pip
    ├── .env.example            # Plantilla de variables de entorno
    ├── models/
    │   ├── usuario.py          # Modelo de usuario (admin / usuario)
    │   ├── producto.py         # Modelo de producto (con soft-delete)
    │   └── contacto.py         # Modelo de mensaje de contacto
    ├── routes/
    │   ├── auth.py             # /api/auth — register, login, me
    │   ├── productos.py        # /api/productos — CRUD
    │   └── contacto.py         # /api/contacto — enviar y gestionar mensajes
    └── utils/
        ├── decorators.py       # Decorador admin_required
        └── seed.py             # Poblar la base de datos con datos iniciales
```

---

## Instalación y puesta en marcha

### Requisitos previos
- Python 3.10 o superior
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas) con un cluster creado
- Un servidor de archivos estáticos para el frontend (ej: Live Server en VS Code)

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd TRABAJO-FINAL-INTEGRADOR
```

### 2. Configurar el backend

```bash
cd backend

# Crear y activar el entorno virtual
python -m venv venv
venv\Scripts\activate.bat        # Windows
# source venv/bin/activate       # Linux / macOS

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Configurar las variables de entorno

```bash
# Copiar la plantilla
copy .env.example .env
```

Editar `.env` con los valores reales:

```env
MONGO_URI=mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net/cuerar_db
JWT_SECRET_KEY=una-clave-secreta-larga-y-aleatoria
FLASK_ENV=development
ADMIN_SECRET_CODE=codigo-secreto-para-admins
```

> El archivo `.env` nunca debe subirse al repositorio (ya está en `.gitignore`).

### 4. Poblar la base de datos (primera vez)

```bash
python utils/seed.py
```

Esto crea los 12 productos del catálogo original en MongoDB Atlas.

### 5. Iniciar el servidor

```bash
python run.py
# Servidor disponible en http://localhost:5000
```

### 6. Abrir el frontend

Abrir `index.html` con **Live Server** (VS Code) o cualquier servidor local en el puerto `5500`. La API ya está configurada para aceptar peticiones desde `http://localhost:5500`.

---

## API REST

La API base es `http://localhost:5000/api`.

### Autenticación — `/api/auth`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Registrar nuevo usuario | No |
| POST | `/api/auth/login` | Iniciar sesión, devuelve JWT | No |
| GET | `/api/auth/me` | Datos del usuario actual | JWT |

Para crear un administrador, incluir `codigo_admin` en el body del registro.

### Productos — `/api/productos`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/productos` | Listar productos activos (`?categoria=`) | No |
| GET | `/api/productos?todos=true` | Listar todos (incluye inactivos) | Admin JWT |
| GET | `/api/productos/destacados` | Top destacados para el inicio | No |
| GET | `/api/productos/<id>` | Obtener un producto | No |
| POST | `/api/productos` | Crear producto | Admin JWT |
| PUT | `/api/productos/<id>` | Editar producto | Admin JWT |
| DELETE | `/api/productos/<id>` | Desactivar producto (soft-delete) | Admin JWT |

### Contacto — `/api/contacto`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/contacto` | Enviar mensaje de contacto | No |
| GET | `/api/contacto` | Ver todos los mensajes | Admin JWT |
| PATCH | `/api/contacto/<id>/leido` | Marcar mensaje como leído | Admin JWT |

---

## Roles de usuario

| Rol | Cómo se obtiene | Acceso |
|-----|----------------|--------|
| Visitante | Sin cuenta | Catálogo público y formulario de contacto |
| Usuario | Registro sin código | Navbar personalizado |
| Administrador | Registro con `ADMIN_SECRET_CODE` | Panel de administración completo |

---

## Funcionalidades del panel de administración

Accesible en `/pages/admin.html` (solo para administradores).

- **Estadísticas**: productos activos, inactivos y mensajes sin leer
- **Gestión de productos**: agregar, editar, desactivar y restaurar productos
- **Filtros**: por categoría (materia prima, elaborados, herramientas)
- **Mensajes de contacto**: ver, filtrar por leídos/no leídos, marcar como leído

---

## Autor

Jorge Amado — Trabajo Final Integrador
