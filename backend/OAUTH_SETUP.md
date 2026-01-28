# Guía de Configuración OAuth - Google y Facebook

Esta guía te ayudará a configurar la autenticación con Google y Facebook en tu aplicación FútbolMarket.

---

## 📋 Requisitos Previos

- Cuenta de Google (para Google OAuth)
- Cuenta de Facebook (para Facebook OAuth)
- Aplicación backend corriendo en `http://localhost:3001`
- Aplicación frontend corriendo en `http://localhost:5173`

---

## 🔵 Configuración de Google OAuth

### Paso 1: Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombre sugerido: "FutbolMarket"

### Paso 2: Habilitar Google+ API

1. En el menú lateral, ve a **APIs & Services** > **Library**
2. Busca "Google+ API"
3. Haz clic en **Enable**

### Paso 3: Crear Credenciales OAuth 2.0

1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **Create Credentials** > **OAuth client ID**
3. Si es la primera vez, configura la pantalla de consentimiento:
   - **User Type**: External
   - **App name**: FútbolMarket
   - **User support email**: Tu email
   - **Developer contact**: Tu email
   - **Scopes**: Agrega `email` y `profile`
   - Guarda y continúa

4. Vuelve a **Create Credentials** > **OAuth client ID**
5. **Application type**: Web application
6. **Name**: FutbolMarket Web Client
7. **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   http://localhost:3001
   ```
8. **Authorized redirect URIs**:
   ```
   http://localhost:3001/api/oauth/google/callback
   ```
9. Haz clic en **Create**

### Paso 4: Copiar Credenciales

1. Copia el **Client ID** y **Client Secret**
2. Pégalos en tu archivo `.env`:
   ```env
   GOOGLE_CLIENT_ID="tu-client-id-aqui.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="tu-client-secret-aqui"
   ```

---

## 🔵 Configuración de Facebook OAuth

### Paso 1: Crear Aplicación en Facebook Developers

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Haz clic en **My Apps** > **Create App**
3. Selecciona **Consumer** como tipo de app
4. Nombre de la app: "FútbolMarket"
5. Email de contacto: Tu email
6. Haz clic en **Create App**

### Paso 2: Configurar Facebook Login

1. En el dashboard de tu app, busca **Facebook Login**
2. Haz clic en **Set Up**
3. Selecciona **Web**
4. En **Site URL**, ingresa: `http://localhost:5173`
5. Guarda los cambios

### Paso 3: Configurar OAuth Redirect URIs

1. En el menú lateral, ve a **Facebook Login** > **Settings**
2. En **Valid OAuth Redirect URIs**, agrega:
   ```
   http://localhost:3001/api/oauth/facebook/callback
   ```
3. Guarda los cambios

### Paso 4: Obtener App ID y App Secret

1. Ve a **Settings** > **Basic**
2. Copia el **App ID** y **App Secret**
3. Pégalos en tu archivo `.env`:
   ```env
   FACEBOOK_APP_ID="tu-app-id-aqui"
   FACEBOOK_APP_SECRET="tu-app-secret-aqui"
   ```

### Paso 5: Configurar Permisos

1. En **App Review** > **Permissions and Features**
2. Solicita los permisos:
   - `email` (aprobado por defecto)
   - `public_profile` (aprobado por defecto)

### Paso 6: Modo de Desarrollo vs Producción

**Importante**: Por defecto, tu app está en modo desarrollo y solo tú puedes usarla.

**Para desarrollo:**
- Ve a **Roles** > **Test Users** para crear usuarios de prueba
- O agrega usuarios reales en **Roles** > **Roles**

**Para producción:**
- Ve a **Settings** > **Basic**
- Cambia el modo de la app a **Live**
- Completa la revisión de la app si es necesario

---

## 🔧 Configuración del Backend

Tu archivo `.env` debe verse así:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/canchap?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
NODE_ENV=development

# OAuth Configuration
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:5173"

# Google OAuth
GOOGLE_CLIENT_ID="123456789-abc123.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc123xyz789"

