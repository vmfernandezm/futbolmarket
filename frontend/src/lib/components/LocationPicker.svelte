<script>
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	export let latitude = 1.2136; // Centro de Pasto por defecto
	export let longitude = -77.2811;
	export let height = '400px';

	const dispatch = createEventDispatcher();

	let map;
	let marker;
	let mapContainer;
	let L;

	onMount(async () => {
		// Importar Leaflet dinámicamente
		L = await import('leaflet');

		// Crear mapa centrado en Pasto
		map = L.map(mapContainer).setView([latitude, longitude], 13);

		// Agregar capa de OpenStreetMap
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© OpenStreetMap contributors',
			maxZoom: 19
		}).addTo(map);

		// Crear icono personalizado para el marcador
		const customIcon = L.icon({
			iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
			shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34],
			shadowSize: [41, 41]
		});

		// Agregar marcador inicial
		marker = L.marker([latitude, longitude], {
			draggable: true,
			icon: customIcon
		}).addTo(map);

		marker.bindPopup('Arrastra el marcador a la ubicación de tu cancha').openPopup();

		// Evento cuando se arrastra el marcador
		marker.on('dragend', function (e) {
			const position = marker.getLatLng();
			dispatch('locationChange', {
				latitude: position.lat,
				longitude: position.lng
			});
		});

		// Evento al hacer clic en el mapa
		map.on('click', function (e) {
			marker.setLatLng(e.latlng);
			dispatch('locationChange', {
				latitude: e.latlng.lat,
				longitude: e.latlng.lng
			});
		});

		// Botón para obtener ubicación actual
		const locateButton = L.control({ position: 'topright' });
		locateButton.onAdd = function () {
			const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
			div.innerHTML = `
				<a href="#" title="Mi ubicación" style="
					background: white;
					width: 30px;
					height: 30px;
					display: flex;
					align-items: center;
					justify-content: center;
					text-decoration: none;
					color: #333;
					font-size: 18px;
				">📍</a>
			`;
			div.onclick = function (e) {
				e.preventDefault();
				getMyLocation();
			};
			return div;
		};
		locateButton.addTo(map);
	});

	function getMyLocation() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const lat = position.coords.latitude;
					const lng = position.coords.longitude;
					
					map.setView([lat, lng], 15);
					marker.setLatLng([lat, lng]);
					
					dispatch('locationChange', {
						latitude: lat,
						longitude: lng
					});
				},
				(error) => {
					alert('No se pudo obtener tu ubicación: ' + error.message);
				}
			);
		} else {
			alert('Tu navegador no soporta geolocalización');
		}
	}

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});

	// Actualizar marcador cuando cambian las props
	$: if (marker && latitude && longitude) {
		marker.setLatLng([latitude, longitude]);
		if (map) {
			map.setView([latitude, longitude], 13);
		}
	}
</script>

<div bind:this={mapContainer} style="height: {height}; width: 100%; border-radius: 8px;"></div>

<style>
	:global(.leaflet-container) {
		font-family: inherit;
	}
</style>
