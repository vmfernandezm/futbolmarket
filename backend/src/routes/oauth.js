import oauthPlugin from '@fastify/oauth2';
import bcrypt from 'bcrypt';

export default async function oauthRoutes(fastify, options) {
  // Configurar Google OAuth
  fastify.register(oauthPlugin, {
    name: 'googleOAuth2',
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID,
        secret: process.env.GOOGLE_CLIENT_SECRET
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/google',
    callbackUri: `${process.env.BACKEND_URL}/api/oauth/google/callback`
  });

  // Configurar Facebook OAuth
  fastify.register(oauthPlugin, {
    name: 'facebookOAuth2',
    credentials: {
      client: {
        id: process.env.FACEBOOK_APP_ID,
        secret: process.env.FACEBOOK_APP_SECRET
      },
      auth: oauthPlugin.FACEBOOK_CONFIGURATION
    },
    startRedirectPath: '/facebook',
    callbackUri: `${process.env.BACKEND_URL}/api/oauth/facebook/callback`,
    scope: ['email', 'public_profile']
  });

  // Callback de Google
  fastify.get('/google/callback', async (request, reply) => {
    try {
      const { token } = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

      // Obtener información del usuario de Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token.access_token}`
        }
      });

      const googleUser = await userInfoResponse.json();

      // Buscar o crear usuario
      let user = await fastify.prisma.user.findUnique({
        where: { googleId: googleUser.id }
      });

      if (!user) {
        // Verificar si existe un usuario con ese email
        const existingUser = await fastify.prisma.user.findUnique({
          where: { email: googleUser.email }
        });

        if (existingUser) {
          // Vincular cuenta de Google a usuario existente
          user = await fastify.prisma.user.update({
            where: { id: existingUser.id },
            data: {
              googleId: googleUser.id,
              avatar: googleUser.picture
            }
          });
        } else {
          // Crear nuevo usuario
          user = await fastify.prisma.user.create({
            data: {
              email: googleUser.email,
              displayName: googleUser.name,
              googleId: googleUser.id,
              avatar: googleUser.picture,
              role: 'usuario',
              active: true,
              mustChangePassword: false
            }
          });
        }
      } else {
        // Actualizar avatar si cambió
        if (user.avatar !== googleUser.picture) {
          user = await fastify.prisma.user.update({
            where: { id: user.id },
            data: { avatar: googleUser.picture }
          });
        }
      }

      // Generar JWT
      const jwtToken = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        storeId: user.storeId
      });

      // Redirigir al frontend con el token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return reply.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}&user=${encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        storeId: user.storeId,
        avatar: user.avatar
      }))}`);
    } catch (error) {
      fastify.log.error(error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return reply.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  });

  // Callback de Facebook
  fastify.get('/facebook/callback', async (request, reply) => {
    try {
      const { token } = await fastify.facebookOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

      // Obtener información del usuario de Facebook
      const userInfoResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token.access_token}`);
      const facebookUser = await userInfoResponse.json();

      if (!facebookUser.email) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return reply.redirect(`${frontendUrl}/login?error=no_email`);
      }

      // Buscar o crear usuario
      let user = await fastify.prisma.user.findUnique({
        where: { facebookId: facebookUser.id }
      });

      if (!user) {
        // Verificar si existe un usuario con ese email
        const existingUser = await fastify.prisma.user.findUnique({
          where: { email: facebookUser.email }
        });

        if (existingUser) {
          // Vincular cuenta de Facebook a usuario existente
          user = await fastify.prisma.user.update({
            where: { id: existingUser.id },
            data: {
              facebookId: facebookUser.id,
              avatar: facebookUser.picture?.data?.url
            }
          });
        } else {
          // Crear nuevo usuario
          user = await fastify.prisma.user.create({
            data: {
              email: facebookUser.email,
              displayName: facebookUser.name,
              facebookId: facebookUser.id,
              avatar: facebookUser.picture?.data?.url,
              role: 'usuario',
              active: true,
              mustChangePassword: false
            }
          });
        }
      } else {
        // Actualizar avatar si cambió
        const newAvatar = facebookUser.picture?.data?.url;
        if (newAvatar && user.avatar !== newAvatar) {
          user = await fastify.prisma.user.update({
            where: { id: user.id },
            data: { avatar: newAvatar }
          });
        }
      }

      // Generar JWT
      const jwtToken = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        storeId: user.storeId
      });

      // Redirigir al frontend con el token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return reply.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}&user=${encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        storeId: user.storeId,
        avatar: user.avatar
      }))}`);
    } catch (error) {
      fastify.log.error(error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return reply.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  });
}
