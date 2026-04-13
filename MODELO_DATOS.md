# Modelo de Datos — CUERAR TUCUMÁN

## Base de datos

**Motor:** MongoDB Atlas (NoSQL documental)  
**ODM:** MongoEngine (Python)  
**Colecciones:** `usuarios`, `productos`, `mensajes_contacto`

---

## Diagrama Entidad-Relación (conceptual)

```
┌──────────────────────────────────┐
│           USUARIO                │
├──────────────────────────────────┤
│ PK  _id           : ObjectId     │
│     nombre        : String       │
│     email         : String(único)│
│     password_hash : String       │
│     es_admin      : Boolean      │
│     activo        : Boolean      │
│     created_at    : DateTime     │
│     reset_token   : String|null  │
│     reset_token_expires: DateTime│
└──────────────────────────────────┘
              │
              │  1 usuario admin puede crear muchos productos
              │  (relación 1:N)
              ▼
┌──────────────────────────────────┐
│           PRODUCTO               │
├──────────────────────────────────┤
│ PK  _id           : ObjectId     │
│ FK  creado_por    : → USUARIO._id│
│     nombre        : String       │
│     descripcion   : String       │
│     precio        : Float        │
│     unidad        : String|null  │
│     categoria     : String       │
│     imagen_url    : String|null  │
│     etiqueta      : String|null  │
│     destacado     : Boolean      │
│     activo        : Boolean      │
│     created_at    : DateTime     │
│     updated_at    : DateTime     │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│       MENSAJE_CONTACTO           │
├──────────────────────────────────┤
│ PK  _id           : ObjectId     │
│     nombre        : String       │
│     email         : String       │
│     asunto        : String       │
│     mensaje       : String       │
│     leido         : Boolean      │
│     created_at    : DateTime     │
└──────────────────────────────────┘
```

---

## Descripción de entidades

### USUARIO
Representa a las personas registradas en el sistema.

| Campo         | Tipo     | Restricciones | Descripción |
|---------------|----------|---------------|-------------|
| `_id`         | ObjectId | PK, auto-generada | Clave primaria |
| `nombre`      | String   | required, max 100 | Nombre completo |
| `email`       | String   | required, unique | Email de acceso (índice único) |
| `password_hash` | String   | required | Contraseña hasheada con werkzeug |
| `es_admin`    | Boolean  | default: false | Rol del usuario |
| `activo`      | Boolean  | default: true | Baja lógica (false =dado de baja) |
| `created_at`  | DateTime | auto | Fecha de registro |
| `reset_token` | String   | nullable | Token para recuperar contraseña |
| `reset_token_expires` | DateTime | nullable | Expiración del token (1 hora) |

### PRODUCTO
Representa los artículos del catálogo de CUERAR TUCUMÁN.

| Campo         | Tipo     | Restricciones | Descripción |
|---------------|----------|---------------|-------------|
| `_id`         | ObjectId | PK, auto-generada | Clave primaria |
| `creado_por`  | ObjectId | FK → USUARIO._id, nullable | Admin que creó el producto |
| `nombre`      | String   | required, max 200 | Nombre del producto |
| `descripcion` | String   | opcional | Descripción detallada |
| `precio`      | Float    | required, ≥ 0 | Precio en pesos ARS |
| `unidad`      | String   | nullable, max 20 | Unidad de medida (m², unidad, etc.) |
| `categoria`   | String   | required, enum | materia-prima / elaborados / herramientas |
| `imagen_url`  | String   | nullable, max 300 | URL de la imagen |
| `etiqueta`    | String   | nullable, max 30 | Nuevo / Popular / null |
| `destacado`   | Boolean  | default: false | Mostrar en sección destacados |
| `activo`      | Boolean  | default: true | Soft-delete (false = no visible al público) |
| `created_at`  | DateTime | auto | Fecha de creación |
| `updated_at`  | DateTime | auto | Fecha de última modificación |

### MENSAJE_CONTACTO
Representa los mensajes enviados por visitantes a través del formulario de contacto.

| Campo         | Tipo     | Restricciones | Descripción |
|---------------|----------|---------------|-------------|
| `_id`         | ObjectId | PK, auto-generada | Clave primaria |
| `nombre`      | String   | required, max 150 | Nombre del remitente |
| `email`       | String   | required, email válido | Email de contacto |
| `asunto`      | String   | required, enum | consulta / mayorista / pedido / otro |
| `mensaje`     | String   | required, min 10 chars | Cuerpo del mensaje |
| `leido`       | Boolean  | default: false | Estado de lectura por el admin |
| `created_at`  | DateTime | auto | Fecha de envío |

---

## Relaciones

|       Relación       | Tipo | Descripción |
|----------------      |------|-------------|
| USUARIO → PRODUCTO   | 1:N  | Un usuario admin puede crear múltiples productos. `Producto.creado_por` es una clave foránea (ReferenceField) que apunta al `_id` del usuario. |

> **Nota sobre MongoDB:** En bases de datos documentales, las claves foráneas se implementan mediante `ReferenceField` (referencia al `_id` del documento relacionado), equivalente conceptual a una FK relacional. La entidad `MensajeContacto` es independiente ya que el formulario de contacto admite envíos anónimos.

---

## Operaciones CRUD por entidad

| Entidad | Create | Read | Update | Delete |
|---------|--------|------|--------|--------|
| **Usuario** | `POST /api/auth/register` | `GET /api/auth/me`, `GET /api/auth/usuarios` | `PUT /api/auth/usuarios/<id>` | `PATCH /api/auth/usuarios/<id>/estado` (baja lógica) |
| **Producto** | `POST /api/productos` | `GET /api/productos`, `GET /api/productos/<id>` | `PUT /api/productos/<id>` | `DELETE /api/productos/<id>` (soft-delete) |
| **MensajeContacto** | `POST /api/contacto` | `GET /api/contacto` | `PATCH /api/contacto/<id>/leido` | `DELETE /api/contacto/<id>` |
