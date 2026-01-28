import bcrypt from 'bcrypt';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export default async function authRoutes(fastify, options) {
  // Register
  fastify.post('/register', async (request, reply) => {
    try {
      const { email, password, displayName } = registerSchema.parse(request.body);

      const existingUser = await fastify.prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return reply.code(400).send({ error: 'Email ya registrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await fastify.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          displayName,
          role: 'usuario'
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true
        }
      });

      const token = fastify.jwt.sign({ 
        id: user.id, 
        email: user.email, 
        role: user.role 
      });

      return { user, token };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Error al registrar usuario' });
    }
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      const user = await fastify.prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return reply.code(401).send({ error: 'Credenciales inválidas' });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return reply.code(401).send({ error: 'Credenciales inválidas' });
      }

      const token = fastify.jwt.sign({ 
        id: user.id, 
        email: user.email, 
        role: user.role,
        storeId: user.storeId
      });

      return { 
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          storeId: user.storeId,
          mustChangePassword: user.mustChangePassword
        }, 
        token 
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Error al iniciar sesión' });
    }
  });

  // Get current user
  fastify.get('/me', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        storeId: true,
        mustChangePassword: true,
        active: true
      }
    });

    if (!user) {
      return reply.code(404).send({ error: 'Usuario no encontrado' });
    }

    return { user };
  });

  // Change password
  fastify.post('/change-password', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { newPassword } = request.body;

      if (!newPassword || newPassword.length < 6) {
        return reply.code(400).send({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await fastify.prisma.user.update({
        where: { id: request.user.id },
        data: {
          password: hashedPassword,
          mustChangePassword: false
        }
      });

      return { success: true, message: 'Contraseña actualizada' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Error al cambiar contraseña' });
    }
  });
}
