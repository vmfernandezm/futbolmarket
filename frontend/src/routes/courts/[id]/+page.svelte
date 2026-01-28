<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import LocationPicker from '$lib/components/LocationPicker.svelte';
	import ScheduleConfig from '$lib/components/ScheduleConfig.svelte';

	let user = null;
	let court = null;
	let loading = true;
	let error = '';
	let success = '';
	let submitting = false;
	let uploadingImage = false;

	// Form fields
	let name = '';
	let type = '';
	let capacity = '';
	let pricePerHour = '';
	let surface = '';
	let description = '';
	let active = true;
	let imageUrl = '';
	let imageFile = null;
	let imagePreview = '';

	// Ubicación
	let latitude = 1.2136;
	let longitude = -77.2811;
	let address = '';
	let store = null;

	// Horarios
	let schedules = [];

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

		// Obtener ID de la cancha desde la URL
		const pathParts = window.location.pathname.split('/');
		const courtId = pathParts[2];

		await loadCourt(courtId);
	});

	async function loadCourt(courtId) {
		try {
			const token = localStorage.getItem('token');

			const response = await fetch(`http://localhost:3001/api/courts/${courtId}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			const data = await response.json();

			if (response.ok) {
				court = data.court;

				// Verificar que el dueño sea el propietario de esta cancha
				if (court.storeId !== user.storeId) {
					error = 'No tienes permiso para editar esta cancha';
					return;
				}

				// Precargar datos en el formulario
				name = court.name;
				type = court.type;
				capacity = court.capacity.toString();
				pricePerHour = court.pricePerHour.toString();
				surface = court.surface || '';
				description = court.description || '';
				active = court.active;
				imageUrl = court.imageUrl || '';
				imagePreview = court.imageUrl ? `http://localhost:3001${court.imageUrl}` : '';

				// Cargar ubicación del store
				if (court.store) {
					store = court.store;
					if (store.latitude && store.longitude) {
						latitude = store.latitude;
						longitude = store.longitude;
						address = store.address || '';
					}
				}

				// Cargar horarios existentes
				const schedulesResponse = await fetch(`http://localhost:3001/api/courts/${courtId}/schedules`, {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				});

				if (schedulesResponse.ok) {
					const schedulesData = await schedulesResponse.json();
					schedules = schedulesData.schedules || [];
				}
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

	function handleImageChange(event) {
		const file = event.target.files[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				alert('La imagen no debe superar 5MB');
				return;
			}

			if (!file.type.startsWith('image/')) {
				alert('Solo se permiten archivos de imagen');
				return;
			}

			imageFile = file;

			// Crear preview
			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target.result;
			};
			reader.readAsDataURL(file);
		}
	}

	function removeImage() {
		imageFile = null;
		imagePreview = '';
		imageUrl = '';
	}

	function handleLocationChange(event) {
		latitude = event.detail.latitude;
		longitude = event.detail.longitude;
	}

	async function handleSubmit() {
		error = '';
		success = '';
		submitting = true;

		try {
			const token = localStorage.getItem('token');
			let finalImageUrl = imageUrl;

			// Primero, actualizar la ubicación del store si cambió
			if (user.storeId) {
				await fetch(`http://localhost:3001/api/stores/${user.storeId}/location`, {
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

			// Si hay una nueva imagen, subirla primero
			if (imageFile) {
				uploadingImage = true;
				const formData = new FormData();
				formData.append('image', imageFile);

				const uploadResponse = await fetch('http://localhost:3001/api/upload/image', {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`
					},
					body: formData
				});

				const uploadData = await uploadResponse.json();

				if (uploadResponse.ok) {
					finalImageUrl = uploadData.imageUrl;
				} else {
					throw new Error(uploadData.error || 'Error al subir la imagen');
				}
				uploadingImage = false;
			}

			// Actualizar la cancha
			const response = await fetch(`http://localhost:3001/api/courts/${court.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					name,
					type,
					capacity: parseInt(capacity),
					pricePerHour: parseFloat(pricePerHour),
					surface: surface || null,
					description: description || null,
					active,
					imageUrl: finalImageUrl
				})
			});

			const data = await response.json();

			if (response.ok) {
				court = data.court;

				// Guardar horarios si hay configurados
				if (schedules.length > 0) {
					const scheduleResponse = await fetch(`http://localhost:3001/api/courts/${court.id}/schedules`, {
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
						console.log('✅ Horarios actualizados');
					}
				}

				success = 'Cancha y horarios actualizados exitosamente';
				imageFile = null;

				// Redirigir después de 2 segundos
				setTimeout(() => {
					goto('/courts/my-courts');
				}, 2000);
			} else {
				error = data.error || 'Error al actualizar la cancha';
			}
		} catch (err) {
			console.error('Error:', err);
			error = err.message || 'Error de conexión con el servidor';
		} finally {
			submitting = false;
			uploadingImage = false;
		}
	}

	async function deleteCourt() {
		if (!confirm('¿Estás seguro de que deseas eliminar esta cancha? Esta acción no se puede deshacer.')) {
			return;
		}

		try {
			const token = localStorage.getItem('token');

			const response = await fetch(`http://localhost:3001/api/courts/${court.id}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			const data = await response.json();

			if (response.ok) {
				alert('Cancha eliminada exitosamente');
				goto('/courts/my-courts');
			} else {
				alert(data.error || 'Error al eliminar la cancha');
			}
		} catch (err) {
			console.error('Error:', err);
			alert('Error de conexión con el servidor');
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
	{:else if court}
		<!-- Header -->
		<div class="row mb-4">
			<div class="col-12">
				<button class="btn btn-outline-light mb-3" on:click={() => goto('/courts/my-courts')}>
					<i class="bi bi-arrow-left"></i>
					Volver a Mis Canchas
				</button>

				<div class="card shadow-lg border-0">
					<div class="card-body p-4">
						<div class="d-flex justify-content-between align-items-center">
							<div>
								<h2 class="mb-1">
									<i class="bi bi-pencil-square text-success"></i>
									Editar Cancha
								</h2>
								<p class="text-muted mb-0">Modifica la información de tu cancha</p>
							</div>
							<div>
								<button class="btn btn-danger" on:click={deleteCourt}>
									<i class="bi bi-trash"></i>
									Eliminar Cancha
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<!-- Preview de la Cancha -->
			<div class="col-lg-4 mb-4">
				<div class="card shadow-lg border-0 sticky-top" style="top: 20px;">
					<div class="card-body">
						<h5 class="card-title mb-3">
							<i class="bi bi-eye text-success"></i>
							Vista Previa
						</h5>

						{#if imagePreview}
							<img 
								src={imagePreview} 
								alt="Preview"
								class="img-fluid rounded mb-3"
								style="width: 100%; height: 200px; object-fit: cover;"
							/>
						{:else}
							<div class="bg-light rounded d-flex align-items-center justify-content-center mb-3" style="height: 200px;">
								<i class="bi bi-image text-muted" style="font-size: 3rem;"></i>
							</div>
						{/if}

						<h5 class="mb-2">{name || 'Nombre de la cancha'}</h5>
						
						<div class="mb-2">
							<span class="badge bg-primary me-1">
								<i class="bi bi-trophy"></i>
								{type || 'Tipo'}
							</span>
							{#if surface}
								<span class="badge bg-info">
									<i class="bi bi-layers"></i>
									{surface}
								</span>
							{/if}
							{#if active}
								<span class="badge bg-success">Activa</span>
							{:else}
								<span class="badge bg-secondary">Inactiva</span>
							{/if}
						</div>

						<div class="mb-2">
							<i class="bi bi-people text-success"></i>
							<small>Capacidad: {capacity || '0'} jugadores</small>
						</div>

						<div class="mb-2">
							<i class="bi bi-currency-dollar text-success"></i>
							<strong>${pricePerHour ? parseFloat(pricePerHour).toLocaleString('es-CO') : '0'} COP/hora</strong>
						</div>

						{#if description}
							<hr />
							<p class="text-muted small mb-0">{description}</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Formulario de Edición -->
			<div class="col-lg-8">
				<div class="card shadow-lg border-0">
					<div class="card-body p-4">
						<h5 class="card-title mb-4">
							<i class="bi bi-card-list"></i>
							Información de la Cancha
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
							<!-- Nombre -->
							<div class="mb-3">
								<label for="name" class="form-label fw-bold">
									<i class="bi bi-card-heading text-success"></i>
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

							<!-- Tipo y Capacidad -->
							<div class="row mb-3">
								<div class="col-md-6">
									<label for="type" class="form-label fw-bold">
										<i class="bi bi-trophy text-success"></i>
										Tipo de Cancha *
									</label>
									<select class="form-select form-select-lg" id="type" bind:value={type} required>
										<option value="">Seleccionar...</option>
										<option value="Fútbol 5">Fútbol 5</option>
										<option value="Fútbol 7">Fútbol 7</option>
										<option value="Fútbol 11">Fútbol 11</option>
										<option value="Fútbol Sala">Fútbol Sala</option>
									</select>
								</div>
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
										min="1"
										placeholder="Ej: 10"
									/>
								</div>
							</div>

							<!-- Precio y Superficie -->
							<div class="row mb-3">
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
										min="0"
										step="1000"
										placeholder="Ej: 50000"
									/>
								</div>
								<div class="col-md-6">
									<label for="surface" class="form-label fw-bold">
										<i class="bi bi-layers text-success"></i>
										Superficie
									</label>
									<select class="form-select form-select-lg" id="surface" bind:value={surface}>
										<option value="">Seleccionar...</option>
										<option value="Césped natural">Césped natural</option>
										<option value="Césped sintético">Césped sintético</option>
										<option value="Tierra">Tierra</option>
										<option value="Cemento">Cemento</option>
									</select>
								</div>
							</div>

							<!-- Descripción -->
							<div class="mb-3">
								<label for="description" class="form-label fw-bold">
									<i class="bi bi-text-paragraph text-success"></i>
									Descripción
								</label>
								<textarea
									class="form-control"
									id="description"
									bind:value={description}
									rows="3"
									placeholder="Describe las características de tu cancha..."
								></textarea>
							</div>

							<!-- Estado -->
							<div class="mb-4">
								<div class="form-check form-switch">
									<input
										class="form-check-input"
										type="checkbox"
										id="active"
										bind:checked={active}
									/>
									<label class="form-check-label fw-bold" for="active">
										<i class="bi bi-toggle-on text-success"></i>
										Cancha Activa (visible para reservas)
									</label>
								</div>
							</div>

							<!-- Imagen -->
							<div class="mb-4">
								<label class="form-label fw-bold">
									<i class="bi bi-image text-success"></i>
									Imagen de la Cancha
								</label>

								{#if imagePreview}
									<div class="position-relative d-inline-block mb-3">
										<img 
											src={imagePreview} 
											alt="Preview" 
											class="img-thumbnail"
											style="max-width: 300px; max-height: 200px;"
										/>
										<button
											type="button"
											class="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
											on:click={removeImage}
										>
											<i class="bi bi-x"></i>
										</button>
									</div>
								{/if}

								<input
									type="file"
									class="form-control"
									accept="image/*"
									on:change={handleImageChange}
								/>
								<small class="text-muted">
									Formatos: JPG, PNG, GIF. Tamaño máximo: 5MB
								</small>
							</div>

							<!-- Ubicación en el Mapa -->
							<div class="mb-4">
								<label class="form-label fw-bold">
									<i class="bi bi-geo-alt text-success"></i>
									Ubicación del Complejo *
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

							<!-- Botones -->
							<div class="d-grid gap-2">
								<button
									type="submit"
									class="btn btn-success btn-lg"
									disabled={submitting || uploadingImage}
								>
									{#if uploadingImage}
										<span class="spinner-border spinner-border-sm me-2"></span>
										Subiendo imagen...
									{:else if submitting}
										<span class="spinner-border spinner-border-sm me-2"></span>
										Guardando cambios...
									{:else}
										<i class="bi bi-check-circle"></i>
										Guardar Cambios
									{/if}
								</button>
								<button
									type="button"
									class="btn btn-outline-secondary"
									on:click={() => goto('/courts/my-courts')}
									disabled={submitting || uploadingImage}
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
	.sticky-top {
		position: sticky;
	}
</style>