# Facebook OAuth
FACEBOOK_APP_ID="1234567890123456"
FACEBOOK_APP_SECRET="abc123xyz789def456ghi789"
```

---

## 🚀 Probar la Integración

### 1. Reiniciar el Backend

```bash
cd backend
npm run dev
```

### 2. Probar Google Login

1. Ve a `http://localhost:5173/login`
2. Haz clic en **Iniciar sesión con Google**
3. Selecciona tu cuenta de Google
4. Autoriza los permisos
5. Deberías ser redirigido al dashboard

### 3. Probar Facebook Login

1. Ve a `http://localhost:5173/login`
2. Haz clic en **Iniciar sesión con Facebook**
3. Ingresa tus credenciales de Facebook
4. Autoriza los permisos
5. Deberías ser redirigido al dashboard

---

## 🔍 Solución de Problemas

### Error: "redirect_uri_mismatch"

**Causa**: La URL de redirección no coincide con las configuradas.

**Solución**:
- Verifica que las URLs en Google/Facebook coincidan exactamente con:
  - Google: `http://localhost:3001/api/oauth/google/callback`
  - Facebook: `http://localhost:3001/api/oauth/facebook/callback`
- No olvides incluir `http://` y el puerto

### Error: "invalid_client"

**Causa**: Client ID o Client Secret incorrectos.

**Solución**:
- Verifica que copiaste correctamente las credenciales
- Asegúrate de no tener espacios extra en el archivo `.env`
- Reinicia el servidor después de cambiar `.env`

### Error: "Email not provided" (Facebook)

**Causa**: Facebook no proporcionó el email del usuario.

**Solución**:
- Verifica que solicitaste el permiso `email` en Facebook
- Asegúrate de que el usuario tenga un email verificado en Facebook
- Revisa que el scope incluya `email` en la configuración

### Usuario no puede iniciar sesión (Facebook en desarrollo)

**Causa**: La app está en modo desarrollo.

**Solución**:
- Agrega al usuario como **Tester** o **Developer** en **Roles**
- O cambia la app a modo **Live** (producción)

---

## 📊 Flujo de Autenticación

### Flujo Completo:

```
Usuario hace clic en "Iniciar con Google/Facebook"
  ↓
Frontend redirige a: http://localhost:3001/api/oauth/google
  ↓
Backend redirige a Google/Facebook para autenticación
  ↓
Usuario autoriza en Google/Facebook
  ↓
Google/Facebook redirige a: http://localhost:3001/api/oauth/google/callback
  ↓
Backend obtiene token de acceso
  ↓
Backend obtiene información del usuario (email, nombre, foto)
  ↓
Backend busca o crea usuario en la base de datos
  ↓
Backend genera JWT token
  ↓
Backend redirige a: http://localhost:5173/auth/callback?token=xxx&user=xxx
  ↓
Frontend guarda token y usuario en localStorage
  ↓
Frontend redirige a /dashboard
  ↓
✅ Usuario autenticado
```

---

## 🔐 Seguridad

### Producción

Cuando despliegues a producción, actualiza las URLs:

```env
BACKEND_URL="https://tu-dominio-backend.com"
FRONTEND_URL="https://tu-dominio-frontend.com"
```

Y actualiza las URLs autorizadas en:
- Google Cloud Console
- Facebook Developers

### Mejores Prácticas

1. **Nunca** compartas tus Client Secrets
2. Usa variables de entorno diferentes para desarrollo y producción
3. Habilita HTTPS en producción
4. Revisa regularmente los permisos solicitados
5. Implementa rate limiting en los endpoints OAuth

---

## 📚 Recursos Adicionales

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [@fastify/oauth2 Documentation](https://github.com/fastify/fastify-oauth2)

---

## ✅ Checklist de Configuración

- [ ] Proyecto creado en Google Cloud Console
- [ ] Credenciales OAuth 2.0 creadas en Google
- [ ] URLs de redirección configuradas en Google
- [ ] App creada en Facebook Developers
- [ ] Facebook Login configurado
- [ ] URLs de redirección configuradas en Facebook
- [ ] Variables de entorno configuradas en `.env`
- [ ] Backend reiniciado
- [ ] Prueba de login con Google exitosa
- [ ] Prueba de login con Facebook exitosa

---

**¡Listo! Ahora tus usuarios pueden iniciar sesión con Google y Facebook.** 🎉
