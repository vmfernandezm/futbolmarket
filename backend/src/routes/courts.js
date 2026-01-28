import { z } from 'zod';
import { getDistance } from 'geolib';

const createCourtSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.string().min(1, 'El tipo es requerido'),
  surface: z.string().optional(),
  capacity: z.number().int().positive('La capacidad debe ser positiva'),
  pricePerHour: z.number().positive('El precio debe ser positivo'),
  description: z.string().optional(),
  active: z.boolean().optional().default(true)
});

export default async function courtRoutes(fastify, options) {
  // Listar todas las canchas activas
  fastify.get('/', async (request, reply) => {
    const courts = await fastify.prisma.court.findMany({
      where: { active: true },
      include: { 
        store: {
          select: {
            id: true,
            name: true,
            location: true,
            city: true,
            latitude: true,
            longitude: true,
            address: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { courts };
  });

  // Listar canchas de un store específico (público)
  fastify.get('/store/:storeId', async (request, reply) => {
    const { storeId } = request.params;
    
    const courts = await fastify.prisma.court.findMany({
      where: { storeId, active: true },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            location: true,
            city: true,
            department: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return { courts };
  });

  // Ver detalle de una cancha específica (público)
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;
    
    const court = await fastify.prisma.court.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            location: true,
            city: true,
            department: true,
            phone: true
          }
        }
      }
    });

    if (!court) {
      return reply.code(404).send({ error: 'Cancha no encontrada' });
    }

    return { court };
  });

  // Listar canchas del store del dueño autenticado
  fastify.get('/my-courts', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'store_owner') {
      return reply.code(403).send({ error: 'Solo dueños de complejos pueden acceder' });
    }

    if (!request.user.storeId) {
      return reply.code(400).send({ error: 'No tienes un complejo asignado' });
    }

    const courts = await fastify.prisma.court.findMany({
      where: { storeId: request.user.storeId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return { courts };
  });

  // Crear una nueva cancha
  fastify.post('/', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      // Validar permisos
      if (request.user.role !== 'store_owner' && request.user.role !== 'super_admin') {
        return reply.code(403).send({ error: 'No autorizado' });
      }

      // Store owners solo pueden crear canchas en su propio complejo
      if (request.user.role === 'store_owner' && !request.user.storeId) {
        return reply.code(400).send({ error: 'No tienes un complejo asignado' });
      }

      // Validar datos
      const validatedData = createCourtSchema.parse(request.body);

      // Determinar el storeId
      let storeId;
      if (request.user.role === 'store_owner') {
        storeId = request.user.storeId;
      } else if (request.body.storeId) {
        storeId = request.body.storeId;
      } else {
        return reply.code(400).send({ error: 'storeId es requerido para super_admin' });
      }

      // Verificar que el store existe
      const store = await fastify.prisma.store.findUnique({
        where: { id: storeId }
      });

      if (!store) {
        return reply.code(404).send({ error: 'Complejo no encontrado' });
      }

      // Crear la cancha
      const court = await fastify.prisma.court.create({
        data: {
          ...validatedData,
          storeId
        },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              location: true
            }
          }
        }
      });

      return { court };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Datos inválidos', 
          details: error.errors 
        });
      }
      throw error;
    }
  });

  // Actualizar una cancha
  fastify.put('/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params;

      // Buscar la cancha
      const existingCourt = await fastify.prisma.court.findUnique({
        where: { id }
      });

      if (!existingCourt) {
        return reply.code(404).send({ error: 'Cancha no encontrada' });
      }

      // Validar permisos
      if (request.user.role === 'store_owner') {
        if (existingCourt.storeId !== request.user.storeId) {
          return reply.code(403).send({ error: 'No puedes editar canchas de otros complejos' });
        }
      } else if (request.user.role !== 'super_admin') {
        return reply.code(403).send({ error: 'No autorizado' });
      }

      // Actualizar
      const court = await fastify.prisma.court.update({
        where: { id },
        data: request.body,
        include: {
          store: {
            select: {
              id: true,
              name: true,
              location: true
            }
          }
        }
      });

      return { court };
    } catch (error) {
      throw error;
    }
  });

  // Eliminar una cancha
  fastify.delete('/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params;

    // Buscar la cancha
    const existingCourt = await fastify.prisma.court.findUnique({
      where: { id }
    });

    if (!existingCourt) {
      return reply.code(404).send({ error: 'Cancha no encontrada' });
    }

    // Validar permisos
    if (request.user.role === 'store_owner') {
      if (existingCourt.storeId !== request.user.storeId) {
        return reply.code(403).send({ error: 'No puedes eliminar canchas de otros complejos' });
      }
    } else if (request.user.role !== 'super_admin') {
      return reply.code(403).send({ error: 'No autorizado' });
    }

    // Eliminar (soft delete)
    await fastify.prisma.court.update({
      where: { id },
      data: { active: false }
    });

    return { message: 'Cancha eliminada exitosamente' };
  });

  // Obtener todas las canchas con ubicación para el mapa (público)
  fastify.get('/map', async (request, reply) => {
    try {
      const courts = await fastify.prisma.court.findMany({
        where: { 
          active: true,
          store: {
            latitude: { not: null },
            longitude: { not: null }
          }
        },
        include: { 
          store: {
            select: {
              id: true,
              name: true,
              location: true,
              city: true,
              latitude: true,
              longitude: true,
              address: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return { courts };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Error al obtener canchas para el mapa',
        details: error.message 
      });
    }
  });

  // Buscar canchas cercanas (público)
  fastify.get('/nearby', async (request, reply) => {
    try {
      const { lat, lng, radius = 5, type, maxPrice } = request.query;

      if (!lat || !lng) {
        return reply.code(400).send({ 
          error: 'Se requieren las coordenadas (lat y lng)' 
        });
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      // Validar coordenadas
      if (isNaN(latitude) || isNaN(longitude)) {
        return reply.code(400).send({ error: 'Coordenadas inválidas' });
      }

      // Obtener todas las canchas activas con ubicación
      let whereClause = { 
        active: true,
        store: {
          latitude: { not: null },
          longitude: { not: null }
        }
      };

      // Filtrar por tipo si se proporciona
      if (type) {
        whereClause.type = type;
      }

      // Filtrar por precio máximo si se proporciona
      if (maxPrice) {
        whereClause.pricePerHour = { lte: parseFloat(maxPrice) };
      }

      const courts = await fastify.prisma.court.findMany({
        where: whereClause,
        include: { 
          store: {
            select: {
              id: true,
              name: true,
              location: true,
              city: true,
              latitude: true,
              longitude: true,
              address: true,
              phone: true
            }
          }
        }
      });

      // Calcular distancias y filtrar por radio
      const courtsWithDistance = courts
        .map(court => {
          const distance = getDistance(
            { latitude, longitude },
            { 
              latitude: court.store.latitude, 
              longitude: court.store.longitude 
            }
          ) / 1000; // Convertir metros a kilómetros

          return {
            ...court,
            distance: parseFloat(distance.toFixed(2))
          };
        })
        .filter(court => court.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      return { 
        courts: courtsWithDistance,
        total: courtsWithDistance.length,
        userLocation: { latitude, longitude },
        radius: radiusKm
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Error al buscar canchas cercanas',
        details: error.message 
      });
    }
  });
}
