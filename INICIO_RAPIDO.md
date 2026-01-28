# 🚀 Guía de Inicio Rápido - FútbolMarket

## ✅ Migración Completada

Tu proyecto ha sido migrado exitosamente de **Svelte+Vite+Firebase** a **SvelteKit+Fastify+PostgreSQL**.

### 📁 Estructura de Carpetas

```
Documents/
├── svelte+vite-backup/          # ✅ Backup del proyecto original
│   └── canchapp/
│
└── sveltekit+fastify+postgres/  # ✅ Nuevo proyecto
    ├── backend/                 # API Fastify
    ├── frontend/                # SvelteKit (pendiente)
    └── docker-compose.yml       # PostgreSQL
```

---

## 🔧 Configuración Inicial

### 1. Instalar Dependencias del Backend

```bash
cd "c:/Users/Victor Miguel/Documents/sveltekit+fastify+postgres/backend"
npm install
```

### 2. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
copy .env.example .env
```

Edita `.env` si necesitas cambiar la configuración.

### 3. Iniciar PostgreSQL con Docker

```bash
cd "c:/Users/Victor Miguel/Documents/sveltekit+fastify+postgres"
docker-compose up -d
```

Esto iniciará PostgreSQL en `localhost:5432`.

### 4. Ejecutar Migraciones de Base de Datos

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Iniciar el Servidor Backend

```bash
npm run dev
```

El servidor estará corriendo en `http://localhost:3001`.

---

## 📊 Endpoints de la API

### Autenticación

- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/change-password` - Cambiar contraseña

### Stores (Complejos)

- `GET /api/stores` - Listar todos los stores
- `GET /api/stores/:id` - Obtener store por ID
- `POST /api/stores` - Crear store (super_admin)
- `PUT /api/stores/:id` - Actualizar store
- `DELETE /api/stores/:id` - Eliminar store (super_admin)
- `POST /api/stores/:id/assign-owner` - Asignar dueño (super_admin)

### Courts (Canchas)

- `GET /api/courts` - Listar canchas
- `POST /api/courts` - Crear cancha (store_owner)

### Reservations (Reservas)

- `GET /api/reservations` - Mis reservas
- `POST /api/reservations` - Crear reserva

### Chats

- `GET /api/chats` - Mis chats
- `POST /api/chats` - Crear chat

---

## 🧪 Probar la API

### 1. Registrar un usuario

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"123456\",\"displayName\":\"Test User\"}"
```

### 2. Iniciar sesión

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"123456\"}"
```

Guarda el `token` que recibes.

### 3. Crear un store (necesitas ser super_admin)

Primero, actualiza manualmente el rol en la base de datos:

```bash
npx prisma studio
```

Busca tu usuario y cambia `role` a `super_admin`.

Luego:

```bash
curl -X POST http://localhost:3001/api/stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d "{\"name\":\"Complejo Norte\",\"location\":\"Pasto, Nariño\",\"phone\":\"+57 300 123 4567\"}"
```

---

## 🎯 Próximos Pasos

### Frontend con SvelteKit

Para crear el frontend, ejecuta:

```bash
cd "c:/Users/Victor Miguel/Documents/sveltekit+fastify+postgres"
npm create svelte@latest frontend
```

Selecciona:
- ✅ Skeleton project
- ✅ TypeScript (opcional)
- ✅ ESLint + Prettier

Luego instala dependencias:

```bash
cd frontend
npm install
npm install -D @sveltejs/adapter-node
npm run dev
```

---

## 📝 Diferencias Clave vs Proyecto Anterior

| Aspecto | Antes (Firebase) | Ahora (PostgreSQL) |
|---------|------------------|-------------------|
| **Base de Datos** | Firestore (NoSQL) | PostgreSQL (SQL) |
| **Backend** | Cloud Functions | Fastify API |
| **Frontend** | Svelte + Vite | SvelteKit |
| **Autenticación** | Firebase Auth | JWT + bcrypt |
| **ORM** | Ninguno | Prisma |
| **Hosting** | Firebase Hosting | Node.js server |
| **Tiempo Real** | Firestore listeners | WebSockets |

---

## 🔐 Crear Super Admin

Para crear el primer super admin:

1. Registra un usuario normal
2. Abre Prisma Studio:
   ```bash
   npx prisma studio
   ```
3. Ve a la tabla `User`
4. Encuentra tu usuario
5. Cambia `role` de `usuario` a `super_admin`
6. Guarda

---

## 🛠️ Comandos Útiles

```bash
# Ver base de datos en navegador
npx prisma studio

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Resetear base de datos
npx prisma migrate reset

# Ver logs de PostgreSQL
docker-compose logs -f postgres

# Detener PostgreSQL
docker-compose down

# Detener y eliminar datos
docker-compose down -v
```

---

## 📚 Recursos

- [Documentación de SvelteKit](https://kit.svelte.dev/docs)
- [Documentación de Fastify](https://fastify.dev/)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de PostgreSQL](https://www.postgresql.org/docs/)

---

## ✅ Checklist de Migración

- [x] Backup del proyecto original creado
- [x] Estructura del nuevo proyecto creada
- [x] Backend Fastify configurado
- [x] Esquema de Prisma definido
- [x] Rutas de API implementadas
- [x] Docker Compose para PostgreSQL
- [ ] Frontend SvelteKit (pendiente)
- [ ] Migración de componentes UI
- [ ] Sistema de autenticación en frontend
- [ ] WebSockets para chat en tiempo real

---

## 🎉 ¡Listo!

Tu proyecto está migrado y listo para continuar el desarrollo con una arquitectura más robusta y escalable.

**Siguiente paso:** Crear el frontend con SvelteKit e integrar con la API de Fastify.
