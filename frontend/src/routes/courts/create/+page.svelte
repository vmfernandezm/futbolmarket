<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { API_URL } from '$lib/config';
	import LocationPicker from '$lib/components/LocationPicker.svelte';
	import ScheduleConfig from '$lib/components/ScheduleConfig.svelte';

	let user = null;
	let loading = false;
	let error = '';
	let success = '';

	// Form fields
	let name = '';
	let type = 'Fútbol 5';
	let surface = 'Césped sintético';
	let capacity = 10;
	let pricePerHour = 50000;
	let description = '';
	let imageUrl = '';
	let imageFile = null;
	let uploadingImage = false;

	// Ubicación
	let latitude = 1.2136; // Centro de Pasto por defecto
	let longitude = -77.2811;
	let address = '';

	// Horarios
	let schedules = [];

	const courtTypes = ['Fútbol 5', 'Fútbol 7', 'Fútbol 11', 'Fútbol Sala', 'Baloncesto', 'Voleibol', 'Tenis'];
	const surfaceTypes = ['Césped sintético', 'Césped natural', 'Cemento', 'Parquet', 'Tierra'];

	onMount(() => {
		const userData = localStorage.getItem('user');
		const token = localStorage.getItem('token');

		if (!userData || !token) {
			goto('/login');
			return;
		}

		user = JSON.parse(userData);

		if (user.role !== 'store_owner' && user.role !== 'super_admin') {
			goto('/dashboard');
		}

		if (user.role === 'store_owner' && !user.storeId) {
			error = 'No tienes un complejo asignado. Contacta al administrador.';
		}
	});

	async function handleImageUpload(event) {
		const file = event.target.files[0];
		if (!file) return;

		// Validar tipo de archivo
		if (!file.type.startsWith('image/')) {
			error = 'Por favor selecciona una imagen válida';
			return;
		}

		// Validar tamaño (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			error = 'La imagen no debe superar 5MB';
			return;
		}

		uploadingImage = true;
		error = '';

		try {
			const token = localStorage.getItem('token');
			const formData = new FormData();
			formData.append('image', file);

			const response = await fetch('${API_URL}/api/upload/image', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`
				},
				body: formData
			});

			const data = await response.json();

			if (response.ok) {
				imageUrl = data.imageUrl;
				imageFile = file;
			} else {
				error = data.error || 'Error al subir la imagen';
			}
		} catch (err) {
			console.error('Error:', err);
			error = 'Error al subir la imagen';
		} finally {
			uploadingImage = false;
		}
	}

	function removeImage() {
		imageUrl = '';
		imageFile = null;
	}

	function handleLocationChange(event) {
		latitude = event.detail.latitude;
		longitude = event.detail.longitude;
	}

	async function handleSubmit() {
		error = '';
		success = '';
		loading = true;

		try {
			const token = localStorage.getItem('token');

			// Primero, actualizar la ubicación del store
			if (user.storeId) {
				await fetch(`${API_URL}/api/stores/${user.storeId}/location`, {
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
			}

			// Luego, crear la cancha
			const response = await fetch('${API_URL}/api/courts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					name,
					type,
					surface,
					capacity: parseInt(capacity),
					pricePerHour: parseFloat(pricePerHour),
					description,
					imageUrl: imageUrl || null
				})
			});

			const data = await response.json();

			if (response.ok) {
				const courtId = data.court.id;
				console.log('✅ Cancha creada:', data.court);

				// Guardar horarios si hay configurados
				if (schedules.length > 0) {
					const scheduleResponse = await fetch(`${API_URL}/api/courts/${courtId}/schedules`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`
						},
						body: JSON.stringify({ schedules })
					});

					if (!scheduleResponse.ok) {
						console.error('Error al guardar horarios');
					} else {
						console.log('✅ Horarios guardados');
					}
				}

				success = 'Cancha creada exitosamente con sus horarios';
				
				// Limpiar formulario
				name = '';
				type = 'Fútbol 5';
				surface = 'Césped sintético';
				capacity = 10;
				pricePerHour = 50000;
				description = '';
				imageUrl = '';
				imageFile = null;
				schedules = [];

				// Redirigir después de 2 segundos
				setTimeout(() => {
					goto('/courts/my-courts');
				}, 2000);
			} else {
				error = data.error || 'Error al crear la cancha';
			}
		} catch (err) {
			console.error('Error:', err);
			error = 'Error de conexión con el servidor';
		} finally {
			loading = false;
		}
	}
