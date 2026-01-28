# 📅 API de Horarios - Documentación

Sistema completo de gestión de horarios para canchas deportivas con soporte para múltiples jornadas y slots de tiempo personalizables.

---

## 🎯 Características

- ✅ Configuración de horarios por día de la semana
- ✅ Soporte para múltiples jornadas (mañana, tarde, noche)
- ✅ Slots de tiempo personalizables (30 min, 1 hora, 90 min, etc.)
- ✅ Cálculo automático de disponibilidad
- ✅ Descuento automático de tiempo reservado
- ✅ Precios calculados por duración
- ✅ Vista de calendario con disponibilidad

---

## 📋 Endpoints

### 1. Configurar Horarios de una Cancha

**POST** `/api/courts/:courtId/schedules`

Crea o actualiza los horarios de una cancha. Reemplaza todos los horarios existentes.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Parámetros URL:**
- `courtId` (string): ID de la cancha

**Body:**
```json
{
  "schedules": [
    {
      "dayOfWeek": 1,
      "startTime": "08:00",
      "endTime": "12:00",
      "slotDuration": 60,
      "isActive": true
    },
    {
      "dayOfWeek": 1,
      "startTime": "14:00",
      "endTime": "22:00",
      "slotDuration": 60,
      "isActive": true
    }
  ]
}
```

**Campos:**
- `dayOfWeek` (number): Día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
- `startTime` (string): Hora de inicio (formato "HH:mm")
- `endTime` (string): Hora de fin (formato "HH:mm")
- `slotDuration` (number): Duración de cada slot en minutos (15-240)
- `isActive` (boolean): Si el horario está activo

**Ejemplo - Configurar Doble Jornada:**
```json
{
  "schedules": [
    {
      "dayOfWeek": 1,
      "startTime": "08:00",
      "endTime": "12:00",
      "slotDuration": 60,
      "isActive": true
    },
    {
      "dayOfWeek": 1,
      "startTime": "14:00",
      "endTime": "22:00",
      "slotDuration": 60,
      "isActive": true
    }
  ]
}
```

**Ejemplo - Configurar Triple Jornada:**
```json
{
  "schedules": [
    {
      "dayOfWeek": 2,
      "startTime": "06:00",
      "endTime": "10:00",
      "slotDuration": 60,
      "isActive": true
    },
    {
      "dayOfWeek": 2,
      "startTime": "12:00",
      "endTime": "16:00",
      "slotDuration": 60,
      "isActive": true
    },
    {
      "dayOfWeek": 2,
      "startTime": "18:00",
      "endTime": "23:00",
      "slotDuration": 60,
      "isActive": true
    }
  ]
}
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Horarios configurados exitosamente",
  "schedules": [
    {
      "id": "uuid",
      "courtId": "uuid",
      "dayOfWeek": 1,
      "startTime": "08:00",
      "endTime": "12:00",
      "slotDuration": 60,
      "isActive": true,
      "createdAt": "2026-01-28T...",
      "updatedAt": "2026-01-28T..."
    }
  ]
}
```

---

### 2. Obtener Horarios de una Cancha

**GET** `/api/courts/:courtId/schedules`

Obtiene todos los horarios configurados para una cancha.

**Parámetros URL:**
- `courtId` (string): ID de la cancha

**Respuesta Exitosa (200):**
```json
{
  "schedules": [
    {
      "id": "uuid",
      "courtId": "uuid",
      "dayOfWeek": 1,
      "startTime": "08:00",
      "endTime": "12:00",
      "slotDuration": 60,
      "isActive": true
    }
  ],
  "schedulesByDay": {
    "0": [],
    "1": [
      {
        "id": "uuid",
        "dayOfWeek": 1,
        "startTime": "08:00",
        "endTime": "12:00",
        "slotDuration": 60
      }
    ],
    "2": [],
    "3": [],
    "4": [],
    "5": [],
    "6": []
  }
}
```

---

### 3. Obtener Slots Disponibles para una Fecha

**GET** `/api/courts/:courtId/available-slots?date=YYYY-MM-DD`

Obtiene todos los slots de tiempo disponibles para una fecha específica.

**Parámetros URL:**
- `courtId` (string): ID de la cancha

**Query Parameters:**
- `date` (string): Fecha en formato "YYYY-MM-DD" (ej: "2026-01-28")

**Ejemplo:**
```
GET /api/courts/abc123/available-slots?date=2026-01-28
```

