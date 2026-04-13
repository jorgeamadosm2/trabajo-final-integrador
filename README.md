# CUERAR TUCUMÁN — Trabajo Final Integrador

Sitio web e-commerce para una empresa de cueros ubicada en Tucumán, Argentina. Permite a los visitantes explorar el catálogo de productos, agregar productos al carrito y generar pedidos, contactarse con la empresa y, a los administradores, gestionar el inventario, los mensajes y los pedidos recibidos desde un panel dedicado.

---

## Tecnologías utilizadas

### Frontend
- HTML5, CSS3 (metodología BEM), JavaScript vanilla
- Google Fonts: Playfair Display + Inter

### Backend
- **Python 3** + **Flask** — API REST
- **MongoEngine** — ODM para MongoDB
- **Flask-JWT-Extended** — autenticación con tokens JWT
- **Flask-Mail** — envío de emails (recuperación de contraseña)
- **Flask-CORS** — habilitación de CORS para el frontend
- **Werkzeug** — hashing seguro de contraseñas
- **python-dotenv** — variables de entorno
- **Gunicorn** — servidor WSGI para producción

### Base de datos
- **MongoDB Atlas** (cloud, tier gratuito M0)

### Despliegue
- **Backend**: Render (gunicorn + variable `PORT`)
- **Frontend**: Vercel

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
│   ├── pedido.html             # Carrito y confirmación de pedido
│   ├── login.html              # Inicio de sesión
│   ├── registro.html           # Crear cuenta
│   ├── recuperar-contrasena.html  # Solicitar reset de contraseña
│   ├── nueva-contrasena.html   # Ingresar nueva contraseña (desde email)
│   └── admin.html              # Panel de administración
├── src/
│   ├── js/
│   │   ├── api.js              # Cliente central HTTP (apiFetch)
│   │   ├── auth.js             # Sesión, navbar dinámico, logout
│   │   ├── productos-api.js    # Carga y renderiza productos desde la API
│   │   ├── carrito.js          # Lógica del carrito y generación de pedidos
│   │   ├── contacto-api.js     # Envía formulario de contacto a la API
│   │   ├── admin.js            # Lógica del panel de administración
│   │   └── main.js             # Interacciones generales de UI
│   └── img/                    # Imágenes del sitio
└── backend/
    ├── app.py                  # Factory function create_app()
    ├── config.py               # Configuración (lee variables de entorno)
    ├── run.py                  # Punto de entrada del servidor
    ├── extensions.py           # Instancias de mail y jwt (evita imports circulares)
    ├── requirements.txt        # Dependencias pip
    ├── .env.example            # Plantilla de variables de entorno
    ├── models/
    │   ├── usuario.py          # Modelo de usuario (admin / usuario, baja lógica)
    │   ├── producto.py         # Modelo de producto (con soft-delete, FK → usuario)
    │   ├── pedido.py           # Modelo de pedido con items embebidos
    │   └── contacto.py         # Modelo de mensaje de contacto
    ├── routes/
    │   ├── auth.py             # /api/auth — register, login, me, ABM usuarios, reset password
    │   ├── productos.py        # /api/productos — CRUD
    │   ├── pedidos.py          # /api/pedidos — crear, listar, cambiar estado, eliminar
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
FRONTEND_URL=http://localhost:5500

# Configuración de email (para recuperación de contraseña)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=app-password-de-gmail
MAIL_DEFAULT_SENDER=tu-email@gmail.com
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
| POST | `/api/auth/forgot-password` | Solicitar reset de contraseña por email | No |
| POST | `/api/auth/reset-password` | Confirmar nueva contraseña con token | No |
| GET | `/api/auth/usuarios` | Listar todos los usuarios | Admin JWT |
| PUT | `/api/auth/usuarios/<id>` | Editar nombre y rol de un usuario | Admin JWT |
| PATCH | `/api/auth/usuarios/<id>/estado` | Activar / desactivar usuario (baja lógica) | Admin JWT |

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

### Pedidos — `/api/pedidos`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/pedidos` | Crear un pedido desde el carrito | No |
| GET | `/api/pedidos` | Listar todos los pedidos (`?estado=pendiente`) | Admin JWT |
| PATCH | `/api/pedidos/<id>/estado` | Cambiar estado (`pendiente` / `procesado`) | Admin JWT |
| DELETE | `/api/pedidos/<id>` | Eliminar un pedido | Admin JWT |

### Contacto — `/api/contacto`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/contacto` | Enviar mensaje de contacto | No |
| GET | `/api/contacto` | Ver todos los mensajes | Admin JWT |
| PATCH | `/api/contacto/<id>/leido` | Marcar mensaje como leído | Admin JWT |
| DELETE | `/api/contacto/<id>` | Eliminar mensaje | Admin JWT |

---

## Roles de usuario

| Rol | Cómo se obtiene | Acceso |
|-----|----------------|--------|
| Visitante | Sin cuenta | Catálogo público, carrito y formulario de contacto |
| Usuario | Registro sin código | Navbar personalizado |
| Administrador | Registro con `ADMIN_SECRET_CODE` | Panel de administración completo |

---

## Funcionalidades del panel de administración

Accesible en `/pages/admin.html` (solo para administradores).

- **Estadísticas**: productos activos, inactivos, mensajes sin leer y pedidos pendientes
- **Gestión de productos**: agregar, editar, desactivar y restaurar productos; filtros por categoría
- **Gestión de pedidos**: ver pedidos recibidos, filtrar por estado, marcar como procesado, eliminar
- **Mensajes de contacto**: ver, filtrar por leídos/no leídos, marcar como leído, eliminar
- **Gestión de usuarios**: listar, editar nombre/rol y activar/desactivar cuentas (ABM completo)
- **Exportar a CSV**: exportar la lista de productos, pedidos o mensajes desde cada sección

---

## Carrito de compras

Los visitantes pueden agregar productos al carrito desde el catálogo. El carrito persiste en `localStorage` y permite:

- Agregar y quitar productos, modificar cantidades
- Ver el resumen con subtotales y total
- Confirmar el pedido (genera un número único `CT-xxxxxx` y lo registra en la API)
- Ver la confirmación con el número de pedido asignado

---

## Recuperación de contraseña

Flujo completo por email:

1. El usuario ingresa su email en `/pages/recuperar-contrasena.html`
2. La API genera un token (válido 1 hora) y envía un email con el link de reset
3. El usuario hace clic en el link → `/pages/nueva-contrasena.html?token=...`
4. Ingresa la nueva contraseña; la API valida el token y actualiza el hash

---

## Autor

Jorge Abraham Amado Sancho Miñano — Trabajo Final Integrador
