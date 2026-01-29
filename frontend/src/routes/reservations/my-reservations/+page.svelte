<script>
	import { onMount } from 'svelte';
import { API_URL } from '\/config' from 'svelte';
	import { goto } from '\/navigation';
import { API_URL } from '\/config' from '$app/navigation';

	let user = null;
	let reservations = [];
	let loading = true;
	let error = '';
	let cancellingId = null;

	onMount(async () => {
		const token = localStorage.getItem('token');
		const userData = localStorage.getItem('user');

		if (!token || !userData) {
			goto('/login');
			return;
		}

		user = JSON.parse(userData);
		await loadReservations();
	});

	async function loadReservations() {
		try {
			loading = true;
			const token = localStorage.getItem('token');

			const response = await fetch('${API_URL}/api/reservations/my-reservations', {
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

	async function cancelReservation(reservationId) {
		if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
			return;
		}

		try {
			cancellingId = reservationId;
			const token = localStorage.getItem('token');

			const response = await fetch(`${API_URL}/api/reservations/${reservationId}/status`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ status: 'cancelled' })
			});

			const data = await response.json();

			if (response.ok) {
				alert(data.message || 'Reserva cancelada exitosamente');
				await loadReservations();
			} else {
				alert(data.error || 'Error al cancelar la reserva');
			}
		} catch (err) {
			console.error('Error:', err);
			alert('Error de conexión con el servidor');
		} finally {
			cancellingId = null;
		}
	}

	function getStatusBadge(status) {
		const badges = {
			pending: { class: 'bg-warning', text: 'Pendiente', icon: 'clock' },
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
								Mis Reservas
							</h2>
							<p class="text-muted mb-0">Gestiona tus reservas de canchas</p>
						</div>
						<div>
							<button class="btn btn-success" on:click={() => goto('/dashboard')}>
								<i class="bi bi-plus-circle"></i>
								Nueva Reserva
							</button>
						</div>
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
			<p class="text-white mt-3">Cargando tus reservas...</p>
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
		{#if reservations.length === 0}
			<div class="card shadow-lg border-0">
				<div class="card-body text-center py-5">
					<i class="bi bi-calendar-x display-1 text-muted"></i>
					<h3 class="mt-3">No tienes reservas</h3>
					<p class="text-muted mb-4">Comienza reservando una cancha para jugar</p>
					<button class="btn btn-success btn-lg" on:click={() => goto('/dashboard')}>
						<i class="bi bi-search"></i>
						Buscar Canchas
					</button>
				</div>
			</div>
		{:else}
			<div class="row g-4">
				{#each reservations as reservation}
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
											<i class="bi bi-building"></i>
											{reservation.court.store.name}
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

								<!-- Court Info -->
								<div class="alert alert-light mb-3">
									<div class="row g-2">
										<div class="col-6">
											<small class="text-muted">Tipo:</small><br />
											<span class="badge bg-primary">
												<i class="bi bi-trophy"></i>
												{reservation.court.type}
											</span>
										</div>
										<div class="col-6">
											<small class="text-muted">Capacidad:</small><br />
											<i class="bi bi-people"></i>
											{reservation.court.capacity} jugadores
										</div>
									</div>
								</div>

								<!-- Location -->
								<div class="mb-3">
									<small class="text-muted">
										<i class="bi bi-geo-alt"></i>
										{reservation.court.store.location}, {reservation.court.store.city}
									</small>
									{#if reservation.court.store.phone}
										<br />
										<small class="text-muted">
											<i class="bi bi-telephone"></i>
											{reservation.court.store.phone}
										</small>
									{/if}
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
								{#if reservation.status === 'pending' || reservation.status === 'confirmed'}
									<div class="d-grid">
										<button
											class="btn btn-outline-danger"
											on:click={() => cancelReservation(reservation.id)}
											disabled={cancellingId === reservation.id}
										>
											{#if cancellingId === reservation.id}
												<span class="spinner-border spinner-border-sm me-2"></span>
												Cancelando...
											{:else}
												<i class="bi bi-x-circle"></i>
												Cancelar Reserva
											{/if}
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

			<!-- Summary -->
			<div class="row mt-4">
				<div class="col-12">
					<div class="card shadow border-0">
						<div class="card-body">
							<h5 class="card-title">
								<i class="bi bi-bar-chart text-success"></i>
								Resumen
							</h5>
							<div class="row text-center mt-3">
								<div class="col-3">
									<h3 class="text-warning">
										{reservations.filter(r => r.status === 'pending').length}
									</h3>
									<small class="text-muted">Pendientes</small>
								</div>
								<div class="col-3">
									<h3 class="text-success">
										{reservations.filter(r => r.status === 'confirmed').length}
									</h3>
									<small class="text-muted">Confirmadas</small>
								</div>
								<div class="col-3">
									<h3 class="text-danger">
										{reservations.filter(r => r.status === 'cancelled').length}
									</h3>
									<small class="text-muted">Canceladas</small>
								</div>
								<div class="col-3">
									<h3 class="text-info">
										{reservations.filter(r => r.status === 'completed').length}
									</h3>
									<small class="text-muted">Completadas</small>
								</div>
							</div>
						</div>
					</div>
				</div>
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
