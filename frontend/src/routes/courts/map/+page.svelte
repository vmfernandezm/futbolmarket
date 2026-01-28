<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';

	let map;
	let L;
	let mapContainer;
	let courts = [];
	let userMarker;
	let courtMarkers = [];
	let loading = true;
	let error = '';
	let userLocation = null;
	let radius = 5; // km
	let selectedType = '';
	let maxPrice = '';

	// Filtros
	const courtTypes = ['Fútbol 5', 'Fútbol 7', 'Fútbol 11', 'Fútbol Sala'];

	onMount(async () => {
		// Importar Leaflet
		L = await import('leaflet');

		// Crear mapa centrado en Pasto
		map = L.map(mapContainer).setView([1.2136, -77.2811], 13);

		// Agregar capa de OpenStreetMap
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© OpenStreetMap contributors',
			maxZoom: 19
		}).addTo(map);

		// Pedir ubicación del usuario
		requestUserLocation();
	});

	async function requestUserLocation() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				async (position) => {
					userLocation = {
						latitude: position.coords.latitude,
						longitude: position.coords.longitude
					};

					// Centrar mapa en ubicación del usuario
					map.setView([userLocation.latitude, userLocation.longitude], 14);

					// Agregar marcador del usuario
					const userIcon = L.icon({
						iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
						shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
						iconSize: [25, 41],
						iconAnchor: [12, 41],
						popupAnchor: [1, -34],
						shadowSize: [41, 41]
					});

					userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
						icon: userIcon
					}).addTo(map);

					userMarker.bindPopup('<strong>Tu ubicación</strong>').openPopup();

					// Agregar círculo de radio
					L.circle([userLocation.latitude, userLocation.longitude], {
						color: '#228B22',
						fillColor: '#32CD32',
						fillOpacity: 0.1,
						radius: radius * 1000 // convertir km a metros
					}).addTo(map);

					// Cargar canchas cercanas
					await loadNearbyCourts();
				},
				(err) => {
					console.error('Error de geolocalización:', err);
					error = 'No se pudo obtener tu ubicación. Mostrando todas las canchas.';
					loadAllCourts();
				}
			);
		} else {
			error = 'Tu navegador no soporta geolocalización. Mostrando todas las canchas.';
			loadAllCourts();
		}
	}

	async function loadNearbyCourts() {
		try {
			loading = true;
			let url = `http://localhost:3001/api/courts/nearby?lat=${userLocation.latitude}&lng=${userLocation.longitude}&radius=${radius}`;
			
			if (selectedType) {
				url += `&type=${encodeURIComponent(selectedType)}`;
			}
			if (maxPrice) {
				url += `&maxPrice=${maxPrice}`;
			}

			const response = await fetch(url);
			const data = await response.json();

			if (response.ok) {
				courts = data.courts || [];
				displayCourtsOnMap();
			} else {
				error = data.error || 'Error al cargar canchas';
			}
		} catch (err) {
			console.error('Error:', err);
			error = 'Error de conexión con el servidor';
		} finally {
			loading = false;
		}
	}

	async function loadAllCourts() {
		try {
			loading = true;
			const response = await fetch('http://localhost:3001/api/courts/map');
			const data = await response.json();

			if (response.ok) {
				courts = data.courts || [];
				displayCourtsOnMap();
			} else {
				error = data.error || 'Error al cargar canchas';
			}
		} catch (err) {
			console.error('Error:', err);
			error = 'Error de conexión con el servidor';
		} finally {
			loading = false;
		}
	}

	function displayCourtsOnMap() {
		// Limpiar marcadores anteriores
		courtMarkers.forEach(marker => marker.remove());
		courtMarkers = [];

		// Agregar marcadores de canchas
		courts.forEach(court => {
			if (court.store.latitude && court.store.longitude) {
				// Icono de pelota de fútbol
				const courtIcon = L.icon({
					iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
					shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
					iconSize: [25, 41],
					iconAnchor: [12, 41],
					popupAnchor: [1, -34],
					shadowSize: [41, 41]
				});

				const marker = L.marker([court.store.latitude, court.store.longitude], {
					icon: courtIcon
				}).addTo(map);

				// Popup con información
				const popupContent = `
					<div style="min-width: 200px;">
						<h6 style="margin-bottom: 8px;">
							<strong>⚽ ${court.name}</strong>
						</h6>
						<p style="margin: 4px 0; font-size: 13px;">
							<strong>Complejo:</strong> ${court.store.name}
						</p>
						<p style="margin: 4px 0; font-size: 13px;">
							<strong>Tipo:</strong> ${court.type}
						</p>
						<p style="margin: 4px 0; font-size: 13px;">
							<strong>Precio:</strong> $${court.pricePerHour.toLocaleString('es-CO')} COP/hora
						</p>
						${court.distance ? `<p style="margin: 4px 0; font-size: 13px;">
							<strong>Distancia:</strong> ${court.distance} km
						</p>` : ''}
						${court.store.address ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">
							📍 ${court.store.address}
						</p>` : ''}
						<div style="margin-top: 10px;">
							<a href="/courts/${court.id}/reserve" 
							   style="display: inline-block; padding: 6px 12px; background: #228B22; color: white; text-decoration: none; border-radius: 4px; font-size: 13px;">
								Reservar
							</a>
						</div>
					</div>
				`;

				marker.bindPopup(popupContent);
				courtMarkers.push(marker);
			}
		});
	}

	async function applyFilters() {
		if (userLocation) {
			await loadNearbyCourts();
		} else {
			await loadAllCourts();
		}
	}

	function clearFilters() {
		selectedType = '';
		maxPrice = '';
		radius = 5;
		applyFilters();
	}

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});
</script>

<div class="container-fluid py-4">
	<!-- Header -->
	<div class="row mb-3">
		<div class="col-12">
			<div class="card shadow border-0">
				<div class="card-body p-3">
					<div class="d-flex justify-content-between align-items-center">
						<div>
							<h4 class="mb-0">
								<i class="bi bi-map text-success"></i>
								Mapa de Canchas
							</h4>
						</div>
						<button class="btn btn-outline-success" on:click={() => goto('/dashboard')}>
							<i class="bi bi-arrow-left"></i>
							Volver
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="row">
		<!-- Mapa -->
		<div class="col-lg-9 mb-3">
			<div class="card shadow border-0">
				<div class="card-body p-0">
					{#if loading}
						<div class="text-center py-5">
							<div class="spinner-border text-success" role="status">
								<span class="visually-hidden">Cargando...</span>
							</div>
							<p class="mt-2">Cargando canchas...</p>
						</div>
					{/if}

					{#if error}
						<div class="alert alert-warning m-3" role="alert">
							<i class="bi bi-exclamation-triangle"></i>
							{error}
						</div>
					{/if}

					<div bind:this={mapContainer} style="height: 600px; width: 100%;"></div>
				</div>
			</div>
		</div>

		<!-- Sidebar -->
		<div class="col-lg-3">
			<!-- Filtros -->
			<div class="card shadow border-0 mb-3">
				<div class="card-body">
					<h6 class="card-title">
						<i class="bi bi-funnel"></i>
						Filtros
					</h6>

					<!-- Radio -->
					{#if userLocation}
						<div class="mb-3">
							<label for="radius" class="form-label">
								Radio: {radius} km
							</label>
							<input
								type="range"
								class="form-range"
								id="radius"
								bind:value={radius}
								min="1"
								max="20"
								step="1"
								on:change={applyFilters}
							/>
						</div>
					{/if}

					<!-- Tipo -->
					<div class="mb-3">
						<label for="type" class="form-label">Tipo de Cancha</label>
						<select class="form-select" id="type" bind:value={selectedType} on:change={applyFilters}>
							<option value="">Todas</option>
							{#each courtTypes as type}
								<option value={type}>{type}</option>
							{/each}
						</select>
					</div>

					<!-- Precio -->
					<div class="mb-3">
						<label for="maxPrice" class="form-label">Precio Máximo</label>
						<input
							type="number"
							class="form-control"
							id="maxPrice"
							bind:value={maxPrice}
							placeholder="Ej: 60000"
							step="5000"
							on:change={applyFilters}
						/>
					</div>

					<button class="btn btn-outline-secondary btn-sm w-100" on:click={clearFilters}>
						<i class="bi bi-x-circle"></i>
						Limpiar Filtros
					</button>
				</div>
			</div>

			<!-- Lista de Canchas -->
			<div class="card shadow border-0">
				<div class="card-body">
					<h6 class="card-title">
						<i class="bi bi-list-ul"></i>
						Canchas Encontradas ({courts.length})
					</h6>

					<div style="max-height: 400px; overflow-y: auto;">
						{#if courts.length === 0}
							<p class="text-muted small">No se encontraron canchas</p>
						{:else}
							{#each courts as court}
								<div class="border-bottom py-2">
									<div class="d-flex justify-content-between align-items-start">
										<div>
											<strong class="small">{court.name}</strong>
											<br />
											<small class="text-muted">{court.store.name}</small>
											<br />
											<small class="text-success">
												${court.pricePerHour.toLocaleString('es-CO')}
											</small>
											{#if court.distance}
												<br />
												<small class="text-muted">
													📍 {court.distance} km
												</small>
											{/if}
										</div>
										<a href="/courts/{court.id}/reserve" class="btn btn-success btn-sm">
											Reservar
										</a>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(.leaflet-container) {
		font-family: inherit;
	}
</style>
