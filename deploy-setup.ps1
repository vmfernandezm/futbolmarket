# Script de Preparación para Deploy - FútbolMarket
# Este script prepara tu proyecto para hacer deploy en la nube

Write-Host "🚀 Preparando FútbolMarket para Deploy en la Nube" -ForegroundColor Green
Write-Host ""

# Verificar si Git está instalado
Write-Host "📋 Verificando Git..." -ForegroundColor Cyan
try {
    $gitVersion = git --version
    Write-Host "✅ Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git no está instalado. Por favor instala Git desde: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Creando archivo .gitignore..." -ForegroundColor Cyan

# Crear .gitignore en la raíz
$gitignoreContent = @"
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/
.svelte-kit/

# Environment variables
.env
.env.local
.env.production.local
.env.development.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Prisma
prisma/migrations/**/migration.sql

# Uploads
backend/uploads/*
!backend/uploads/.gitkeep
"@

Set-Content -Path ".gitignore" -Value $gitignoreContent
Write-Host "✅ .gitignore creado" -ForegroundColor Green

Write-Host ""
Write-Host "📝 Creando README.md..." -ForegroundColor Cyan

$readmeContent = @"
# ⚽ FútbolMarket

Sistema de reservas de canchas deportivas desarrollado con SvelteKit, Fastify y PostgreSQL.

## 🚀 Características

- ✅ Sistema de autenticación con JWT
- ✅ OAuth con Google y Facebook
- ✅ Gestión de canchas deportivas
- ✅ Sistema de reservas
- ✅ Chat en tiempo real
- ✅ Geolocalización con mapas
- ✅ Sistema de horarios flexible
- ✅ Panel de administración

## 🛠️ Tecnologías

**Frontend:**
- SvelteKit
- Bootstrap 5
- Leaflet (mapas)

**Backend:**
- Fastify
- Prisma ORM
- PostgreSQL
- WebSockets

## 📦 Instalación Local

### Backend

\`\`\`bash
cd backend
npm install
npx prisma migrate dev
npm run dev
\`\`\`

### Frontend

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## 🌐 Deploy

Ver [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) para instrucciones completas de deployment.

## 📄 Licencia

MIT
"@

Set-Content -Path "README.md" -Value $readmeContent
Write-Host "✅ README.md creado" -ForegroundColor Green

Write-Host ""
Write-Host "🔧 Inicializando repositorio Git..." -ForegroundColor Cyan

# Verificar si ya es un repositorio Git
if (Test-Path ".git") {
    Write-Host "⚠️  Ya existe un repositorio Git. Saltando inicialización." -ForegroundColor Yellow
} else {
    git init
    Write-Host "✅ Repositorio Git inicializado" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Agregando archivos al staging..." -ForegroundColor Cyan
git add .

Write-Host ""
Write-Host "💾 Creando commit inicial..." -ForegroundColor Cyan
git commit -m "Initial commit - FútbolMarket ready for deployment"

Write-Host ""
Write-Host "✅ ¡Proyecto preparado para deploy!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Crea un repositorio en GitHub: https://github.com/new" -ForegroundColor White
Write-Host "2. Ejecuta estos comandos (reemplaza TU_USUARIO con tu usuario de GitHub):" -ForegroundColor White
Write-Host ""
Write-Host "   git remote add origin https://github.com/TU_USUARIO/futbolmarket.git" -ForegroundColor Yellow
Write-Host "   git branch -M main" -ForegroundColor Yellow
Write-Host "   git push -u origin main" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Sigue la guía completa en: DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "🎉 ¡Listo para la nube!" -ForegroundColor Green