**Respuesta Exitosa (200):**
```json
{
  "date": "2026-01-28",
  "dayOfWeek": 2,
  "totalSlots": 8,
  "reservedSlots": 2,
  "availableSlots": [
    {
      "startTime": "08:00",
      "endTime": "09:00",
      "price": 50000
    },
    {
      "startTime": "09:00",
      "endTime": "10:00",
      "price": 50000
    },
    {
      "startTime": "10:00",
      "endTime": "11:00",
      "price": 50000
    }
  ],
  "schedules": [
    {
      "startTime": "08:00",
      "endTime": "12:00",
      "slotDuration": 60
    },
    {
      "startTime": "14:00",
      "endTime": "22:00",
      "slotDuration": 60
    }
  ]
}
```

---

### 4. Obtener Disponibilidad de Múltiples Días

**GET** `/api/courts/:courtId/availability?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

Obtiene un resumen de disponibilidad para un rango de fechas (útil para calendarios).

**Parámetros URL:**
- `courtId` (string): ID de la cancha

**Query Parameters:**
- `startDate` (string): Fecha inicio (formato "YYYY-MM-DD")
- `endDate` (string): Fecha fin (formato "YYYY-MM-DD")

**Ejemplo:**
```
GET /api/courts/abc123/availability?startDate=2026-01-28&endDate=2026-02-03
```

**Respuesta Exitosa (200):**
```json
{
  "availability": [
    {
      "date": "2026-01-28",
      "dayOfWeek": 2,
      "totalSlots": 8,
      "reservedSlots": 2,
      "availableSlots": 6,
      "hasSchedule": true
    },
    {
      "date": "2026-01-29",
      "dayOfWeek": 3,
      "totalSlots": 8,
      "reservedSlots": 0,
      "availableSlots": 8,
      "hasSchedule": true
    },
    {
      "date": "2026-01-30",
      "dayOfWeek": 4,
      "totalSlots": 0,
      "reservedSlots": 0,
      "availableSlots": 0,
      "hasSchedule": false
    }
  ]
}
```

---

### 5. Eliminar un Horario Específico

**DELETE** `/api/courts/schedules/:scheduleId`

Elimina un horario específico.

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros URL:**
- `scheduleId` (string): ID del horario

**Respuesta Exitosa (200):**
```json
{
  "message": "Horario eliminado exitosamente"
}
```

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Cancha con Horario Simple (Lunes a Viernes)

```javascript
// Configurar horario de 8:00 a 22:00, slots de 1 hora
const schedules = [];

for (let day = 1; day <= 5; day++) { // Lunes a Viernes
  schedules.push({
    dayOfWeek: day,
    startTime: "08:00",
    endTime: "22:00",
    slotDuration: 60,
    isActive: true
  });
}

await fetch(`/api/courts/${courtId}/schedules`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ schedules })
});
```

**Resultado:**
- Lunes a Viernes: 8:00 - 22:00 (14 slots de 1 hora cada día)
- Sábado y Domingo: Sin horario

---

### Ejemplo 2: Cancha con Doble Jornada

```javascript
// Jornada mañana: 6:00 - 12:00
// Jornada tarde/noche: 14:00 - 23:00
const schedules = [];

for (let day = 0; day <= 6; day++) { // Todos los días
  // Jornada mañana
  schedules.push({
    dayOfWeek: day,
    startTime: "06:00",
    endTime: "12:00",
    slotDuration: 60,
    isActive: true
  });
  
  // Jornada tarde/noche
  schedules.push({
    dayOfWeek: day,
    startTime: "14:00",
    endTime: "23:00",
    slotDuration: 60,
    isActive: true
  });
}
```

**Resultado:**
- Todos los días:
  - Mañana: 6:00 - 12:00 (6 slots)
  - Tarde/Noche: 14:00 - 23:00 (9 slots)
  - Total: 15 slots por día

---

### Ejemplo 3: Slots de 30 Minutos

```javascript
const schedules = [{
  dayOfWeek: 1, // Lunes
  startTime: "08:00",
  endTime: "12:00",
  slotDuration: 30, // 30 minutos
  isActive: true
}];
```

**Resultado:**
- Slots generados:
  - 08:00 - 08:30
  - 08:30 - 09:00
  - 09:00 - 09:30
  - 09:30 - 10:00
  - 10:00 - 10:30
  - 10:30 - 11:00
  - 11:00 - 11:30
  - 11:30 - 12:00
  - **Total: 8 slots**

---

### Ejemplo 4: Obtener Slots Disponibles y Hacer Reserva

```javascript
// 1. Obtener slots disponibles
const response = await fetch(
  `/api/courts/${courtId}/available-slots?date=2026-01-28`
);
const { availableSlots } = await response.json();

