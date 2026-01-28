<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let user = null;
	let loading = false;
	let error = '';
	let success = '';

	// Form fields
	let name = '';
	let description = '';
	let location = '';
	let phone = '';
	let city = 'Pasto';
	let department = 'Nariño';

	onMount(() => {
		const userData = localStorage.getItem('user');
		const token = localStorage.getItem('token');

		if (!userData || !token) {
			goto('/login');
			return;
		}

		user = JSON.parse(userData);

		if (user.role !== 'super_admin') {
			goto('/dashboard');
		}
	});

	async function handleSubmit() {
		error = '';
		success = '';
		loading = true;

		try {
			const token = localStorage.getItem('token');

			const response = await fetch('http://localhost:3001/api/stores', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					name,
					description,
					location,
					phone,
					city,
					department
				})
			});

			const data = await response.json();

			if (response.ok) {
				success = 'Complejo creado exitosamente';
				console.log('✅ Store creado:', data.store);
				
				// Limpiar formulario
				name = '';
				description = '';
				location = '';
				phone = '';
				city = 'Pasto';
				department = 'Nariño';

				// Redirigir después de 2 segundos
				setTimeout(() => {
					goto('/stores');
				}, 2000);
			} else {
				error = data.error || 'Error al crear el complejo';
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
					Crear Nuevo Complejo Deportivo
				</h1>
				<p class="text-white-50">Completa el formulario para agregar un nuevo complejo al sistema</p>
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
								<i class="bi bi-building text-success"></i>
								Nombre del Complejo *
							</label>
							<input
								type="text"
								class="form-control form-control-lg"
								id="name"
								bind:value={name}
								required
								placeholder="Ej: Complejo Deportivo Norte"
							/>
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
								placeholder="Describe el complejo deportivo..."
							></textarea>
							<small class="text-muted">Opcional</small>
						</div>

						<!-- Ubicación -->
						<div class="mb-4">
							<label for="location" class="form-label fw-bold">
								<i class="bi bi-geo-alt text-success"></i>
								Dirección *
							</label>
							<input
								type="text"
								class="form-control form-control-lg"
								id="location"
								bind:value={location}
								required
								placeholder="Ej: Calle 10 #20-30"
							/>
						</div>

						<!-- Ciudad y Departamento -->
						<div class="row mb-4">
							<div class="col-md-6">
								<label for="city" class="form-label fw-bold">
									<i class="bi bi-pin-map text-success"></i>
									Ciudad *
								</label>
								<input
									type="text"
									class="form-control"
									id="city"
									bind:value={city}
									required
									placeholder="Ej: Pasto"
								/>
							</div>
							<div class="col-md-6">
								<label for="department" class="form-label fw-bold">
									<i class="bi bi-map text-success"></i>
									Departamento *
								</label>
								<input
									type="text"
									class="form-control"
									id="department"
									bind:value={department}
									required
									placeholder="Ej: Nariño"
								/>
							</div>
						</div>

						<!-- Teléfono -->
						<div class="mb-4">
							<label for="phone" class="form-label fw-bold">
								<i class="bi bi-telephone text-success"></i>
								Teléfono
							</label>
							<input
								type="tel"
								class="form-control"
								id="phone"
								bind:value={phone}
								placeholder="Ej: +57 300 123 4567"
							/>
							<small class="text-muted">Opcional</small>
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
									Crear Complejo
								{/if}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
</div>
