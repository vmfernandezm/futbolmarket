<script>
	import { goto } from '$app/navigation';

	let email = '';
	let password = '';
	let error = '';
	let loading = false;

	async function handleLogin() {
		console.log('🔍 handleLogin llamado');
		console.log('📧 Email:', email);
		console.log('🔒 Password length:', password.length);
		
		error = '';
		loading = true;

		try {
			console.log('📡 Enviando request a API...');
			const response = await fetch('http://localhost:3001/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			console.log('📊 Response status:', response.status);
			const data = await response.json();
			console.log('📦 Response data:', data);

			if (response.ok) {
				console.log('✅ Login exitoso, guardando en localStorage...');
				localStorage.setItem('token', data.token);
				localStorage.setItem('user', JSON.stringify(data.user));
				console.log('🚀 Redirigiendo a /dashboard...');
				goto('/dashboard');
			} else {
				console.log('❌ Login falló:', data.error);
				error = data.error || 'Error al iniciar sesión';
			}
		} catch (err) {
			console.error('❌ Error catch:', err);
			error = 'Error de conexión con el servidor';
		} finally {
			loading = false;
			console.log('✅ handleLogin terminado');
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
						<p class="text-muted">Inicia sesión en tu cuenta</p>
					</div>

					{#if error}
						<div class="alert alert-danger" role="alert">
							<i class="bi bi-exclamation-triangle-fill"></i>
							{error}
						</div>
					{/if}

					<form on:submit|preventDefault={handleLogin}>
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
								placeholder="••••••••"
							/>
						</div>

						<button
							type="submit"
							class="btn btn-success w-100 mb-3"
							disabled={loading}
						>
							{#if loading}
								<span class="spinner-border spinner-border-sm me-2"></span>
								Iniciando sesión...
							{:else}
								<i class="bi bi-box-arrow-in-right"></i>
								Iniciar Sesión
							{/if}
						</button>
					</form>

					<!-- Divider -->
					<div class="position-relative my-4">
						<hr />
						<span class="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted">
							o continúa con
						</span>
					</div>

					<!-- OAuth Buttons -->
					<div class="d-grid gap-2 mb-3">
						<a
							href="http://localhost:3001/api/oauth/google"
							class="btn btn-outline-danger d-flex align-items-center justify-content-center"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-google me-2" viewBox="0 0 16 16">
								<path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/>
							</svg>
							Iniciar sesión con Google
						</a>

						<a
							href="http://localhost:3001/api/oauth/facebook"
							class="btn btn-outline-primary d-flex align-items-center justify-content-center"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-facebook me-2" viewBox="0 0 16 16">
								<path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
							</svg>
							Iniciar sesión con Facebook
						</a>
					</div>

					<div class="text-center">
						<p class="text-muted mb-0">
							¿No tienes cuenta?
							<a href="/register" class="text-success fw-bold">Regístrate aquí</a>
						</p>
					</div>

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
