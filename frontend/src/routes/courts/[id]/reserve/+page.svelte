<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let court = null;
	let loading = true;
	let error = '';
	let success = '';
	let submitting = false;

	// Form fields
	let date = '';
	let startTime = '';
	let endTime = '';

	// Availability
	let checkingAvailability = false;
	let availability = null;

	onMount(async () => {
		const token = localStorage.getItem('token');
		const userData = localStorage.getItem('user');

		if (!token || !userData) {
			goto('/login');
			return;
		}

		const user = JSON.parse(userData);
		if (user.role !== 'usuario') {
			goto('/dashboard');
			return;
		}

		// Obtener ID de la cancha desde la URL
		const pathParts = window.location.pathname.split('/');
		const courtId = pathParts[2];

		await loadCourt(courtId);
	});

	async function loadCourt(courtId) {
		try {
			const response = await fetch(`http://localhost:3001/api/courts/${courtId}`);
			const data = await response.json();

			if (response.ok) {
				court = data.court;
				// Establecer fecha mínima como hoy
				const today = new Date().toISOString().split('T')[0];
				date = today;
			} else {
				error = data.error || 'Error al cargar la cancha';
			}
		} catch (err) {
			console.error('Error:', err);
			error = 'Error de conexión con el servidor';
		} finally {
			loading = false;
		}
	}

	async function checkAvailability() {
		if (!date || !court) return;

		checkingAvailability = true;
		try {
			const response = await fetch(
				`http://localhost:3001/api/reservations/availability/${court.id}/${date}`
			);
			const data = await response.json();

			if (response.ok) {
				availability = data;
			}
		} catch (err) {
			console.error('Error:', err);
		} finally {
			checkingAvailability = false;
		}
	}

	async function handleSubmit() {
		error = '';
		success = '';
		submitting = true;

		try {
			const token = localStorage.getItem('token');

			const response = await fetch('http://localhost:3001/api/reservations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					courtId: court.id,
					date,
					startTime,
					endTime
				})
			});

			const data = await response.json();

			if (response.ok) {
				success = data.message || 'Reserva creada exitosamente';
				console.log('✅ Reserva creada:', data.reservation);

				// Redirigir después de 2 segundos
				setTimeout(() => {
					goto('/reservations/my-reservations');
				}, 2000);
			} else {
				error = data.error || 'Error al crear la reserva';
				if (data.conflictingTime) {
					error += ` El horario ${data.conflictingTime} ya está reservado.`;
				}
			}
		} catch (err) {
			console.error('Error:', err);
			error = 'Error de conexión con el servidor';
		} finally {
			submitting = false;
		}
	}

	// Calcular precio estimado
	$: estimatedPrice = court && startTime && endTime ? calculatePrice() : 0;

	function calculatePrice() {
		if (!startTime || !endTime || !court) return 0;

		const [startHour, startMin] = startTime.split(':').map(Number);
		const [endHour, endMin] = endTime.split(':').map(Number);
		const startMinutes = startHour * 60 + startMin;
		const endMinutes = endHour * 60 + endMin;

		if (endMinutes <= startMinutes) return 0;

		const durationMinutes = endMinutes - startMinutes;
		const durationHours = durationMinutes / 60;

		return Number(court.pricePerHour) * durationHours;
	}

	// Cuando cambia la fecha, verificar disponibilidad
	$: if (date) {
		checkAvailability();
	}
</script>

