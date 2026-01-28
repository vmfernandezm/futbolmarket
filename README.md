# FútbolMarket - SvelteKit + Fastify + PostgreSQL

## 🏗️ Arquitectura del Proyecto

### Stack Tecnológico
- **Frontend:** SvelteKit
- **Backend API:** Fastify
- **Base de Datos:** PostgreSQL
- **ORM:** Prisma
- **Autenticación:** JWT + bcrypt

### Estructura del Proyecto
```
sveltekit+fastify+postgres/
├── frontend/           # SvelteKit app
│   ├── src/
│   │   ├── routes/    # Páginas y API routes
│   │   ├── lib/       # Componentes y utilidades
│   │   └── app.html
│   └── package.json
│
├── backend/            # Fastify API
│   ├── src/
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # Lógica de negocio
│   │   ├── models/    # Modelos de datos
│   │   └── server.js
│   └── package.json
│
├── database/           # PostgreSQL schemas
│   ├── prisma/
│   │   └── schema.prisma
│   └── migrations/
│
└── docker-compose.yml  # PostgreSQL container
```

## 🚀 Instalación

### 1. Instalar dependencias
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Configurar PostgreSQL
```bash
docker-compose up -d
```

### 3. Ejecutar migraciones
```bash
cd backend
npx prisma migrate dev
```

### 4. Iniciar desarrollo
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📊 Modelo de Datos

### Roles
- `super_admin` - Administrador del sistema
- `store_owner` - Dueño de complejo deportivo
- `usuario` - Cliente final

### Tablas Principales
- `users` - Usuarios del sistema
- `stores` - Complejos deportivos
- `courts` - Canchas
- `reservations` - Reservas
- `chats` - Conversaciones
- `messages` - Mensajes

## 🔐 Autenticación

- JWT tokens con refresh tokens
- Contraseñas hasheadas con bcrypt
- Middleware de autenticación en Fastify
- Hooks de autenticación en SvelteKit

## 🎯 Características

- ✅ Sistema de roles completo
- ✅ CRUD de stores, courts, reservations
- ✅ Chat en tiempo real (WebSockets)
- ✅ Panel de administración por rol
- ✅ Validación de datos con Zod
- ✅ Migraciones de base de datos
- ✅ API RESTful documentada

## 📝 Próximos Pasos

1. Configurar Prisma schema
2. Crear API endpoints en Fastify
3. Implementar autenticación JWT
4. Crear páginas en SvelteKit
5. Implementar WebSockets para chat
6. Deploy en producción
