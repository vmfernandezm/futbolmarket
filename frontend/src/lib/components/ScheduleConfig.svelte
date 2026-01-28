<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// Props
	export let schedules = [];

	// Días de la semana
	const daysOfWeek = [
		{ value: 0, label: 'Domingo' },
		{ value: 1, label: 'Lunes' },
		{ value: 2, label: 'Martes' },
		{ value: 3, label: 'Miércoles' },
		{ value: 4, label: 'Jueves' },
		{ value: 5, label: 'Viernes' },
		{ value: 6, label: 'Sábado' }
	];

	// Duraciones de slot comunes
	const slotDurations = [
		{ value: 30, label: '30 minutos' },
		{ value: 60, label: '1 hora' },
		{ value: 90, label: '1 hora 30 min' },
		{ value: 120, label: '2 horas' }
	];

	// Inicializar con horarios por defecto si está vacío
	if (schedules.length === 0) {
		schedules = [
			{
				dayOfWeek: 1,
				startTime: '06:00',
				endTime: '12:00',
				slotDuration: 60,
				isActive: true
			}
		];
	}

	function addSchedule() {
		schedules = [
			...schedules,
			{
				dayOfWeek: 1,
				startTime: '14:00',
				endTime: '20:00',
				slotDuration: 60,
				isActive: true
			}
		];
		dispatch('change', schedules);
	}

	function removeSchedule(index) {
		schedules = schedules.filter((_, i) => i !== index);
		dispatch('change', schedules);
	}

	function updateSchedule(index, field, value) {
		schedules[index][field] = field === 'dayOfWeek' || field === 'slotDuration' 
			? parseInt(value) 
			: field === 'isActive' 
			? value 
			: value;
		dispatch('change', schedules);
	}

	// Función para aplicar horario a todos los días
	function applyToAllDays(index) {
		const template = schedules[index];
		const newSchedules = [];
		
		for (let day = 0; day <= 6; day++) {
			newSchedules.push({
				dayOfWeek: day,
				startTime: template.startTime,
				endTime: template.endTime,
				slotDuration: template.slotDuration,
				isActive: template.isActive
			});
		}
		
		schedules = newSchedules;
		dispatch('change', schedules);
	}

	// Función para aplicar a días de semana (Lunes-Viernes)
	function applyToWeekdays(index) {
		const template = schedules[index];
		const newSchedules = [];
		
		for (let day = 1; day <= 5; day++) {
			newSchedules.push({
				dayOfWeek: day,
				startTime: template.startTime,
				endTime: template.endTime,
				slotDuration: template.slotDuration,
				isActive: template.isActive
			});
		}
		
		schedules = newSchedules;
		dispatch('change', schedules);
	}

	// Plantillas predefinidas
	function applyTemplate(templateName) {
		if (templateName === 'double-shift') {
			// Doble jornada: Lunes a Viernes
			schedules = [];
			for (let day = 1; day <= 5; day++) {
				schedules.push({
					dayOfWeek: day,
					startTime: '06:00',
					endTime: '12:00',
					slotDuration: 60,
					isActive: true
				});
				schedules.push({
					dayOfWeek: day,
					startTime: '14:00',
					endTime: '20:00',
					slotDuration: 60,
					isActive: true
				});
			}
		} else if (templateName === 'full-day') {
			// Jornada completa: Lunes a Domingo
			schedules = [];
			for (let day = 0; day <= 6; day++) {
				schedules.push({
					dayOfWeek: day,
					startTime: '08:00',
					endTime: '22:00',
					slotDuration: 60,
					isActive: true
				});
			}
		} else if (templateName === 'weekends') {
			// Solo fines de semana
			schedules = [
				{
					dayOfWeek: 0,
					startTime: '08:00',
					endTime: '20:00',
					slotDuration: 60,
					isActive: true
				},
				{
					dayOfWeek: 6,
					startTime: '08:00',
					endTime: '20:00',
					slotDuration: 60,
					isActive: true
				}
			];
		}
		dispatch('change', schedules);
	}
</script>

