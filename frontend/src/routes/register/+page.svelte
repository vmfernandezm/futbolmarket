<script>
	import { goto } from '\$app/navigation';
	import { API_URL } from '\$lib/config';

	let email = '';
	let password = '';
	let displayName = '';
	let error = '';
	let loading = false;

	async function handleRegister() {
		error = '';
		loading = true;

		try {
			const response = await fetch(`${API_URL}/api/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, displayName })
			});

			const data = await response.json();

			if (response.ok) {
				localStorage.setItem('token', data.token);
				localStorage.setItem('user', JSON.stringify(data.user));
				goto('/dashboard');
			} else {
				error = data.error || 'Error al registrarse';
			}
		} catch (err) {
			error = 'Error de conexión con el servidor';
			console.error(err);
		} finally {
			loading = false;
		}
	}
</script>

<div class="container">
	<div class="row justify-content-center align-items-center min-vh-100">
		<div class="col-md-5">
			<div class="card shadow-lg border-0">
				<div class="card-body p-5">
					<div class="text-center mb-4">
						<h2 class="fw-bold text-success">
							<i class="bi bi-trophy-fill"></i>
							FútbolMarket
						</h2>
						<p class="text-muted">Crea tu cuenta</p>
					</div>

					{#if error}
						<div class="alert alert-danger" role="alert">
							<i class="bi bi-exclamation-triangle-fill"></i>
							{error}
						</div>
					{/if}

					<form on:submit|preventDefault={handleRegister}>
						<div class="mb-3">
							<label for="displayName" class="form-label">Nombre Completo</label>
							<input
								type="text"
								class="form-control"
								id="displayName"
								bind:value={displayName}
								required
								placeholder="Juan Pérez"
							/>
						</div>

						<div class="mb-3">
							<label for="email" class="form-label">Email</label>
							<input
								type="email"
								class="form-control"
								id="email"
								bind:value={email}
								required
								placeholder="tu@email.com"
							/>
						</div>

						<div class="mb-4">
							<label for="password" class="form-label">Contraseña</label>
							<input
								type="password"
								class="form-control"
								id="password"
								bind:value={password}
								required
								minlength="6"
								placeholder="Mínimo 6 caracteres"
							/>
							<small class="text-muted">Mínimo 6 caracteres</small>
						</div>

						<button
							type="submit"
							class="btn btn-success w-100 mb-3"
							disabled={loading}
						>
							{#if loading}
								<span class="spinner-border spinner-border-sm me-2"></span>
								Creando cuenta...
							{:else}
								<i class="bi bi-person-plus-fill"></i>
								Crear Cuenta
							{/if}
						</button>

						<div class="text-center">
							<p class="text-muted mb-0">
								¿Ya tienes cuenta?
								<a href="/login" class="text-success fw-bold">Inicia sesión aquí</a>
							</p>
						</div>
					</form>

					<hr class="my-4" />

					<div class="text-center">
						<a href="/" class="text-muted">
							<i class="bi bi-arrow-left"></i>
							Volver al inicio
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
