<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { API_URL } from '$lib/config';

	let courts = [];
	let stores = [];
	let loading = true;
	let error = '';
	let viewMode = 'courts'; // 'courts' o 'stores'
	let isAuthenticated = false;
	let user = null;

	onMount(async () => {
		// Verificar si hay sesión activa
		const token = localStorage.getItem('token');
		const userData = localStorage.getItem('user');
		
		if (token && userData) {
			isAuthenticated = true;
			user = JSON.parse(userData);
		}

		await loadCourts();
	});

	async function loadCourts() {
		try {
			loading = true;
			const response = await fetch(`${API_URL}/api/courts`);
			const data = await response.json();
			courts = data.courts || [];
		} catch (err) {
			error = 'Error al cargar las canchas';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	async function loadStores() {
		try {
			loading = true;
			const response = await fetch(`${API_URL}/api/stores`);
			const data = await response.json();
			stores = data.stores || [];
		} catch (err) {
			error = 'Error al cargar los complejos deportivos';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	async function switchView(mode) {
		viewMode = mode;
		if (mode === 'courts' && courts.length === 0) {
			await loadCourts();
		} else if (mode === 'stores' && stores.length === 0) {
			await loadStores();
		}
	}
</script>

<div class="container py-5">
	<!-- Header -->
	<div class="text-center mb-5">
		<h1 class="display-3 fw-bold text-white mb-3">
			<i class="bi bi-trophy-fill text-warning"></i>
			FútbolMarket
		</h1>
		<p class="lead text-white-50">
			Encuentra y reserva las mejores canchas de fútbol en tu ciudad
		</p>
	</div>

	<!-- Navigation -->
	<div class="row mb-4">
		<div class="col-12">
			<div class="card shadow-lg border-0">
				<div class="card-body p-4">
					<div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
						<div class="btn-group" role="group">
							<button 
								type="button" 
								class="btn {viewMode === 'courts' ? 'btn-success' : 'btn-outline-success'}"
								on:click={() => switchView('courts')}
							>
								<i class="bi bi-grid-3x3-gap"></i>
								Ver Canchas
							</button>
							<button 
								type="button" 
								class="btn {viewMode === 'stores' ? 'btn-success' : 'btn-outline-success'}"
								on:click={() => switchView('stores')}
							>
								<i class="bi bi-building"></i>
								Ver Complejos
							</button>
						</div>
						<div>
							<a href="/login" class="btn btn-outline-success me-2">
								<i class="bi bi-box-arrow-in-right"></i>
								Iniciar Sesión
							</a>
							<a href="/register" class="btn btn-success">
								<i class="bi bi-person-plus-fill"></i>
								Registrarse
							</a>
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
				<span class="visually-hidden">Cargando...</span>
			</div>
			<p class="text-white mt-3">Cargando {viewMode === 'courts' ? 'canchas' : 'complejos'}...</p>
		</div>
	{/if}

	<!-- Error State -->
	{#if error}
		<div class="alert alert-danger" role="alert">
			<i class="bi bi-exclamation-triangle-fill"></i>
			{error}
		</div>
	{/if}

	<!-- Courts Grid -->
	{#if !loading && !error && viewMode === 'courts'}
		{#if courts.length === 0}
			<div class="card shadow-lg border-0">
				<div class="card-body text-center py-5">
					<i class="bi bi-inbox display-1 text-muted"></i>
					<h3 class="mt-3">No hay canchas disponibles</h3>
					<p class="text-muted">Vuelve pronto para ver nuevas opciones</p>
				</div>
			</div>
		{:else}
			<div class="row g-4">
				{#each courts as court}
					<div class="col-md-6 col-lg-4">
						<div class="card h-100 shadow-lg border-0 hover-card">
							<!-- Imagen -->
							{#if court.imageUrl}
								<img 
									src={`http://localhost:3001${court.imageUrl}`} 
									alt={court.name}
									class="card-img-top"
									style="height: 200px; object-fit: cover;"
								/>
							{:else}
								<div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 200px;">
									<i class="bi bi-image text-muted" style="font-size: 3rem;"></i>
								</div>
							{/if}

							<div class="card-body">
								<div class="d-flex justify-content-between align-items-start mb-3">
									<h5 class="card-title mb-0">
										<i class="bi bi-grid-3x3-gap text-success"></i>
										{court.name}
									</h5>
									{#if court.active}
										<span class="badge bg-success">Disponible</span>
									{/if}
								</div>

								<!-- Type Badge -->
								<div class="mb-3">
									<span class="badge bg-primary">
										<i class="bi bi-trophy"></i>
										{court.type}
									</span>
									{#if court.surface}
										<span class="badge bg-info ms-1">
											<i class="bi bi-layers"></i>
											{court.surface}
										</span>
									{/if}
								</div>

								<!-- Info -->
								<div class="mb-2">
									<i class="bi bi-people text-success"></i>
									<small class="text-muted">Capacidad: {court.capacity} jugadores</small>
								</div>

								<div class="mb-3">
									<i class="bi bi-currency-dollar text-success"></i>
									<small class="fw-bold text-dark">
										${court.pricePerHour.toLocaleString('es-CO')} COP/hora
									</small>
								</div>

								<!-- Store Info -->
								{#if court.store}
									<div class="alert alert-light py-2 mb-3">
										<small>
											<i class="bi bi-building"></i>
											<strong>{court.store.name}</strong><br />
											<i class="bi bi-geo-alt"></i>
											{court.store.city}
										</small>
									</div>
								{/if}

								<!-- Actions -->
								<div class="d-grid">
									{#if isAuthenticated}
										<button 
											class="btn btn-success"
											on:click={() => goto(`/courts/${court.id}/reserve`)}
										>
											<i class="bi bi-calendar-check"></i>
											Reservar Ahora
										</button>
									{:else}
										<a href="/login" class="btn btn-success">
											<i class="bi bi-box-arrow-in-right"></i>
											Iniciar Sesión para Reservar
										</a>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Stores Grid -->
	{#if !loading && !error && viewMode === 'stores'}
		{#if stores.length === 0}
			<div class="card shadow-lg border-0">
				<div class="card-body text-center py-5">
					<i class="bi bi-inbox display-1 text-muted"></i>
					<h3 class="mt-3">No hay complejos deportivos disponibles</h3>
					<p class="text-muted">Vuelve pronto para ver nuevas opciones</p>
				</div>
			</div>
		{:else}
			<div class="row g-4">
				{#each stores as store}
					<div class="col-md-6 col-lg-4">
						<div class="card h-100 shadow-lg border-0 hover-card">
							<div class="card-body">
								<div class="d-flex justify-content-between align-items-start mb-3">
									<h5 class="card-title mb-0">
										<i class="bi bi-building text-success"></i>
										{store.name}
									</h5>
									{#if store.active}
										<span class="badge bg-success">Activo</span>
									{/if}
								</div>

								{#if store.description}
									<p class="card-text text-muted small mb-3">
										{store.description}
									</p>
								{/if}

								<div class="mb-2">
									<i class="bi bi-geo-alt text-success"></i>
									<small class="text-muted">{store.location}</small>
								</div>

								{#if store.phone}
									<div class="mb-2">
										<i class="bi bi-telephone text-success"></i>
										<small class="text-muted">{store.phone}</small>
									</div>
								{/if}

								<div class="mb-3">
									<i class="bi bi-pin-map text-success"></i>
									<small class="text-muted">{store.city}, {store.department}</small>
								</div>

								{#if store._count}
									<div class="d-flex justify-content-between align-items-center">
										<span class="badge bg-light text-dark">
											<i class="bi bi-grid-3x3-gap"></i>
											{store._count.courts} canchas
										</span>
										<a href="/stores/{store.id}" class="btn btn-sm btn-success">
											Ver Canchas
											<i class="bi bi-arrow-right"></i>
										</a>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.hover-card {
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}

	.hover-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.3) !important;
	}
</style>