<div class="container py-5">
	{#if loading}
		<div class="text-center py-5">
			<div class="spinner-border text-white" role="status">
				<span class="visually-hidden">Cargando...</span>
			</div>
		</div>
	{:else if court}
		<!-- Header -->
		<div class="row mb-4">
			<div class="col-12">
				<button class="btn btn-outline-light mb-3" on:click={() => goto('/dashboard')}>
					<i class="bi bi-arrow-left"></i>
					Volver al Dashboard
				</button>

				<div class="card shadow-lg border-0">
					<div class="card-body p-4">
						<h2 class="mb-1">
							<i class="bi bi-calendar-check text-success"></i>
							Reservar Cancha
						</h2>
						<p class="text-muted mb-0">Completa el formulario para reservar</p>
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<!-- Información de la Cancha -->
			<div class="col-lg-5 mb-4">
				<div class="card shadow-lg border-0 h-100">
					{#if court.imageUrl}
						<img 
							src={`http://localhost:3001${court.imageUrl}`} 
							alt={court.name}
							class="card-img-top"
							style="height: 250px; object-fit: cover;"
						/>
					{:else}
						<div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 250px;">
							<i class="bi bi-image text-muted" style="font-size: 4rem;"></i>
						</div>
					{/if}

					<div class="card-body">
						<h4 class="card-title mb-3">
							<i class="bi bi-grid-3x3-gap text-success"></i>
							{court.name}
						</h4>

						<div class="mb-3">
							<span class="badge bg-primary me-1">
								<i class="bi bi-trophy"></i>
								{court.type}
							</span>
							{#if court.surface}
								<span class="badge bg-info">
									<i class="bi bi-layers"></i>
									{court.surface}
								</span>
							{/if}
						</div>

						<div class="mb-2">
							<i class="bi bi-people text-success"></i>
							<strong>Capacidad:</strong> {court.capacity} jugadores
						</div>

						<div class="mb-3">
							<i class="bi bi-currency-dollar text-success"></i>
							<strong>Precio:</strong> ${court.pricePerHour.toLocaleString('es-CO')} COP/hora
						</div>

						{#if court.description}
							<hr />
							<p class="text-muted small mb-0">{court.description}</p>
						{/if}

						{#if court.store}
							<hr />
							<div class="alert alert-light mb-0">
								<small>
									<i class="bi bi-building"></i>
									<strong>{court.store.name}</strong><br />
									<i class="bi bi-geo-alt"></i>
									{court.store.location}, {court.store.city}<br />
									{#if court.store.phone}
										<i class="bi bi-telephone"></i>
										{court.store.phone}
									{/if}
								</small>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Formulario de Reserva -->
			<div class="col-lg-7">
				<div class="card shadow-lg border-0">
					<div class="card-body p-4">
						<h5 class="card-title mb-4">
							<i class="bi bi-calendar3"></i>
							Datos de la Reserva
						</h5>

						{#if error}
							<div class="alert alert-danger" role="alert">
								<i class="bi bi-exclamation-triangle-fill"></i>
								{error}
							</div>
						{/if}

						{#if success}
							<div class="alert alert-success" role="alert">
								<i class="bi bi-check-circle-fill"></i>
								{success}
							</div>
						{/if}

						<form on:submit|preventDefault={handleSubmit}>
							<!-- Fecha -->
							<div class="mb-4">
								<label for="date" class="form-label fw-bold">
									<i class="bi bi-calendar text-success"></i>
									Fecha *
								</label>
								<input
									type="date"
									class="form-control form-control-lg"
									id="date"
									bind:value={date}
									required
									min={new Date().toISOString().split('T')[0]}
								/>
							</div>

							<!-- Horarios -->
							<div class="row mb-4">
								<div class="col-md-6">
									<label for="startTime" class="form-label fw-bold">
										<i class="bi bi-clock text-success"></i>
										Hora de Inicio *
									</label>
									<input
										type="time"
										class="form-control form-control-lg"
										id="startTime"
										bind:value={startTime}
										required
									/>
								</div>
								<div class="col-md-6">
									<label for="endTime" class="form-label fw-bold">
										<i class="bi bi-clock-fill text-success"></i>
										Hora de Fin *
									</label>
									<input
										type="time"
										class="form-control form-control-lg"
										id="endTime"
										bind:value={endTime}
										required
									/>
								</div>
							</div>

							<!-- Precio Estimado -->
							{#if estimatedPrice > 0}
								<div class="alert alert-success mb-4">
									<div class="d-flex justify-content-between align-items-center">
										<div>
											<i class="bi bi-currency-dollar"></i>
											<strong>Precio Total Estimado:</strong>
										</div>
										<h4 class="mb-0">
											${estimatedPrice.toLocaleString('es-CO')} COP
										</h4>
									</div>
									<small class="text-muted">
										Duración: {((estimatedPrice / Number(court.pricePerHour)) * 60).toFixed(0)} minutos
									</small>
								</div>
							{/if}

							<!-- Disponibilidad -->
							{#if availability && availability.reservations.length > 0}
								<div class="alert alert-warning mb-4">
									<h6 class="alert-heading">
										<i class="bi bi-exclamation-triangle"></i>
										Horarios ya reservados en esta fecha:
									</h6>
									<ul class="mb-0">
										{#each availability.reservations as reservation}
											<li>{reservation.startTime} - {reservation.endTime}</li>
										{/each}
									</ul>
								</div>
							{/if}

							<!-- Botones -->
							<div class="d-grid gap-2">
								<button
									type="submit"
									class="btn btn-success btn-lg"
									disabled={submitting || !date || !startTime || !endTime}
								>
									{#if submitting}
										<span class="spinner-border spinner-border-sm me-2"></span>
										Procesando...
									{:else}
										<i class="bi bi-check-circle"></i>
										Confirmar Reserva
									{/if}
								</button>
								<button
									type="button"
									class="btn btn-outline-secondary"
									on:click={() => goto('/dashboard')}
									disabled={submitting}
								>
									<i class="bi bi-x-circle"></i>
									Cancelar
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	{:else if error}
		<div class="alert alert-danger" role="alert">
			<i class="bi bi-exclamation-triangle-fill"></i>
			{error}
		</div>
	{/if}
</div>

<style>
	.hover-card {
		transition: transform 0.2s;
	}
	.hover-card:hover {
		transform: translateY(-5px);
	}
</style>
