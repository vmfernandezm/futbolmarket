import { z } from 'zod';

const createReservationSchema = z.object({
  courtId: z.string().uuid('ID de cancha inválido'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Fecha inválida'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora de inicio inválida (formato HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora de fin inválida (formato HH:MM)')
});

const updateReservationStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed'])
});

export default async function reservationRoutes(fastify, options) {
  // Listar mis reservas (usuario autenticado)
  fastify.get('/my-reservations', { 
    onRequest: [fastify.authenticate] 
  }, async (request, reply) => {
    try {
      const reservations = await fastify.prisma.reservation.findMany({
        where: { userId: request.user.id },
        include: { 
          court: { 
            include: { 
              store: {
                select: {
                  id: true,
                  name: true,
                  location: true,
                  city: true,
                  phone: true
                }
              }
            } 
          } 
        },
        orderBy: { date: 'desc' }
      });
      
      return { reservations };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Error al obtener reservas' });
    }
  });

  // Listar reservas de mis canchas (store_owner)
  fastify.get('/store-reservations', { 
    onRequest: [fastify.authenticate] 
  }, async (request, reply) => {
    try {
      if (request.user.role !== 'store_owner') {
        return reply.code(403).send({ error: 'Solo dueños de complejos pueden acceder' });
      }

      if (!request.user.storeId) {
        return reply.code(400).send({ error: 'No tienes un complejo asignado' });
      }

      // Obtener todas las canchas del store
      const courts = await fastify.prisma.court.findMany({
        where: { storeId: request.user.storeId },
        select: { id: true }
      });

      const courtIds = courts.map(c => c.id);

      // Obtener reservas de esas canchas
      const reservations = await fastify.prisma.reservation.findMany({
        where: { 
          courtId: { in: courtIds }
        },
        include: {
          court: {
            select: {
              id: true,
              name: true,
              type: true,
              pricePerHour: true
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              displayName: true
            }
          }
        },
        orderBy: { date: 'desc' }
      });

      return { reservations };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Error al obtener reservas del complejo' });
    }
  });

  // Obtener estadísticas de reservas (store_owner)
  fastify.get('/store-stats', { 
    onRequest: [fastify.authenticate] 
  }, async (request, reply) => {
    try {
      if (request.user.role !== 'store_owner') {
        return reply.code(403).send({ error: 'Solo dueños de complejos pueden acceder' });
      }

      if (!request.user.storeId) {
        return reply.code(400).send({ error: 'No tienes un complejo asignado' });
      }

      // Obtener todas las canchas del store
      const courts = await fastify.prisma.court.findMany({
        where: { storeId: request.user.storeId },
        select: { id: true }
      });

      const courtIds = courts.map(c => c.id);

      // Contar reservas por estado
      const [total, pending, confirmed, cancelled, completed] = await Promise.all([
        fastify.prisma.reservation.count({ where: { courtId: { in: courtIds } } }),
        fastify.prisma.reservation.count({ where: { courtId: { in: courtIds }, status: 'pending' } }),
        fastify.prisma.reservation.count({ where: { courtId: { in: courtIds }, status: 'confirmed' } }),
        fastify.prisma.reservation.count({ where: { courtId: { in: courtIds }, status: 'cancelled' } }),
        fastify.prisma.reservation.count({ where: { courtId: { in: courtIds }, status: 'completed' } })
      ]);

      // Calcular ingresos totales (solo confirmadas y completadas)
      const reservationsWithIncome = await fastify.prisma.reservation.findMany({
        where: { 
          courtId: { in: courtIds },
          status: { in: ['confirmed', 'completed'] }
        },
        select: { totalPrice: true }
      });

      const totalIncome = reservationsWithIncome.reduce((sum, r) => sum + Number(r.totalPrice), 0);

      return {
        stats: {
          total,
          pending,
          confirmed,
          cancelled,
          completed,
          totalIncome
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Error al obtener estadísticas' });
    }
  });

  // Crear nueva reserva (usuario autenticado)
  fastify.post('/', { 
    onRequest: [fastify.authenticate] 
  }, async (request, reply) => {
    try {
      // Validar datos
      const validatedData = createReservationSchema.parse(request.body);

      // Verificar que la cancha existe y está activa
      const court = await fastify.prisma.court.findUnique({
        where: { id: validatedData.courtId }
      });

      if (!court) {
        return reply.code(404).send({ error: 'Cancha no encontrada' });
      }

      if (!court.active) {
        return reply.code(400).send({ error: 'Esta cancha no está disponible' });
      }

      // Validar que la hora de fin sea posterior a la hora de inicio
      const [startHour, startMin] = validatedData.startTime.split(':').map(Number);
      const [endHour, endMin] = validatedData.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        return reply.code(400).send({ error: 'La hora de fin debe ser posterior a la hora de inicio' });
      }

      // Calcular duración en horas
      const durationMinutes = endMinutes - startMinutes;
      const durationHours = durationMinutes / 60;

      // Calcular precio total
      const totalPrice = Number(court.pricePerHour) * durationHours;

      // Verificar disponibilidad (no debe haber otra reserva en el mismo horario)
      const reservationDate = new Date(validatedData.date);
      const startOfDay = new Date(reservationDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(reservationDate);
      endOfDay.setHours(23, 59, 59, 999);

      const conflictingReservations = await fastify.prisma.reservation.findMany({
        where: {
          courtId: validatedData.courtId,
          date: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: { in: ['pending', 'confirmed'] }
        }
      });

      // Verificar si hay conflicto de horarios
      for (const existing of conflictingReservations) {
        const [existingStartHour, existingStartMin] = existing.startTime.split(':').map(Number);
        const [existingEndHour, existingEndMin] = existing.endTime.split(':').map(Number);
        const existingStartMinutes = existingStartHour * 60 + existingStartMin;
        const existingEndMinutes = existingEndHour * 60 + existingEndMin;

        // Verificar si hay solapamiento
        if (
          (startMinutes >= existingStartMinutes && startMinutes < existingEndMinutes) ||
          (endMinutes > existingStartMinutes && endMinutes <= existingEndMinutes) ||
          (startMinutes <= existingStartMinutes && endMinutes >= existingEndMinutes)
        ) {
          return reply.code(400).send({ 
            error: 'Este horario ya está reservado',
            conflictingTime: `${existing.startTime} - ${existing.endTime}`
          });
        }
      }

      // Crear la reserva
      const reservation = await fastify.prisma.reservation.create({
        data: {
          courtId: validatedData.courtId,
          userId: request.user.id,
          date: new Date(validatedData.date),
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
          totalPrice: totalPrice,
          status: 'pending'
        },
        include: {
          court: {
            include: {
              store: {
                select: {
                  id: true,
                  name: true,
                  location: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      return { 
        reservation,
        message: 'Reserva creada exitosamente. Espera la confirmación del dueño del complejo.'
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Datos inválidos',
          details: error.errors 
        });
      }
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Error al crear la reserva',
        details: error.message 
      });
    }
  });

  // Actualizar estado de reserva (store_owner o usuario que creó la reserva)
  fastify.put('/:id/status', { 
    onRequest: [fastify.authenticate] 
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const validatedData = updateReservationStatusSchema.parse(request.body);

      // Obtener la reserva
      const reservation = await fastify.prisma.reservation.findUnique({
        where: { id },
        include: {
          court: {
            include: {
              store: true
            }
          }
        }
      });

      if (!reservation) {
        return reply.code(404).send({ error: 'Reserva no encontrada' });
      }

      // Verificar permisos
      const isOwner = request.user.role === 'store_owner' && 
                     request.user.storeId === reservation.court.storeId;
      const isReservationUser = reservation.userId === request.user.id;

      if (!isOwner && !isReservationUser) {
        return reply.code(403).send({ error: 'No tienes permiso para modificar esta reserva' });
      }

      // Solo el dueño puede confirmar, el usuario solo puede cancelar sus propias reservas
      if (validatedData.status === 'confirmed' && !isOwner) {
        return reply.code(403).send({ error: 'Solo el dueño del complejo puede confirmar reservas' });
      }

      if (validatedData.status === 'completed' && !isOwner) {
        return reply.code(403).send({ error: 'Solo el dueño del complejo puede marcar como completada' });
      }

      // Actualizar estado
      const updatedReservation = await fastify.prisma.reservation.update({
        where: { id },
        data: { status: validatedData.status },
        include: {
          court: {
            include: {
              store: {
                select: {
                  id: true,
                  name: true,
                  location: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              displayName: true
            }
          }
        }
      });

      return { 
        reservation: updatedReservation,
        message: `Reserva ${validatedData.status === 'confirmed' ? 'confirmada' : 
                            validatedData.status === 'cancelled' ? 'cancelada' : 
                            validatedData.status === 'completed' ? 'completada' : 'actualizada'} exitosamente`
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Datos inválidos',
          details: error.errors 
        });
      }
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Error al actualizar la reserva',
        details: error.message 
      });
    }
  });

  // Obtener detalle de una reserva
  fastify.get('/:id', { 
    onRequest: [fastify.authenticate] 
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      const reservation = await fastify.prisma.reservation.findUnique({
        where: { id },
        include: {
          court: {
            include: {
              store: {
                select: {
                  id: true,
                  name: true,
                  location: true,
                  city: true,
                  phone: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              displayName: true
            }
          }
        }
      });

      if (!reservation) {
        return reply.code(404).send({ error: 'Reserva no encontrada' });
      }

      // Verificar permisos
      const isOwner = request.user.role === 'store_owner' && 
                     request.user.storeId === reservation.court.storeId;
      const isReservationUser = reservation.userId === request.user.id;

      if (!isOwner && !isReservationUser) {
        return reply.code(403).send({ error: 'No tienes permiso para ver esta reserva' });
      }

      return { reservation };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Error al obtener la reserva' });
    }
  });

  // Verificar disponibilidad de una cancha en una fecha
  fastify.get('/availability/:courtId/:date', async (request, reply) => {
    try {
      const { courtId, date } = request.params;

      // Verificar que la cancha existe
      const court = await fastify.prisma.court.findUnique({
        where: { id: courtId }
      });

      if (!court) {
        return reply.code(404).send({ error: 'Cancha no encontrada' });
      }

      // Obtener reservas del día
      const reservationDate = new Date(date);
      const startOfDay = new Date(reservationDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(reservationDate);
      endOfDay.setHours(23, 59, 59, 999);

      const reservations = await fastify.prisma.reservation.findMany({
        where: {
          courtId,
          date: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: { in: ['pending', 'confirmed'] }
        },
        select: {
          startTime: true,
          endTime: true,
          status: true
        },
        orderBy: { startTime: 'asc' }
      });

      return { 
        courtId,
        date,
        reservations,
        available: reservations.length === 0
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Error al verificar disponibilidad' });
    }
  });
}
