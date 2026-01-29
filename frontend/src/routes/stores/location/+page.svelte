<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { API_URL } from '$lib/config';
	import LocationPicker from '$lib/components/LocationPicker.svelte';

	let user = null;
	let store = null;
	let loading = true;
	let saving = false;
	let error = '';
	let success = '';

	// Ubicación
	let latitude = 1.2136; // Centro de Pasto por defecto
	let longitude = -77.2811;
	let address = '';

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

		if (!user.storeId) {
			error = 'No tienes un complejo asignado';
			loading = false;
			return;
		}

		await loadStore();
	});

	async function loadStore() {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${API_URL}/api/stores/${user.storeId}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			const data = await response.json();

			if (response.ok) {
				store = data.store;
				
				// Si ya tiene ubicación, cargarla
				if (store.latitude && store.longitude) {
					latitude = store.latitude;
					longitude = store.longitude;
					address = store.address || '';
				}
			} else {
				error = data.error || 'Error al cargar el complejo';
			}
		} catch (err) {
			console.error('Error:', err);
			error = 'Error de conexión con el servidor';
		} finally {
			loading = false;
		}
	}

	function handleLocationChange(event) {
		latitude = event.detail.latitude;
		longitude = event.detail.longitude;
	}

	async function saveLocation() {
		error = '';
		success = '';
		saving = true;

		try {
			const token = localStorage.getItem('token');

			const response = await fetch(`${API_URL}/api/stores/${user.storeId}/location`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					latitude,
					longitude,
					address: address || null
				})
			});

			const data = await response.json();

			if (response.ok) {
				success = data.message || 'Ubicación guardada exitosamente';
				store = data.store;

				setTimeout(() => {
					goto('/dashboard');
				}, 2000);
			} else {
				error = data.error || 'Error al guardar la ubicación';
			}
		} catch (err) {
			console.error('Error:', err);
			error = 'Error de conexión con el servidor';
		} finally {
			saving = false;
		}
	}
</script>

<div class="container py-5">
	{#if loading}
		<div class="text-center py-5">
			<div class="spinner-border text-white" role="status">
				<span class="visually-hidden">Cargando...</span>
			</div>
		</div>
	{:else if store}
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
							<i class="bi bi-geo-alt text-success"></i>
							Configurar Ubicación del Complejo
						</h2>
						<p class="text-muted mb-0">Selecciona la ubicación exacta de tu complejo en el mapa</p>
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<!-- Mapa -->
			<div class="col-lg-8 mb-4">
				<div class="card shadow-lg border-0">
					<div class="card-body p-4">
						<h5 class="card-title mb-3">
							<i class="bi bi-map"></i>
							Selecciona la Ubicación
						</h5>

						<div class="alert alert-info mb-3">
							<i class="bi bi-info-circle"></i>
							<strong>Instrucciones:</strong>
							<ul class="mb-0 mt-2">
								<li>Haz clic en el mapa para colocar el marcador</li>
								<li>Arrastra el marcador verde a la ubicación exacta</li>
								<li>Usa el botón 📍 para obtener tu ubicación actual</li>
							</ul>
						</div>

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

						<LocationPicker 
							{latitude} 
							{longitude} 
							height="500px"
							on:locationChange={handleLocationChange}
						/>
					</div>
				</div>
			</div>

			<!-- Información -->
			<div class="col-lg-4">
				<div class="card shadow-lg border-0 sticky-top" style="top: 20px;">
					<div class="card-body p-4">
						<h5 class="card-title mb-3">
							<i class="bi bi-building text-success"></i>
							{store.name}
						</h5>

						<hr />

						<!-- Coordenadas -->
						<div class="mb-3">
							<label class="form-label fw-bold">
								<i class="bi bi-compass"></i>
								Coordenadas
							</label>
							<div class="alert alert-light mb-0">
								<small>
									<strong>Latitud:</strong> {latitude.toFixed(6)}<br />
									<strong>Longitud:</strong> {longitude.toFixed(6)}
								</small>
							</div>
						</div>

						<!-- Dirección -->
						<div class="mb-3">
							<label for="address" class="form-label fw-bold">
								<i class="bi bi-signpost"></i>
								Dirección (Opcional)
							</label>
							<textarea
								id="address"
								class="form-control"
								bind:value={address}
								rows="3"
								placeholder="Ej: Calle 18 #25-45, Pasto, Nariño"
							></textarea>
							<small class="text-muted">
								Ayuda a tus clientes a encontrarte más fácilmente
							</small>
						</div>

						<!-- Ubicación Actual -->
						<div class="mb-3">
							<label class="form-label fw-bold">
								<i class="bi bi-geo"></i>
								Ubicación Actual
							</label>
							<div class="alert alert-light mb-0">
								<small>
									{#if store.latitude && store.longitude}
										<i class="bi bi-check-circle text-success"></i>
										Ubicación configurada
									{:else}
										<i class="bi bi-x-circle text-danger"></i>
										Sin ubicación configurada
									{/if}
								</small>
							</div>
						</div>

						<hr />

						<!-- Botones -->
						<div class="d-grid gap-2">
							<button
								class="btn btn-success btn-lg"
								on:click={saveLocation}
								disabled={saving}
							>
								{#if saving}
									<span class="spinner-border spinner-border-sm me-2"></span>
									Guardando...
								{:else}
									<i class="bi bi-check-circle"></i>
									Guardar Ubicación
								{/if}
							</button>
							<button
								class="btn btn-outline-secondary"
								on:click={() => goto('/dashboard')}
								disabled={saving}
							>
								<i class="bi bi-x-circle"></i>
								Cancelar
							</button>
						</div>
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
	.sticky-top {
		position: sticky;
	}
</style>
