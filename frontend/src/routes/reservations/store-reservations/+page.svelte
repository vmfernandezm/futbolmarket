<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { API_URL } from '$lib/config';

	let user = null;
	let reservations = [];
	let stats = null;
	let loading = true;
	let loadingStats = true;
	let error = '';
	let updatingId = null;

	onMount(async () => {
		const token = localStorage.getItem('token');
		const userData = localStorage.getItem('user');

		if (!token || !userData) {
			goto('/login');
			return;
		}

		user = JSON.parse(userData);

		if (user.role !== 'store_owner') {
			goto('/dashboard');
			return;
		}

		await Promise.all([loadReservations(), loadStats()]);
	});

	async function loadReservations() {
		try {
			loading = true;
			const token = localStorage.getItem('token');

			const response = await fetch('${API_URL}/api/reservations/store-reservations', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			const data = await response.json();

			if (response.ok) {
				reservations = data.reservations || [];
			} else {
				error = data.error || 'Error al cargar las reservas';
			}
		} catch (err) {
			console.error('Error:', err);
			error = 'Error de conexión con el servidor';
		} finally {
			loading = false;
		}
	}

	async function loadStats() {
		try {
			loadingStats = true;
			const token = localStorage.getItem('token');

			const response = await fetch('${API_URL}/api/reservations/store-stats', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			const data = await response.json();

			if (response.ok) {
				stats = data.stats;
			}
		} catch (err) {
			console.error('Error:', err);
		} finally {
			loadingStats = false;
		}
	}

	async function updateReservationStatus(reservationId, newStatus) {
		const statusMessages = {
			confirmed: '¿Confirmar esta reserva?',
			cancelled: '¿Cancelar esta reserva?',
			completed: '¿Marcar como completada?'
		};

		if (!confirm(statusMessages[newStatus])) {
			return;
		}

		try {
			updatingId = reservationId;
			const token = localStorage.getItem('token');

			const response = await fetch(`${API_URL}/api/reservations/${reservationId}/status`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ status: newStatus })
			});

			const data = await response.json();

			if (response.ok) {
				alert(data.message || 'Estado actualizado exitosamente');
				await Promise.all([loadReservations(), loadStats()]);
			} else {
				alert(data.error || 'Error al actualizar el estado');
			}
		} catch (err) {
			console.error('Error:', err);
			alert('Error de conexión con el servidor');
		} finally {
			updatingId = null;
		}
	}

	function getStatusBadge(status) {
		const badges = {
			pending: { class: 'bg-warning text-dark', text: 'Pendiente', icon: 'clock' },
			confirmed: { class: 'bg-success', text: 'Confirmada', icon: 'check-circle' },
			cancelled: { class: 'bg-danger', text: 'Cancelada', icon: 'x-circle' },
			completed: { class: 'bg-info', text: 'Completada', icon: 'check-all' }
		};
		return badges[status] || { class: 'bg-secondary', text: status, icon: 'question' };
	}

	function formatDate(dateString) {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-CO', { 
			weekday: 'long', 
			year: 'numeric', 
			month: 'long', 
			day: 'numeric' 
		});
	}

	function formatPrice(price) {
		return Number(price).toLocaleString('es-CO');
	}

	// Filtrar reservas por estado
	let filterStatus = 'all';
	$: filteredReservations = filterStatus === 'all' 
		? reservations 
		: reservations.filter(r => r.status === filterStatus);
</script>