// 2. Mostrar al usuario
console.log('Slots disponibles:', availableSlots);
// [
//   { startTime: "08:00", endTime: "09:00", price: 50000 },
//   { startTime: "09:00", endTime: "10:00", price: 50000 },
//   ...
// ]

// 3. Usuario selecciona un slot
const selectedSlot = availableSlots[0];

// 4. Crear reserva
await fetch('/api/reservations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    courtId,
    date: "2026-01-28",
    startTime: selectedSlot.startTime,
    endTime: selectedSlot.endTime,
    totalPrice: selectedSlot.price
  })
});

// 5. El slot 08:00-09:00 ya no estará disponible
```

---

## 🔄 Flujo de Trabajo Completo

### Para el Dueño de la Cancha:

```
1. Crear cancha
   ↓
2. Configurar horarios (POST /courts/:id/schedules)
   - Definir días de la semana
   - Definir jornadas (mañana, tarde, noche)
   - Definir duración de slots
   ↓
3. Activar/desactivar horarios según necesidad
   ↓
4. Ver reservas y disponibilidad
```

### Para el Usuario:

```
1. Buscar canchas disponibles
   ↓
2. Seleccionar una cancha
   ↓
3. Ver calendario de disponibilidad (GET /courts/:id/availability)
   ↓
4. Seleccionar fecha
   ↓
5. Ver slots disponibles (GET /courts/:id/available-slots?date=...)
   ↓
6. Seleccionar slot
   ↓
7. Crear reserva (POST /reservations)
   ↓
8. Slot automáticamente descontado de disponibilidad
```

---

## 💡 Casos de Uso

### Caso 1: Cancha 24 Horas

```json
{
  "schedules": [
    {
      "dayOfWeek": 0,
      "startTime": "00:00",
      "endTime": "23:59",
      "slotDuration": 60,
      "isActive": true
    }
  ]
}
```

### Caso 2: Cancha Solo Fines de Semana

```json
{
  "schedules": [
    {
      "dayOfWeek": 0,
      "startTime": "08:00",
      "endTime": "20:00",
      "slotDuration": 60,
      "isActive": true
    },
    {
      "dayOfWeek": 6,
      "startTime": "08:00",
      "endTime": "20:00",
      "slotDuration": 60,
      "isActive": true
    }
  ]
}
```

### Caso 3: Horario Diferente por Día

```json
{
  "schedules": [
    {
      "dayOfWeek": 1,
      "startTime": "06:00",
      "endTime": "22:00",
      "slotDuration": 60,
      "isActive": true
    },
    {
      "dayOfWeek": 2,
      "startTime": "08:00",
      "endTime": "20:00",
      "slotDuration": 60,
      "isActive": true
    },
    {
      "dayOfWeek": 6,
      "startTime": "10:00",
      "endTime": "18:00",
      "slotDuration": 90,
      "isActive": true
    }
  ]
}
```

---

## 🎨 Integración con Frontend

### Componente de Calendario

```svelte
<script>
  let availability = [];
  
  async function loadAvailability(courtId, startDate, endDate) {
    const response = await fetch(
      `/api/courts/${courtId}/availability?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();
    availability = data.availability;
  }
</script>

<div class="calendar">
  {#each availability as day}
    <div class="day" class:available={day.availableSlots > 0}>
      <div class="date">{day.date}</div>
      <div class="slots">
        {day.availableSlots} / {day.totalSlots} disponibles
      </div>
    </div>
  {/each}
</div>
```

---

## ✅ Validaciones

- ✅ Formato de hora válido (HH:mm)
- ✅ Hora fin > Hora inicio
- ✅ Día de la semana válido (0-6)
- ✅ Duración de slot válida (15-240 minutos)
- ✅ Solo el dueño puede modificar horarios
- ✅ No se pueden crear slots que se solapen con reservas existentes

---

## 🔐 Permisos

- **Configurar horarios:** Solo dueño de la cancha o super_admin
- **Ver horarios:** Público
- **Ver slots disponibles:** Público
- **Eliminar horarios:** Solo dueño de la cancha o super_admin

---

**¡Sistema de horarios completo y listo para usar!** 📅✅
