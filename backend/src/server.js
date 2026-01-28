import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
import authRoutes from './routes/auth.js';
import storeRoutes from './routes/stores.js';
import courtRoutes from './routes/courts.js';
import reservationRoutes from './routes/reservations.js';
import chatRoutes from './routes/chats.js';
import uploadRoutes from './routes/upload.js';
import oauthRoutes from './routes/oauth.js';
import scheduleRoutes from './routes/schedules.js';

dotenv.config();

const prisma = new PrismaClient();
const fastify = Fastify({
  logger: true
});

// Register plugins
await fastify.register(cors, {
  origin: true,
  credentials: true
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key'
});

await fastify.register(websocket);

await fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Servir archivos estáticos desde /uploads
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/'
});

// Decorate fastify with prisma
fastify.decorate('prisma', prisma);

// Auth decorator
fastify.decorate('authenticate', async function(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(storeRoutes, { prefix: '/api/stores' });
fastify.register(courtRoutes, { prefix: '/api/courts' });
fastify.register(reservationRoutes, { prefix: '/api/reservations' });
fastify.register(chatRoutes, { prefix: '/api/chats' });
fastify.register(uploadRoutes, { prefix: '/api/upload' });
fastify.register(oauthRoutes, { prefix: '/api/oauth' });
fastify.register(scheduleRoutes, { prefix: '/api/courts' });

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();


// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await fastify.close();
  process.exit(0);
});
