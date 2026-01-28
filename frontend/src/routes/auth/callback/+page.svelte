<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let loading = true;
	let error = '';

	onMount(() => {
		// Obtener parámetros de la URL
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get('token');
		const userStr = urlParams.get('user');
		const errorParam = urlParams.get('error');

		if (errorParam) {
			if (errorParam === 'oauth_failed') {
				error = 'Error al autenticar con el proveedor. Intenta nuevamente.';
			} else if (errorParam === 'no_email') {
				error = 'No se pudo obtener tu email. Por favor, verifica los permisos de la aplicación.';
			} else {
				error = 'Error desconocido durante la autenticación.';
			}
			loading = false;
			setTimeout(() => goto('/login'), 3000);
			return;
		}

		if (token && userStr) {
			try {
				const user = JSON.parse(decodeURIComponent(userStr));

				// Guardar en localStorage
				localStorage.setItem('token', token);
				localStorage.setItem('user', JSON.stringify(user));

				// Redirigir al dashboard
				setTimeout(() => {
					goto('/dashboard');
				}, 1000);
			} catch (err) {
				console.error('Error parsing user data:', err);
				error = 'Error al procesar los datos del usuario';
				loading = false;
				setTimeout(() => goto('/login'), 3000);
			}
		} else {
			error = 'No se recibieron credenciales válidas';
			loading = false;
			setTimeout(() => goto('/login'), 3000);
		}
	});
</script>

<div class="container py-5">
	<div class="row justify-content-center">
		<div class="col-md-6">
			<div class="card shadow-lg border-0">
				<div class="card-body p-5 text-center">
					{#if loading && !error}
						<div class="mb-4">
							<div class="spinner-border text-success" style="width: 3rem; height: 3rem;" role="status">
								<span class="visually-hidden">Cargando...</span>
							</div>
						</div>
						<h4 class="mb-3">Autenticando...</h4>
						<p class="text-muted">Por favor espera mientras completamos tu inicio de sesión</p>
					{:else if error}
						<div class="mb-4">
							<i class="bi bi-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
						</div>
						<h4 class="mb-3 text-danger">Error de Autenticación</h4>
						<p class="text-muted">{error}</p>
						<p class="text-muted small">Serás redirigido al login en unos segundos...</p>
					{:else}
						<div class="mb-4">
							<i class="bi bi-check-circle text-success" style="font-size: 3rem;"></i>
						</div>
						<h4 class="mb-3 text-success">¡Autenticación Exitosa!</h4>
						<p class="text-muted">Redirigiendo al dashboard...</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