<div class="schedule-config">
	<div class="d-flex justify-content-between align-items-center mb-3">
		<h5 class="mb-0">
			<i class="bi bi-clock-history text-success"></i>
			Configuración de Horarios
		</h5>
		<button type="button" class="btn btn-sm btn-success" on:click={addSchedule}>
			<i class="bi bi-plus-circle"></i>
			Agregar Jornada
		</button>
	</div>

	<!-- Plantillas rápidas -->
	<div class="alert alert-info mb-3">
		<small>
			<strong>Plantillas rápidas:</strong>
		</small>
		<div class="btn-group btn-group-sm mt-2" role="group">
			<button type="button" class="btn btn-outline-primary" on:click={() => applyTemplate('double-shift')}>
				Doble Jornada (L-V)
			</button>
			<button type="button" class="btn btn-outline-primary" on:click={() => applyTemplate('full-day')}>
				Jornada Completa
			</button>
			<button type="button" class="btn btn-outline-primary" on:click={() => applyTemplate('weekends')}>
				Solo Fines de Semana
			</button>
		</div>
	</div>

	<!-- Lista de horarios -->
	<div class="schedules-list">
		{#each schedules as schedule, index}
			<div class="card mb-3 shadow-sm">
				<div class="card-body">
					<div class="d-flex justify-content-between align-items-center mb-3">
						<h6 class="mb-0">
							<i class="bi bi-calendar-week text-success"></i>
							Jornada {index + 1}
						</h6>
						<div class="btn-group btn-group-sm">
							<button 
								type="button" 
								class="btn btn-outline-secondary" 
								on:click={() => applyToWeekdays(index)}
								title="Aplicar a Lunes-Viernes"
							>
								<i class="bi bi-calendar-range"></i>
								L-V
							</button>
							<button 
								type="button" 
								class="btn btn-outline-secondary" 
								on:click={() => applyToAllDays(index)}
								title="Aplicar a todos los días"
							>
								<i class="bi bi-calendar-week"></i>
								Todos
							</button>
							{#if schedules.length > 1}
								<button 
									type="button" 
									class="btn btn-outline-danger" 
									on:click={() => removeSchedule(index)}
								>
									<i class="bi bi-trash"></i>
								</button>
							{/if}
						</div>
					</div>

					<div class="row g-3">
						<!-- Día de la semana -->
						<div class="col-md-6">
							<label class="form-label">
								<i class="bi bi-calendar3"></i>
								Día de la Semana
							</label>
							<select 
								class="form-select"
								value={schedule.dayOfWeek}
								on:change={(e) => updateSchedule(index, 'dayOfWeek', e.target.value)}
							>
								{#each daysOfWeek as day}
									<option value={day.value}>{day.label}</option>
								{/each}
							</select>
						</div>

						<!-- Duración de slot -->
						<div class="col-md-6">
							<label class="form-label">
								<i class="bi bi-hourglass-split"></i>
								Duración de Reserva
							</label>
							<select 
								class="form-select"
								value={schedule.slotDuration}
								on:change={(e) => updateSchedule(index, 'slotDuration', e.target.value)}
							>
								{#each slotDurations as duration}
									<option value={duration.value}>{duration.label}</option>
								{/each}
							</select>
						</div>

						<!-- Hora inicio -->
						<div class="col-md-6">
							<label class="form-label">
								<i class="bi bi-clock"></i>
								Hora de Inicio
							</label>
							<input 
								type="time" 
								class="form-control"
								value={schedule.startTime}
								on:input={(e) => updateSchedule(index, 'startTime', e.target.value)}
							/>
						</div>

						<!-- Hora fin -->
						<div class="col-md-6">
							<label class="form-label">
								<i class="bi bi-clock-fill"></i>
								Hora de Fin
							</label>
							<input 
								type="time" 
								class="form-control"
								value={schedule.endTime}
								on:input={(e) => updateSchedule(index, 'endTime', e.target.value)}
							/>
						</div>

						<!-- Estado activo -->
						<div class="col-12">
							<div class="form-check form-switch">
								<input 
									class="form-check-input" 
									type="checkbox" 
									id="active-{index}"
									checked={schedule.isActive}
									on:change={(e) => updateSchedule(index, 'isActive', e.target.checked)}
								/>
								<label class="form-check-label" for="active-{index}">
									<i class="bi bi-toggle-on text-success"></i>
									Horario Activo
								</label>
							</div>
						</div>
					</div>

					<!-- Vista previa de slots -->
					<div class="mt-3 p-2 bg-light rounded">
						<small class="text-muted">
							<i class="bi bi-info-circle"></i>
							<strong>Vista previa:</strong> 
							{daysOfWeek.find(d => d.value === schedule.dayOfWeek)?.label} 
							de {schedule.startTime} a {schedule.endTime}
							({Math.floor((
								(parseInt(schedule.endTime.split(':')[0]) * 60 + parseInt(schedule.endTime.split(':')[1])) -
								(parseInt(schedule.startTime.split(':')[0]) * 60 + parseInt(schedule.startTime.split(':')[1]))
							) / schedule.slotDuration)} slots de {schedule.slotDuration} min)
						</small>
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if schedules.length === 0}
		<div class="alert alert-warning">
			<i class="bi bi-exclamation-triangle"></i>
			No hay horarios configurados. Agrega al menos una jornada.
		</div>
	{/if}
</div>

<style>
	.schedule-config {
		margin: 20px 0;
	}

	.schedules-list {
		max-height: 600px;
		overflow-y: auto;
	}

	.card {
		border-left: 4px solid #28a745;
	}

	.form-label {
		font-weight: 600;
		font-size: 0.9rem;
	}

	.btn-group-sm .btn {
		font-size: 0.8rem;
	}
</style>