<div class="container py-5">
	<!-- Header -->
	<div class="row mb-4">
		<div class="col-12">
			<button class="btn btn-outline-light mb-3" on:click={() => goto('/dashboard')}>
				<i class="bi bi-arrow-left"></i>
				Volver al Dashboard
			</button>

			<div class="card shadow-lg border-0">
				<div class="card-body p-4">
					<div class="d-flex justify-content-between align-items-center">
						<div>
							<h2 class="mb-1">
								<i class="bi bi-calendar-check text-success"></i>
								Reservas de Mis Canchas
							</h2>
							<p class="text-muted mb-0">Gestiona las reservas de tu complejo deportivo</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Stats Cards -->
	{#if !loadingStats && stats}
		<div class="row mb-4">
			<div class="col-md-3">
				<div class="card shadow border-0 text-center">
					<div class="card-body">
						<i class="bi bi-calendar-event display-4 text-primary"></i>
						<h3 class="mt-3 mb-0">{stats.total}</h3>
						<p class="text-muted mb-0">Total</p>
					</div>
				</div>
			</div>
			<div class="col-md-3">
				<div class="card shadow border-0 text-center">
					<div class="card-body">
						<i class="bi bi-clock display-4 text-warning"></i>
						<h3 class="mt-3 mb-0">{stats.pending}</h3>
						<p class="text-muted mb-0">Pendientes</p>
					</div>
				</div>
			</div>
			<div class="col-md-3">
				<div class="card shadow border-0 text-center">
					<div class="card-body">
						<i class="bi bi-check-circle display-4 text-success"></i>
						<h3 class="mt-3 mb-0">{stats.confirmed}</h3>
						<p class="text-muted mb-0">Confirmadas</p>
					</div>
				</div>
			</div>
			<div class="col-md-3">
				<div class="card shadow border-0 text-center">
					<div class="card-body">
						<i class="bi bi-currency-dollar display-4 text-success"></i>
						<h3 class="mt-3 mb-0">${formatPrice(stats.totalIncome)}</h3>
						<p class="text-muted mb-0">Ingresos</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Filters -->
	<div class="row mb-4">
		<div class="col-12">
			<div class="card shadow border-0">
				<div class="card-body">
					<div class="btn-group w-100" role="group">
						<button 
							type="button" 
							class="btn {filterStatus === 'all' ? 'btn-success' : 'btn-outline-success'}"
							on:click={() => filterStatus = 'all'}
						>
							<i class="bi bi-list"></i>
							Todas ({reservations.length})
						</button>
						<button 
							type="button" 
							class="btn {filterStatus === 'pending' ? 'btn-warning text-dark' : 'btn-outline-warning'}"
							on:click={() => filterStatus = 'pending'}
						>
							<i class="bi bi-clock"></i>
							Pendientes ({reservations.filter(r => r.status === 'pending').length})
						</button>
						<button 
							type="button" 
							class="btn {filterStatus === 'confirmed' ? 'btn-success' : 'btn-outline-success'}"
							on:click={() => filterStatus = 'confirmed'}
						>
							<i class="bi bi-check-circle"></i>
							Confirmadas ({reservations.filter(r => r.status === 'confirmed').length})
						</button>
						<button 
							type="button" 
							class="btn {filterStatus === 'completed' ? 'btn-info' : 'btn-outline-info'}"
							on:click={() => filterStatus = 'completed'}
						>
							<i class="bi bi-check-all"></i>
							Completadas ({reservations.filter(r => r.status === 'completed').length})
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Loading State -->
	{#if loading}
		<div class="text-center py-5">
			<div class="spinner-border text-white" role="status">
				<span class="visually-hidden">Cargando reservas...</span>
			</div>
			<p class="text-white mt-3">Cargando reservas...</p>
		</div>
	{/if}

	<!-- Error State -->
	{#if error}
		<div class="alert alert-danger" role="alert">
			<i class="bi bi-exclamation-triangle-fill"></i>
			{error}
		</div>
	{/if}

	<!-- Reservations List -->
	{#if !loading && !error}
		{#if filteredReservations.length === 0}
			<div class="card shadow-lg border-0">
				<div class="card-body text-center py-5">
					<i class="bi bi-calendar-x display-1 text-muted"></i>
					<h3 class="mt-3">No hay reservas {filterStatus !== 'all' ? `con estado "${filterStatus}"` : ''}</h3>
					<p class="text-muted">Las reservas aparecerán aquí cuando los usuarios reserven tus canchas</p>
				</div>
			</div>
		{:else}
			<div class="row g-4">
				{#each filteredReservations as reservation}
					{@const statusBadge = getStatusBadge(reservation.status)}
					<div class="col-lg-6">
						<div class="card shadow-lg border-0 h-100">
							<div class="card-body p-4">
								<!-- Header -->
								<div class="d-flex justify-content-between align-items-start mb-3">
									<div>
										<h5 class="card-title mb-1">
											<i class="bi bi-grid-3x3-gap text-success"></i>
											{reservation.court.name}
										</h5>
										<small class="text-muted">
											<i class="bi bi-trophy"></i>
											{reservation.court.type}
										</small>
									</div>
									<span class="badge {statusBadge.class}">
										<i class="bi bi-{statusBadge.icon}"></i>
										{statusBadge.text}
									</span>
								</div>

								<!-- Date & Time -->
								<div class="mb-3">
									<div class="d-flex align-items-center mb-2">
										<i class="bi bi-calendar3 text-success me-2"></i>
										<strong>{formatDate(reservation.date)}</strong>
									</div>
									<div class="d-flex align-items-center">
										<i class="bi bi-clock text-success me-2"></i>
										<span>{reservation.startTime} - {reservation.endTime}</span>
									</div>
								</div>

								<!-- Customer Info -->
								<div class="alert alert-light mb-3">
									<h6 class="mb-2">
										<i class="bi bi-person text-success"></i>
										Cliente:
									</h6>
									<div>
										<strong>{reservation.user.displayName || 'Usuario'}</strong><br />
										<small class="text-muted">
											<i class="bi bi-envelope"></i>
											{reservation.user.email}
										</small>
									</div>
								</div>

								<!-- Price -->
								<div class="alert alert-success mb-3">
									<div class="d-flex justify-content-between align-items-center">
										<span>
											<i class="bi bi-currency-dollar"></i>
											<strong>Total:</strong>
										</span>
										<h5 class="mb-0">
											${formatPrice(reservation.totalPrice)} COP
										</h5>
									</div>
								</div>

								<!-- Actions -->
								{#if reservation.status === 'pending'}
									<div class="d-grid gap-2 mb-2">
										<button
											class="btn btn-success"
											on:click={() => updateReservationStatus(reservation.id, 'confirmed')}
											disabled={updatingId === reservation.id}
										>
											{#if updatingId === reservation.id}
												<span class="spinner-border spinner-border-sm me-2"></span>
												Procesando...
											{:else}
												<i class="bi bi-check-circle"></i>
												Confirmar Reserva
											{/if}
										</button>
										<button
											class="btn btn-outline-danger"
											on:click={() => updateReservationStatus(reservation.id, 'cancelled')}
											disabled={updatingId === reservation.id}
										>
											<i class="bi bi-x-circle"></i>
											Rechazar
										</button>
									</div>
								{:else if reservation.status === 'confirmed'}
									<div class="d-grid gap-2 mb-2">
										<button
											class="btn btn-info"
											on:click={() => updateReservationStatus(reservation.id, 'completed')}
											disabled={updatingId === reservation.id}
										>
											{#if updatingId === reservation.id}
												<span class="spinner-border spinner-border-sm me-2"></span>
												Procesando...
											{:else}
												<i class="bi bi-check-all"></i>
												Marcar como Completada
											{/if}
										</button>
										<button
											class="btn btn-outline-danger"
											on:click={() => updateReservationStatus(reservation.id, 'cancelled')}
											disabled={updatingId === reservation.id}
										>
											<i class="bi bi-x-circle"></i>
											Cancelar
										</button>
									</div>
								{/if}

								<!-- Created Date -->
								<div class="mt-3 text-center">
									<small class="text-muted">
										Reservada el {new Date(reservation.createdAt).toLocaleDateString('es-CO')}
									</small>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.card {
		transition: transform 0.2s;
	}
	.card:hover {
		transform: translateY(-5px);
	}
</style>
