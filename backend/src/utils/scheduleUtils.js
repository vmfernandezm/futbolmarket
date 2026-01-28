/**
 * Utilidades para manejo de horarios y slots de tiempo
 */

/**
 * Genera slots de tiempo entre dos horas
 * @param {string} startTime - Hora inicio (formato "HH:mm")
 * @param {string} endTime - Hora fin (formato "HH:mm")
 * @param {number} slotDuration - Duración del slot en minutos
 * @returns {Array} Array de objetos {startTime, endTime}
 */
export function generateTimeSlots(startTime, endTime, slotDuration) {
  const slots = [];
  
  // Convertir tiempos a minutos desde medianoche
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  let currentMinutes = startMinutes;
  
  while (currentMinutes + slotDuration <= endMinutes) {
    const slotStart = minutesToTime(currentMinutes);
    const slotEnd = minutesToTime(currentMinutes + slotDuration);
    
    slots.push({
      startTime: slotStart,
      endTime: slotEnd
    });
    
    currentMinutes += slotDuration;
  }
  
  return slots;
}

/**
 * Convierte tiempo "HH:mm" a minutos desde medianoche
 * @param {string} time - Tiempo en formato "HH:mm"
 * @returns {number} Minutos desde medianoche
 */
export function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convierte minutos desde medianoche a formato "HH:mm"
 * @param {number} minutes - Minutos desde medianoche
 * @returns {string} Tiempo en formato "HH:mm"
 */
export function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Verifica si dos slots de tiempo se solapan
 * @param {string} start1 - Inicio del primer slot
 * @param {string} end1 - Fin del primer slot
 * @param {string} start2 - Inicio del segundo slot
 * @param {string} end2 - Fin del segundo slot
 * @returns {boolean} true si se solapan
 */
export function slotsOverlap(start1, end1, start2, end2) {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);
  
  return start1Min < end2Min && end1Min > start2Min;
}

/**
 * Calcula la duración en minutos entre dos tiempos
 * @param {string} startTime - Hora inicio
 * @param {string} endTime - Hora fin
 * @returns {number} Duración en minutos
 */
export function calculateDuration(startTime, endTime) {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  return endMinutes - startMinutes;
}

/**
 * Obtiene el día de la semana de una fecha (0=Domingo, 6=Sábado)
 * @param {Date} date - Fecha
 * @returns {number} Día de la semana
 */
export function getDayOfWeek(date) {
  return date.getDay();
}

/**
 * Filtra slots disponibles eliminando los que están reservados
 * @param {Array} allSlots - Todos los slots posibles
 * @param {Array} reservations - Reservas existentes con startTime y endTime
 * @returns {Array} Slots disponibles
 */
export function filterAvailableSlots(allSlots, reservations) {
  return allSlots.filter(slot => {
    // Verificar si este slot se solapa con alguna reserva
    const isReserved = reservations.some(reservation => {
      return slotsOverlap(
        slot.startTime,
        slot.endTime,
        reservation.startTime,
        reservation.endTime
      );
    });
    
    return !isReserved;
  });
}

/**
 * Valida que un horario sea válido
 * @param {string} startTime - Hora inicio
 * @param {string} endTime - Hora fin
 * @returns {object} {valid: boolean, error: string}
 */
export function validateSchedule(startTime, endTime) {
  // Validar formato
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (!timeRegex.test(startTime)) {
    return { valid: false, error: 'Formato de hora inicio inválido (debe ser HH:mm)' };
  }
  
  if (!timeRegex.test(endTime)) {
    return { valid: false, error: 'Formato de hora fin inválido (debe ser HH:mm)' };
  }
  
  // Validar que endTime sea mayor que startTime
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  if (endMinutes <= startMinutes) {
    return { valid: false, error: 'La hora de fin debe ser posterior a la hora de inicio' };
  }
  
  return { valid: true };
}

/**
 * Agrupa horarios por jornadas (mañana, tarde, noche)
 * @param {Array} schedules - Array de horarios
 * @returns {object} Horarios agrupados por jornada
 */
export function groupSchedulesByShift(schedules) {
  const shifts = {
    morning: [],   // 00:00 - 11:59
    afternoon: [], // 12:00 - 17:59
    evening: []    // 18:00 - 23:59
  };
  
  schedules.forEach(schedule => {
    const startHour = parseInt(schedule.startTime.split(':')[0]);
    
    if (startHour < 12) {
      shifts.morning.push(schedule);
    } else if (startHour < 18) {
      shifts.afternoon.push(schedule);
    } else {
      shifts.evening.push(schedule);
    }
  });
  
  return shifts;
}

/**
 * Formatea un slot para mostrar al usuario
 * @param {object} slot - Slot con startTime y endTime
 * @returns {string} Slot formateado (ej: "08:00 - 09:00")
 */
export function formatSlot(slot) {
  return `${slot.startTime} - ${slot.endTime}`;
}

/**
 * Calcula el precio de una reserva basado en la duración
 * @param {string} startTime - Hora inicio
 * @param {string} endTime - Hora fin
 * @param {number} pricePerHour - Precio por hora
 * @returns {number} Precio total
 */
export function calculateReservationPrice(startTime, endTime, pricePerHour) {
  const durationMinutes = calculateDuration(startTime, endTime);
  const durationHours = durationMinutes / 60;
  return durationHours * pricePerHour;
}
