<script>
	import { goto } from '\$app/navigation';
	import { API_URL } from '\$lib/config';
	import { onMount } from 'svelte';
	import { API_URL } from '\$lib/config';

	let user = null;
	let courts = [];
	let loading = true;
	let error = '';

	onMount(async () => {
		const userData = localStorage.getItem('user');
		const token = localStorage.getItem('token');

		if (!userData || !token) {
			goto('/login');
			return;
		}

		user = JSON.parse(userData);

		if (user.role !== 'store_owner') {
			goto('/dashboard');
			return;
		}

		await loadCourts();
	});

	async function loadCourts() {
		try {
			loading = true;
			const token = localStorage.getItem('token');
			
			const response = await fetch('${API_URL}/api/courts/my-courts', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			const data = await response.json();

			if (response.ok) {
				courts = data.courts || [];
			} else {
				error = data.error || 'Error al cargar las canchas';
			}
		} catch (err) {
			console.error('Error:', err);
			error = 'Error de conexión con el servidor';
		} finally {
			loading = false;
		}
	}

	async function deleteCourt(courtId, courtName) {
		if (!confirm(`¿Estás seguro de eliminar "${courtName}"?`)) {
			return;
		}

		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${API_URL}/api/courts/${courtId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (response.ok) {
				await loadCourts();
			} else {
				alert('Error al eliminar la cancha');
			}
		} catch (err) {
			console.error('Error:', err);
			alert('Error de conexión');
		}
	}
</script>

<div class="container py-5">
	<!-- Header -->
	<div class="row mb-4">
		<div class="col-12">
			<button on:click={() => goto('/dashboard')} class="btn btn-outline-light mb-3">
				<i class="bi bi-arrow-left"></i>
				Volver al Dashboard
			</button>
			<div class="d-flex justify-content-between align-items-center">
				<div>
					<h1 class="text-white mb-2">
						<i class="bi bi-grid-3x3-gap text-success"></i>
						Mis Canchas
					</h1>
					<p class="text-white-50 mb-0">Gestiona las canchas de tu complejo deportivo</p>
				</div>
				<div>
					<button on:click={() => goto('/courts/create')} class="btn btn-success btn-lg">
						<i class="bi bi-plus-circle"></i>
						Crear Cancha
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Stats Card -->
	<div class="row mb-4">
		<div class="col-md-3">
			<div class="card shadow border-0 text-center">
				<div class="card-body">
					<i class="bi bi-grid-3x3-gap display-4 text-success"></i>
					<h3 class="mt-3 mb-0">{courts.length}</h3>
					<p class="text-muted mb-0">Canchas Totales</p>
				</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="card shadow border-0 text-center">
				<div class="card-body">
					<i class="bi bi-check-circle display-4 text-success"></i>
					<h3 class="mt-3 mb-0">{courts.filter(c => c.active).length}</h3>
					<p class="text-muted mb-0">Activas</p>
				</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="card shadow border-0 text-center">
				<div class="card-body">
					<i class="bi bi-trophy display-4 text-warning"></i>
					<h3 class="mt-3 mb-0">{courts.filter(c => c.type.includes('Fútbol')).length}</h3>
					<p class="text-muted mb-0">De Fútbol</p>
				</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="card shadow border-0 text-center">
				<div class="card-body">
					<i class="bi bi-currency-dollar display-4 text-primary"></i>
					<h3 class="mt-3 mb-0">
						${courts.length > 0 ? Math.round(courts.reduce((sum, c) => sum + c.pricePerHour, 0) / courts.length).toLocaleString('es-CO') : 0}
					</h3>
					<p class="text-muted mb-0">Precio Promedio</p>
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
			<p class="text-white mt-3">Cargando canchas...</p>
		</div>
	{/if}

	<!-- Error State -->
	{#if error}
		<div class="alert alert-danger" role="alert">
			<i class="bi bi-exclamation-triangle-fill"></i>
			{error}
		</div>
	{/if}

	<!-- Courts List -->
	{#if !loading && !error}
		{#if courts.length === 0}
			<div class="card shadow-lg border-0">
				<div class="card-body text-center py-5">
					<i class="bi bi-inbox display-1 text-muted"></i>
					<h3 class="mt-3">No tienes canchas registradas</h3>
					<p class="text-muted mb-4">Crea tu primera cancha para empezar a recibir reservas</p>
					<button on:click={() => goto('/courts/create')} class="btn btn-success btn-lg">
						<i class="bi bi-plus-circle"></i>
						Crear Primera Cancha
					</button>
				</div>
			</div>
		{:else}
			<div class="row g-4">
				{#each courts as court}
					<div class="col-md-6 col-lg-4">
						<div class="card h-100 shadow border-0">
							<!-- Imagen -->
							{#if court.imageUrl}
								<img 
									src={`${API_URL}${court.imageUrl}`} 
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
								<!-- Header -->
								<div class="d-flex justify-content-between align-items-start mb-3">
									<h5 class="card-title mb-0">
										<i class="bi bi-grid-3x3-gap text-success"></i>
										{court.name}
									</h5>
									{#if court.active}
										<span class="badge bg-success">Activa</span>
									{:else}
										<span class="badge bg-secondary">Inactiva</span>
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
									<small class="text-muted">
										<strong>${court.pricePerHour.toLocaleString('es-CO')} COP</strong> por hora
									</small>
								</div>

								<!-- Description -->
								{#if court.description}
									<p class="card-text text-muted small mb-3">
										{court.description}
									</p>
								{/if}

								<!-- Store Info -->
								{#if court.store}
									<div class="alert alert-light py-2 mb-3">
										<small>
											<i class="bi bi-building"></i>
											{court.store.name}
										</small>
									</div>
								{/if}

								<!-- Actions -->
								<div class="d-grid gap-2">
									<button 
										on:click={() => goto(`/courts/${court.id}`)} 
										class="btn btn-outline-success btn-sm"
									>
										<i class="bi bi-eye"></i>
										Ver Detalles
									</button>
									<button 
										on:click={() => deleteCourt(court.id, court.name)} 
										class="btn btn-outline-danger btn-sm"
									>
										<i class="bi bi-trash"></i>
										Eliminar
									</button>
								</div>
							</div>

							<!-- Footer -->
							<div class="card-footer bg-light text-muted small">
								<i class="bi bi-calendar"></i>
								Creada: {new Date(court.createdAt).toLocaleDateString('es-ES')}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