</script>

<div class="container py-5">
	<div class="row justify-content-center">
		<div class="col-lg-8">
			<!-- Header -->
			<div class="mb-4">
				<button on:click={() => goto('/dashboard')} class="btn btn-outline-light mb-3">
					<i class="bi bi-arrow-left"></i>
					Volver al Dashboard
				</button>
				<h1 class="text-white">
					<i class="bi bi-plus-circle text-success"></i>
					Crear Nueva Cancha
				</h1>
				<p class="text-white-50">Agrega una nueva cancha a tu complejo deportivo</p>
			</div>

			<!-- Form Card -->
			<div class="card shadow-lg border-0">
				<div class="card-body p-5">
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
							<div class="spinner-border spinner-border-sm ms-2" role="status">
								<span class="visually-hidden">Redirigiendo...</span>
							</div>
						</div>
					{/if}

					<form on:submit|preventDefault={handleSubmit}>
						<!-- Nombre -->
						<div class="mb-4">
							<label for="name" class="form-label fw-bold">
								<i class="bi bi-grid-3x3-gap text-success"></i>
								Nombre de la Cancha *
							</label>
							<input
								type="text"
								class="form-control form-control-lg"
								id="name"
								bind:value={name}
								required
								placeholder="Ej: Cancha Principal"
							/>
						</div>

						<!-- Tipo y Superficie -->
						<div class="row mb-4">
							<div class="col-md-6">
								<label for="type" class="form-label fw-bold">
									<i class="bi bi-trophy text-success"></i>
									Tipo de Cancha *
								</label>
								<select
									class="form-select form-select-lg"
									id="type"
									bind:value={type}
									required
								>
									{#each courtTypes as courtType}
										<option value={courtType}>{courtType}</option>
									{/each}
								</select>
							</div>
							<div class="col-md-6">
								<label for="surface" class="form-label fw-bold">
									<i class="bi bi-layers text-success"></i>
									Superficie
								</label>
								<select
									class="form-select form-select-lg"
									id="surface"
									bind:value={surface}
								>
									{#each surfaceTypes as surfaceType}
										<option value={surfaceType}>{surfaceType}</option>
									{/each}
								</select>
							</div>
						</div>

						<!-- Capacidad y Precio -->
						<div class="row mb-4">
							<div class="col-md-6">
								<label for="capacity" class="form-label fw-bold">
									<i class="bi bi-people text-success"></i>
									Capacidad (jugadores) *
								</label>
								<input
									type="number"
									class="form-control form-control-lg"
									id="capacity"
									bind:value={capacity}
									required
									min="2"
									max="50"
								/>
							</div>
							<div class="col-md-6">
								<label for="pricePerHour" class="form-label fw-bold">
									<i class="bi bi-currency-dollar text-success"></i>
									Precio por Hora (COP) *
								</label>
								<input
									type="number"
									class="form-control form-control-lg"
									id="pricePerHour"
									bind:value={pricePerHour}
									required
									min="1000"
									step="1000"
								/>
							</div>
						</div>

						<!-- Descripción -->
						<div class="mb-4">
							<label for="description" class="form-label fw-bold">
								<i class="bi bi-card-text text-success"></i>
								Descripción
							</label>
							<textarea
								class="form-control"
								id="description"
								bind:value={description}
								rows="3"
								placeholder="Características adicionales de la cancha..."
							></textarea>
							<small class="text-muted">Opcional</small>
						</div>

						<!-- Imagen -->
						<div class="mb-4">
							<label for="image" class="form-label fw-bold">
								<i class="bi bi-image text-success"></i>
								Imagen de la Cancha
							</label>
							
							{#if !imageUrl}
								<input
									type="file"
									class="form-control"
									id="image"
									accept="image/*"
									on:change={handleImageUpload}
									disabled={uploadingImage}
								/>
								<small class="text-muted">
									Formatos: JPG, PNG, WEBP, GIF. Tamaño máximo: 5MB
								</small>
								{#if uploadingImage}
									<div class="mt-2">
										<div class="spinner-border spinner-border-sm text-success"></div>
										<small class="text-muted ms-2">Subiendo imagen...</small>
									</div>
								{/if}
							{:else}
								<div class="card">
									<div class="card-body p-3">
										<div class="d-flex align-items-center justify-content-between">
											<div class="d-flex align-items-center">
												<img 
													src={`${API_URL}${imageUrl}`} 
													alt="Preview" 
													class="rounded"
													style="width: 100px; height: 100px; object-fit: cover;"
												/>
												<div class="ms-3">
													<p class="mb-0 fw-bold">Imagen cargada</p>
													<small class="text-muted">{imageFile?.name}</small>
												</div>
											</div>
											<button
												type="button"
												class="btn btn-outline-danger btn-sm"
												on:click={removeImage}
											>
												<i class="bi bi-trash"></i>
												Eliminar
											</button>
										</div>
									</div>
								</div>
							{/if}
						</div>

						<!-- Ubicación en el Mapa -->
						<div class="mb-4">
							<label class="form-label fw-bold">
								<i class="bi bi-geo-alt text-success"></i>
								Ubicación de tu Complejo *
							</label>
							<div class="alert alert-info mb-3">
								<small>
									<i class="bi bi-info-circle"></i>
									<strong>Instrucciones:</strong> Haz clic en el mapa o arrastra el marcador verde a la ubicación exacta de tu complejo deportivo. 
									También puedes usar el botón 📍 para obtener tu ubicación actual.
								</small>
							</div>
							
							<LocationPicker 
								{latitude} 
								{longitude} 
								height="400px"
								on:locationChange={handleLocationChange}
							/>

							<div class="mt-3">
								<div class="row">
									<div class="col-md-6">
										<small class="text-muted">
											<strong>Latitud:</strong> {latitude.toFixed(6)}
										</small>
									</div>
									<div class="col-md-6">
										<small class="text-muted">
											<strong>Longitud:</strong> {longitude.toFixed(6)}
										</small>
									</div>
								</div>
							</div>

							<!-- Dirección opcional -->
							<div class="mt-3">
								<label for="address" class="form-label">
									<i class="bi bi-signpost"></i>
									Dirección (Opcional)
								</label>
								<input
									type="text"
									class="form-control"
									id="address"
									bind:value={address}
									placeholder="Ej: Calle 18 #25-45, Pasto, Nariño"
								/>
								<small class="text-muted">
									Ayuda a tus clientes a encontrarte más fácilmente
								</small>
							</div>
						</div>

						<!-- Configuración de Horarios -->
						<div class="mb-4">
							<ScheduleConfig bind:schedules on:change={(e) => schedules = e.detail} />
						</div>

						<!-- Preview Card -->
						<div class="alert alert-light border">
							<h6 class="fw-bold mb-3">
								<i class="bi bi-eye"></i>
								Vista Previa
							</h6>
							<div class="row">
								<div class="col-md-6">
									<p class="mb-2"><strong>Nombre:</strong> {name || 'Sin nombre'}</p>
									<p class="mb-2"><strong>Tipo:</strong> {type}</p>
									<p class="mb-2"><strong>Superficie:</strong> {surface}</p>
								</div>
								<div class="col-md-6">
									<p class="mb-2"><strong>Capacidad:</strong> {capacity} jugadores</p>
									<p class="mb-2"><strong>Precio:</strong> ${pricePerHour.toLocaleString('es-CO')} COP/hora</p>
								</div>
							</div>
						</div>

						<!-- Botones -->
						<div class="d-grid gap-2 d-md-flex justify-content-md-end">
							<button
								type="button"
								class="btn btn-outline-secondary"
								on:click={() => goto('/dashboard')}
								disabled={loading}
							>
								<i class="bi bi-x-circle"></i>
								Cancelar
							</button>
							<button
								type="submit"
								class="btn btn-success btn-lg"
								disabled={loading}
							>
								{#if loading}
									<span class="spinner-border spinner-border-sm me-2"></span>
									Creando...
								{:else}
									<i class="bi bi-check-circle"></i>
									Crear Cancha
								{/if}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
</div>
