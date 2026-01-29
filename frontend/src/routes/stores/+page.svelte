<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { API_URL } from '$lib/config';

	let user = null;
	let stores = [];
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

		if (user.role !== 'super_admin') {
			goto('/dashboard');
			return;
		}

		await loadStores();
	});

	async function loadStores() {
		try {
			loading = true;
			const response = await fetch('${API_URL}/api/stores');
			const data = await response.json();

			if (response.ok) {
				stores = data.stores || [];
			} else {
				error = 'Error al cargar los complejos';
			}
		} catch (err) {
			console.error('Error:', err);
			error = 'Error de conexión con el servidor';
		} finally {
			loading = false;
		}
	}

	async function deleteStore(storeId, storeName) {
		if (!confirm(`¿Estás seguro de eliminar "${storeName}"?`)) {
			return;
		}

		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${API_URL}/api/stores/${storeId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (response.ok) {
				await loadStores();
			} else {
				alert('Error al eliminar el complejo');
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
						<i class="bi bi-building text-success"></i>
						Gestión de Complejos
					</h1>
					<p class="text-white-50 mb-0">Administra todos los complejos deportivos del sistema</p>
				</div>
				<div>
					<button on:click={() => goto('/stores/create')} class="btn btn-success btn-lg">
						<i class="bi bi-plus-circle"></i>
						Crear Complejo
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
					<i class="bi bi-building display-4 text-success"></i>
					<h3 class="mt-3 mb-0">{stores.length}</h3>
					<p class="text-muted mb-0">Complejos Totales</p>
				</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="card shadow border-0 text-center">
				<div class="card-body">
					<i class="bi bi-check-circle display-4 text-success"></i>
					<h3 class="mt-3 mb-0">{stores.filter(s => s.active).length}</h3>
					<p class="text-muted mb-0">Activos</p>
				</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="card shadow border-0 text-center">
				<div class="card-body">
					<i class="bi bi-person-check display-4 text-primary"></i>
					<h3 class="mt-3 mb-0">{stores.filter(s => s.ownerId).length}</h3>
					<p class="text-muted mb-0">Con Dueño</p>
				</div>
			</div>
		</div>
		<div class="col-md-3">
			<div class="card shadow border-0 text-center">
				<div class="card-body">
					<i class="bi bi-person-x display-4 text-warning"></i>
					<h3 class="mt-3 mb-0">{stores.filter(s => !s.ownerId).length}</h3>
					<p class="text-muted mb-0">Sin Dueño</p>
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
			<p class="text-white mt-3">Cargando complejos...</p>
		</div>
	{/if}

	<!-- Error State -->
	{#if error}
		<div class="alert alert-danger" role="alert">
			<i class="bi bi-exclamation-triangle-fill"></i>
			{error}
		</div>
	{/if}

	<!-- Stores List -->
	{#if !loading && !error}
		{#if stores.length === 0}
			<div class="card shadow-lg border-0">
				<div class="card-body text-center py-5">
					<i class="bi bi-inbox display-1 text-muted"></i>
					<h3 class="mt-3">No hay complejos registrados</h3>
					<p class="text-muted mb-4">Crea el primer complejo deportivo del sistema</p>
					<button on:click={() => goto('/stores/create')} class="btn btn-success btn-lg">
						<i class="bi bi-plus-circle"></i>
						Crear Primer Complejo
					</button>
				</div>
			</div>
		{:else}
			<div class="row g-4">
				{#each stores as store}
					<div class="col-md-6 col-lg-4">
						<div class="card h-100 shadow border-0">
							<div class="card-body">
								<!-- Header -->
								<div class="d-flex justify-content-between align-items-start mb-3">
									<h5 class="card-title mb-0">
										<i class="bi bi-building text-success"></i>
										{store.name}
									</h5>
									{#if store.active}
										<span class="badge bg-success">Activo</span>
									{:else}
										<span class="badge bg-secondary">Inactivo</span>
									{/if}
								</div>

								<!-- Description -->
								{#if store.description}
									<p class="card-text text-muted small mb-3">
										{store.description}
									</p>
								{/if}

								<!-- Info -->
								<div class="mb-2">
									<i class="bi bi-geo-alt text-success"></i>
									<small class="text-muted">{store.location}</small>
								</div>

								<div class="mb-2">
									<i class="bi bi-pin-map text-success"></i>
									<small class="text-muted">{store.city}, {store.department}</small>
								</div>

								{#if store.phone}
									<div class="mb-3">
										<i class="bi bi-telephone text-success"></i>
										<small class="text-muted">{store.phone}</small>
									</div>
								{/if}

								<!-- Owner Info -->
								{#if store.owner}
									<div class="alert alert-info py-2 mb-3">
										<small>
											<i class="bi bi-person-check"></i>
											<strong>Dueño:</strong> {store.owner.displayName}
										</small>
									</div>
								{:else}
									<div class="alert alert-warning py-2 mb-3">
										<small>
											<i class="bi bi-person-x"></i>
											Sin dueño asignado
										</small>
									</div>
								{/if}

								<!-- Courts Count -->
								{#if store._count}
									<div class="mb-3">
										<span class="badge bg-light text-dark">
											<i class="bi bi-grid-3x3-gap"></i>
											{store._count.courts} canchas
										</span>
									</div>
								{/if}

								<!-- Actions -->
								<div class="d-grid gap-2">
									{#if !store.owner}
										<button 
											on:click={() => goto(`/stores/${store.id}/assign-owner`)} 
											class="btn btn-success btn-sm"
										>
											<i class="bi bi-person-plus"></i>
											Asignar Dueño
										</button>
									{/if}
									<button 
										on:click={() => goto(`/stores/${store.id}`)} 
										class="btn btn-outline-success btn-sm"
									>
										<i class="bi bi-eye"></i>
										Ver Detalles
									</button>
									<button 
										on:click={() => deleteStore(store.id, store.name)} 
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
								Creado: {new Date(store.createdAt).toLocaleDateString('es-ES')}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
