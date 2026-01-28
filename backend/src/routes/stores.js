import { z } from 'zod';

const createStoreSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  location: z.string().min(5),
  phone: z.string().optional(),
  city: z.string().default('Pasto'),
  department: z.string().default('Nariño')
});

export default async function storeRoutes(fastify, options) {
  // Get all stores
  fastify.get('/', async (request, reply) => {
    const stores = await fastify.prisma.store.findMany({
      where: { active: true },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        },
        _count: {
          select: { courts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { stores };
  });

  // Get store by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;

    const store = await fastify.prisma.store.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        },
        courts: {
          where: { active: true }
        }
      }
    });

    if (!store) {
      return reply.code(404).send({ error: 'Store no encontrado' });
    }

    return { store };
  });

  // Create store (super_admin only)
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      if (request.user.role !== 'super_admin') {
        return reply.code(403).send({ error: 'No autorizado' });
      }

      const data = createStoreSchema.parse(request.body);

      const store = await fastify.prisma.store.create({
        data: {
          ...data,
          createdBy: request.user.id
        }
      });

      return { store };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Error al crear store' });
    }
  });

  // Update store
  fastify.put('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const store = await fastify.prisma.store.findUnique({ where: { id } });

      if (!store) {
        return reply.code(404).send({ error: 'Store no encontrado' });
      }

      if (request.user.role !== 'super_admin' && store.ownerId !== request.user.id) {
        return reply.code(403).send({ error: 'No autorizado' });
      }

      const data = createStoreSchema.partial().parse(request.body);

      const updatedStore = await fastify.prisma.store.update({
        where: { id },
        data
      });

      return { store: updatedStore };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Error al actualizar store' });
    }
  });

  // Delete store (super_admin only)
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    if (request.user.role !== 'super_admin') {
      return reply.code(403).send({ error: 'No autorizado' });
    }

    const { id } = request.params;

    await fastify.prisma.store.update({
      where: { id },
      data: { active: false }
    });

    return { success: true };
  });

  // Assign owner to store (super_admin only)
  fastify.post('/:id/assign-owner', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      if (request.user.role !== 'super_admin') {
        return reply.code(403).send({ error: 'No autorizado' });
      }

      const { id: storeId } = request.params;
      const { ownerId } = request.body;

      // Verificar que el store existe
      const store = await fastify.prisma.store.findUnique({
        where: { id: storeId }
      });

      if (!store) {
        return reply.code(404).send({ error: 'Complejo no encontrado' });
      }

      // Verificar que el usuario existe y es store_owner
      const user = await fastify.prisma.user.findUnique({
        where: { id: ownerId }
      });

      if (!user) {
        return reply.code(404).send({ error: 'Usuario no encontrado' });
      }

      if (user.role !== 'store_owner') {
        return reply.code(400).send({ error: 'El usuario debe tener rol store_owner' });
      }

      if (user.storeId) {
        return reply.code(400).send({ error: 'Este usuario ya tiene un complejo asignado' });
      }

      // Actualizar el usuario con el storeId
      await fastify.prisma.user.update({
        where: { id: ownerId },
        data: { storeId: storeId }
      });

      // Actualizar el store con el ownerId
      const updatedStore = await fastify.prisma.store.update({
        where: { id: storeId },
        data: { ownerId: ownerId },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              displayName: true,
              role: true
            }
          }
        }
      });

      return { store: updatedStore };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Error al asignar dueño',
        details: error.message 
      });
    }
  });

  // Actualizar ubicación del complejo
  fastify.put('/:id/location', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { latitude, longitude, address } = request.body;

      // Validar que el usuario sea el dueño del complejo
      const store = await fastify.prisma.store.findUnique({
        where: { id }
      });

      if (!store) {
        return reply.code(404).send({ error: 'Complejo no encontrado' });
      }

      // Verificar que el usuario sea super_admin o que el store sea el asignado al usuario
      if (request.user.role !== 'super_admin' && request.user.storeId !== id) {
        return reply.code(403).send({ error: 'No tienes permiso para actualizar este complejo' });
      }

      // Validar coordenadas
      if (latitude < -90 || latitude > 90) {
        return reply.code(400).send({ error: 'Latitud inválida (debe estar entre -90 y 90)' });
      }

      if (longitude < -180 || longitude > 180) {
        return reply.code(400).send({ error: 'Longitud inválida (debe estar entre -180 y 180)' });
      }

      // Actualizar ubicación
      const updatedStore = await fastify.prisma.store.update({
        where: { id },
        data: {
          latitude,
          longitude,
          address: address || null
        }
      });

      return { 
        store: updatedStore,
        message: 'Ubicación actualizada exitosamente'
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Error al actualizar ubicación',
        details: error.message 
      });
    }
  });
}
