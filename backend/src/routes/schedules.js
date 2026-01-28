import {
  generateTimeSlots,
  filterAvailableSlots,
  validateSchedule,
  getDayOfWeek,
  calculateReservationPrice
} from '../utils/scheduleUtils.js';

export default async function scheduleRoutes(fastify, options) {
  
  // Crear/Actualizar horarios de una cancha
  fastify.post('/:courtId/schedules', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { courtId } = request.params;
      const { schedules } = request.body; // Array de horarios

      // Verificar que la cancha existe y el usuario es el dueño
      const court = await fastify.prisma.court.findUnique({
        where: { id: courtId },
        include: { store: true }
      });

      if (!court) {
        return reply.code(404).send({ error: 'Cancha no encontrada' });
      }

      // Verificar permisos
      if (request.user.role !== 'super_admin' && request.user.storeId !== court.storeId) {
        return reply.code(403).send({ error: 'No tienes permiso para modificar esta cancha' });
      }

      // Validar todos los horarios
      for (const schedule of schedules) {
        const validation = validateSchedule(schedule.startTime, schedule.endTime);
        if (!validation.valid) {
          return reply.code(400).send({ error: validation.error });
        }

        // Validar dayOfWeek
        if (schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
          return reply.code(400).send({ error: 'Día de la semana inválido (0-6)' });
        }

        // Validar slotDuration
        if (schedule.slotDuration && (schedule.slotDuration < 15 || schedule.slotDuration > 240)) {
          return reply.code(400).send({ error: 'Duración de slot inválida (15-240 minutos)' });
        }
      }

      // Eliminar horarios existentes para esta cancha
      await fastify.prisma.courtSchedule.deleteMany({
        where: { courtId }
      });

      // Crear nuevos horarios
      const createdSchedules = await Promise.all(
        schedules.map(schedule =>
          fastify.prisma.courtSchedule.create({
            data: {
              courtId,
              dayOfWeek: schedule.dayOfWeek,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              slotDuration: schedule.slotDuration || 60,
              isActive: schedule.isActive !== undefined ? schedule.isActive : true
            }
          })
        )
      );

      return {
        message: 'Horarios configurados exitosamente',
        schedules: createdSchedules
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Error al configurar horarios',
        details: error.message
      });
    }
  });

  // Obtener horarios de una cancha
  fastify.get('/:courtId/schedules', async (request, reply) => {
    try {
      const { courtId } = request.params;

      const schedules = await fastify.prisma.courtSchedule.findMany({
        where: { courtId },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      });

      // Agrupar por día de la semana
      const schedulesByDay = {
        0: [], // Domingo
        1: [], // Lunes
        2: [], // Martes
        3: [], // Miércoles
        4: [], // Jueves
        5: [], // Viernes
        6: []  // Sábado
      };

      schedules.forEach(schedule => {
        schedulesByDay[schedule.dayOfWeek].push(schedule);
      });

      return {
        schedules,
        schedulesByDay
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Error al obtener horarios',
        details: error.message
      });
    }
  });

  // Obtener slots disponibles para una fecha específica
  fastify.get('/:courtId/available-slots', async (request, reply) => {
    try {
      const { courtId } = request.params;
      const { date } = request.query; // Formato: "YYYY-MM-DD"

      if (!date) {
        return reply.code(400).send({ error: 'Fecha requerida (formato: YYYY-MM-DD)' });
      }

      // Convertir fecha a objeto Date
      const targetDate = new Date(date + 'T00:00:00');
      const dayOfWeek = getDayOfWeek(targetDate);

      // Obtener horarios para ese día de la semana
      const schedules = await fastify.prisma.courtSchedule.findMany({
        where: {
          courtId,
          dayOfWeek,
          isActive: true
        }
      });

      if (schedules.length === 0) {
        return {
          date,
          dayOfWeek,
          availableSlots: [],
          message: 'No hay horarios configurados para este día'
        };
      }

      // Generar todos los slots posibles para ese día
      let allSlots = [];
      schedules.forEach(schedule => {
        const slots = generateTimeSlots(
          schedule.startTime,
          schedule.endTime,
          schedule.slotDuration
        );
        allSlots = allSlots.concat(slots);
      });

      // Obtener reservas existentes para esa fecha
      const reservations = await fastify.prisma.reservation.findMany({
        where: {
          courtId,
          date: {
            gte: new Date(date + 'T00:00:00'),
            lt: new Date(date + 'T23:59:59')
          },
          status: {
            in: ['pending', 'confirmed']
          }
        },
        select: {
          startTime: true,
          endTime: true
        }
      });

      // Filtrar slots disponibles
      const availableSlots = filterAvailableSlots(allSlots, reservations);

      // Obtener información de la cancha para calcular precios
      const court = await fastify.prisma.court.findUnique({
        where: { id: courtId },
        select: { pricePerHour: true }
      });

      // Agregar precio a cada slot
      const slotsWithPrice = availableSlots.map(slot => ({
        ...slot,
        price: calculateReservationPrice(
          slot.startTime,
          slot.endTime,
          parseFloat(court.pricePerHour)
        )
      }));

      return {
        date,
        dayOfWeek,
        totalSlots: allSlots.length,
        reservedSlots: reservations.length,
        availableSlots: slotsWithPrice,
        schedules: schedules.map(s => ({
          startTime: s.startTime,
          endTime: s.endTime,
          slotDuration: s.slotDuration
        }))
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Error al obtener slots disponibles',
        details: error.message
      });
    }
  });

  // Obtener disponibilidad de múltiples días (para calendario)
  fastify.get('/:courtId/availability', async (request, reply) => {
    try {
      const { courtId } = request.params;
      const { startDate, endDate } = request.query;

      if (!startDate || !endDate) {
        return reply.code(400).send({
          error: 'Se requieren startDate y endDate (formato: YYYY-MM-DD)'
        });
      }

      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T23:59:59');

      // Obtener todos los horarios de la cancha
      const schedules = await fastify.prisma.courtSchedule.findMany({
        where: { courtId, isActive: true }
      });

      // Obtener todas las reservas en el rango de fechas
      const reservations = await fastify.prisma.reservation.findMany({
        where: {
          courtId,
          date: { gte: start, lte: end },
          status: { in: ['pending', 'confirmed'] }
        }
      });

      // Calcular disponibilidad por día
      const availability = [];
      let currentDate = new Date(start);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = getDayOfWeek(currentDate);

        // Horarios para este día
        const daySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek);

        // Generar slots totales
        let totalSlots = 0;
        daySchedules.forEach(schedule => {
          const slots = generateTimeSlots(
            schedule.startTime,
            schedule.endTime,
            schedule.slotDuration
          );
          totalSlots += slots.length;
        });

        // Contar reservas para este día
        const dayReservations = reservations.filter(r => {
          const resDate = new Date(r.date).toISOString().split('T')[0];
          return resDate === dateStr;
        });

        availability.push({
          date: dateStr,
          dayOfWeek,
          totalSlots,
          reservedSlots: dayReservations.length,
          availableSlots: totalSlots - dayReservations.length,
          hasSchedule: daySchedules.length > 0
        });

        // Siguiente día
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return { availability };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Error al obtener disponibilidad',
        details: error.message
      });
    }
  });

  // Eliminar horario específico
  fastify.delete('/schedules/:scheduleId', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { scheduleId } = request.params;

      const schedule = await fastify.prisma.courtSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          court: {
            include: { store: true }
          }
        }
      });

      if (!schedule) {
        return reply.code(404).send({ error: 'Horario no encontrado' });
      }

      // Verificar permisos
      if (request.user.role !== 'super_admin' && request.user.storeId !== schedule.court.storeId) {
        return reply.code(403).send({ error: 'No tienes permiso para eliminar este horario' });
      }

      await fastify.prisma.courtSchedule.delete({
        where: { id: scheduleId }
      });

      return { message: 'Horario eliminado exitosamente' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Error al eliminar horario',
        details: error.message
      });
    }
  });
}
