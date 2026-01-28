<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let user = null;
	let loading = true;
	let courts = [];
	let loadingCourts = false;
	let error = '';

	onMount(async () => {
		const token = localStorage.getItem('token');
		const userData = localStorage.getItem('user');

		if (!token || !userData) {
			goto('/login');
			return;
		}

		user = JSON.parse(userData);
		loading = false;

		// Si es usuario normal, cargar canchas
		if (user.role === 'usuario') {
			await loadCourts();
		}
	});

	async function loadCourts() {
		try {
			loadingCourts = true;
			const response = await fetch('http://localhost:3001/api/courts');
			const data = await response.json();
			courts = data.courts || [];
		} catch (err) {
			error = 'Error al cargar las canchas';
			console.error(err);
		} finally {
			loadingCourts = false;
		}
	}

	function logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		goto('/');
	}
</script>

{#if loading}
	<div class="container py-5">
		<div class="text-center">
			<div class="spinner-border text-white" role="status">
				<span class="visually-hidden">Cargando...</span>
			</div>
		</div>
	</div>
{:else if user}
	<div class="container py-5">
		<!-- Header -->
		<div class="row mb-4">
			<div class="col-12">
				<div class="card shadow-lg border-0">
					<div class="card-body p-4">
						<div class="d-flex justify-content-between align-items-center">
							<div>
								<h2 class="mb-1">
									<i class="bi bi-speedometer2 text-success"></i>
									Dashboard
								</h2>
								<p class="text-muted mb-0">Bienvenido, {user.displayName}</p>
							</div>
							<div>
								<button on:click={logout} class="btn btn-outline-danger">
									<i class="bi bi-box-arrow-right"></i>
									Cerrar Sesión
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- User Info Card -->
		<div class="row mb-4">
			<div class="col-md-4">
				<div class="card shadow border-0">
					<div class="card-body">
						<h5 class="card-title">
							<i class="bi bi-person-circle text-success"></i>
							Información del Usuario
						</h5>
						<hr />
						<p class="mb-2">
							<strong>Nombre:</strong><br />
							{user.displayName}
						</p>
						<p class="mb-2">
							<strong>Email:</strong><br />
							{user.email}
						</p>
						<p class="mb-2">
							<strong>Rol:</strong><br />
							<span class="badge bg-success">{user.role}</span>
						</p>
					</div>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="col-md-8">
				<div class="card shadow border-0">
					<div class="card-body">
						<h5 class="card-title">
							<i class="bi bi-lightning-charge text-warning"></i>
							Acciones Rápidas
						</h5>
						<hr />

						{#if user.role === 'super_admin'}
							<div class="row g-3">
								<div class="col-md-6">
									<div class="d-grid">
										<button class="btn btn-success btn-lg" on:click={() => goto('/stores/create')}>
											<i class="bi bi-plus-circle"></i>
											Crear Complejo
										</button>
									</div>
								</div>
								<div class="col-md-6">
									<div class="d-grid">
										<button class="btn btn-outline-success btn-lg" on:click={() => goto('/stores')}>
											<i class="bi bi-building"></i>
											Ver Complejos
										</button>
									</div>
								</div>
								<div class="col-md-6">
									<div class="d-grid">
										<button class="btn btn-outline-success btn-lg" on:click={() => goto('/users')}>
											<i class="bi bi-people"></i>
											Gestionar Usuarios
										</button>
									</div>
								</div>
								<div class="col-md-6">
									<div class="d-grid">
										<button class="btn btn-outline-success btn-lg" on:click={() => goto('/')}>
											<i class="bi bi-house"></i>
											Ver Sitio Público
										</button>
									</div>
								</div>
							</div>
						{:else if user.role === 'store_owner'}
							<div class="row g-3">
								<div class="col-md-6">
									<div class="d-grid">
										<button class="btn btn-success btn-lg" on:click={() => goto('/courts/create')}>
											<i class="bi bi-plus-circle"></i>
											Crear Cancha
										</button>
									</div>
								</div>
								<div class="col-md-6">
									<div class="d-grid">
										<button class="btn btn-outline-success btn-lg" on:click={() => goto('/courts/my-courts')}>
											<i class="bi bi-grid-3x3-gap"></i>
											Mis Canchas
										</button>
									</div>
								</div>
								<div class="col-md-6">
									<div class="d-grid">
										<button class="btn btn-outline-success btn-lg" on:click={() => goto('/reservations/store-reservations')}>
											<i class="bi bi-calendar-check"></i>
											Ver Reservas
										</button>
									</div>
								</div>
								<div class="col-md-6">
									<div class="d-grid">
										<button class="btn btn-outline-success btn-lg" on:click={() => goto('/stores/location')}>
											<i class="bi bi-geo-alt"></i>
											Configurar Ubicación
										</button>
									</div>
								</div>
								<div class="col-md-6">
									<div class="d-grid">
										<button class="btn btn-outline-success btn-lg" on:click={() => goto('/')}>
											<i class="bi bi-house"></i>
											Ver Sitio Público
										</button>
									</div>
								</div>
							</div>
						{:else}
							<div class="row g-3">
								<div class="col-md-6">
									<div class="d-grid">
										<button class="btn btn-success btn-lg" on:click={() => goto('/courts/map')}>
											<i class="bi bi-map"></i>
											Ver Mapa de Canchas
										</button>
									</div>
								</div>
								<div class="col-md-6">
									<div class="d-grid">
										<button class="btn btn-outline-success btn-lg" on:click={() => goto('/reservations/my-reservations')}>
											<i class="bi bi-calendar"></i>
											Mis Reservas
										</button>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Canchas Disponibles (Solo para usuarios normales) -->
		{#if user.role === 'usuario'}
			<div class="row">
				<div class="col-12">
					<h4 class="text-white mb-3">
						<i class="bi bi-grid-3x3-gap"></i>
						Canchas Disponibles para Reservar
					</h4>
				</div>
			</div>

			{#if loadingCourts}
				<div class="text-center py-5">
					<div class="spinner-border text-white" role="status">
						<span class="visually-hidden">Cargando canchas...</span>
					</div>
				</div>
			{:else if error}
				<div class="alert alert-danger" role="alert">
					<i class="bi bi-exclamation-triangle-fill"></i>
					{error}
				</div>
			{:else if courts.length === 0}
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
										<button 
											class="btn btn-success"
											on:click={() => goto(`/courts/${court.id}/reserve`)}
										>
											<i class="bi bi-calendar-check"></i>
											Reservar Ahora
										</button>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}

		<!-- Stats Cards (Solo para super_admin) -->
		{#if user.role === 'super_admin'}
			<div class="row">
				<div class="col-12">
					<h4 class="text-white mb-3">
						<i class="bi bi-graph-up"></i>
						Estadísticas del Sistema
					</h4>
				</div>
				<div class="col-md-3">
					<div class="card shadow border-0 text-center">
						<div class="card-body">
							<i class="bi bi-building display-4 text-success"></i>
							<h3 class="mt-3 mb-0">0</h3>
							<p class="text-muted mb-0">Complejos</p>
						</div>
					</div>
				</div>
				<div class="col-md-3">
					<div class="card shadow border-0 text-center">
						<div class="card-body">
							<i class="bi bi-grid-3x3-gap display-4 text-primary"></i>
							<h3 class="mt-3 mb-0">0</h3>
							<p class="text-muted mb-0">Canchas</p>
						</div>
					</div>
				</div>
				<div class="col-md-3">
					<div class="card shadow border-0 text-center">
						<div class="card-body">
							<i class="bi bi-people display-4 text-info"></i>
							<h3 class="mt-3 mb-0">1</h3>
							<p class="text-muted mb-0">Usuarios</p>
						</div>
					</div>
				</div>
				<div class="col-md-3">
					<div class="card shadow border-0 text-center">
						<div class="card-body">
							<i class="bi bi-calendar-check display-4 text-warning"></i>
							<h3 class="mt-3 mb-0">0</h3>
							<p class="text-muted mb-0">Reservas</p>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}
