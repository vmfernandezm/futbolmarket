<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let user = null;
	let store = null;
	let users = [];
	let loading = true;
	let submitting = false;
	let error = '';
	let success = '';
	let selectedUserId = '';

	$: storeId = $page.params.id;

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

		await loadData();
	});

	async function loadData() {
		try {
			loading = true;
			const token = localStorage.getItem('token');

			// Cargar store
			const storeResponse = await fetch(`http://localhost:3001/api/stores/${storeId}`, {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			const storeData = await storeResponse.json();
			
			if (storeResponse.ok) {
				store = storeData.store;
			}

			// Cargar usuarios disponibles (store_owners sin complejo asignado)
			const usersResponse = await fetch('http://localhost:3001/api/auth/me', {
				headers: { 'Authorization': `Bearer ${token}` }
			});

			// Por ahora, creamos una lista manual con el usuario que acabamos de crear
			// En producción, necesitarías un endpoint para listar usuarios
			users = [
				{
					id: 'f9339c0b-981f-4d30-a3f3-e9f46525e5ea',
					email: 'dueno@futbolmarket.com',
					displayName: 'Juan Pérez - Dueño',
					role: 'store_owner'
				}
			];

		} catch (err) {
			console.error('Error:', err);
			error = 'Error al cargar los datos';
		} finally {
			loading = false;
		}
	}

	async function handleAssign() {
		if (!selectedUserId) {
			error = 'Debes seleccionar un usuario';
			return;
		}

		error = '';
		success = '';
		submitting = true;

		try {
			const token = localStorage.getItem('token');
			const selectedUser = users.find(u => u.id === selectedUserId);

			const response = await fetch(`http://localhost:3001/api/stores/${storeId}/assign-owner`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					ownerId: selectedUserId,
					ownerEmail: selectedUser.email
				})
			});

			const data = await response.json();

			if (response.ok) {
				success = 'Dueño asignado exitosamente';
				setTimeout(() => {
					goto('/stores');
				}, 2000);
			} else {
				error = data.error || 'Error al asignar dueño';
			}
		} catch (err) {
			console.error('Error:', err);
			error = 'Error de conexión con el servidor';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="container py-5">
	<div class="row justify-content-center">
		<div class="col-lg-6">
			<!-- Header -->
			<div class="mb-4">
				<button on:click={() => goto('/stores')} class="btn btn-outline-light mb-3">
					<i class="bi bi-arrow-left"></i>
					Volver a Complejos
				</button>
				<h1 class="text-white">
					<i class="bi bi-person-plus text-success"></i>
					Asignar Dueño
				</h1>
				<p class="text-white-50">Asigna un dueño al complejo deportivo</p>
			</div>

			{#if loading}
				<div class="text-center py-5">
					<div class="spinner-border text-white" role="status">
						<span class="visually-hidden">Cargando...</span>
					</div>
				</div>
			{:else}
				<!-- Store Info Card -->
				{#if store}
					<div class="card shadow-lg border-0 mb-4">
						<div class="card-body">
							<h5 class="card-title">
								<i class="bi bi-building text-success"></i>
								{store.name}
							</h5>
							<p class="text-muted mb-2">
								<i class="bi bi-geo-alt"></i>
								{store.location}
							</p>
							<p class="text-muted mb-0">
								<i class="bi bi-pin-map"></i>
								{store.city}, {store.department}
							</p>
						</div>
					</div>
				{/if}

				<!-- Assign Form Card -->
				<div class="card shadow-lg border-0">
					<div class="card-body p-4">
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

						<form on:submit|preventDefault={handleAssign}>
							<div class="mb-4">
								<label for="owner" class="form-label fw-bold">
									<i class="bi bi-person-check text-success"></i>
									Seleccionar Dueño
								</label>
								<select
									class="form-select form-select-lg"
									id="owner"
									bind:value={selectedUserId}
									required
								>
									<option value="">-- Selecciona un usuario --</option>
									{#each users as u}
										<option value={u.id}>
											{u.displayName} ({u.email})
										</option>
									{/each}
								</select>
								<small class="text-muted">
									Solo se muestran usuarios con rol "store_owner" sin complejo asignado
								</small>
							</div>

							<div class="alert alert-info">
								<i class="bi bi-info-circle"></i>
								<strong>Nota:</strong> Una vez asignado, este usuario podrá gestionar las canchas y reservas de este complejo.
							</div>

							<div class="d-grid gap-2">
								<button
									type="submit"
									class="btn btn-success btn-lg"
									disabled={submitting}
								>
									{#if submitting}
										<span class="spinner-border spinner-border-sm me-2"></span>
										Asignando...
									{:else}
										<i class="bi bi-check-circle"></i>
										Asignar Dueño
									{/if}
								</button>
								<button
									type="button"
									class="btn btn-outline-secondary"
									on:click={() => goto('/stores')}
									disabled={submitting}
								>
									Cancelar
								</button>
							</div>
						</form>
					</div>
				</div>

				<!-- Credentials Info -->
				<div class="card shadow border-0 mt-4 bg-dark text-white">
					<div class="card-body">
						<h6 class="card-title">
							<i class="bi bi-key"></i>
							Credenciales del Dueño Creado
						</h6>
						<hr class="border-light" />
						<p class="mb-1"><strong>Email:</strong> dueno@futbolmarket.com</p>
						<p class="mb-0"><strong>Contraseña:</strong> Dueno123456</p>
						<small class="text-muted">Comparte estas credenciales con el dueño del complejo</small>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
