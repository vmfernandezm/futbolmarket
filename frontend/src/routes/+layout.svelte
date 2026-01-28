<script>
	import 'bootstrap/dist/css/bootstrap.min.css';
	import 'bootstrap-icons/font/bootstrap-icons.css';
	import { onMount } from 'svelte';

	onMount(() => {
		import('bootstrap/dist/js/bootstrap.bundle.min.js');
	});
</script>

<style>
	:global(body) {
		background: linear-gradient(135deg, #1a5f1a 0%, #2d8b2d 100%);
		min-height: 100vh;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	}

	:global(.btn-success) {
		background: linear-gradient(135deg, #228B22 0%, #32CD32 100%);
		border: none;
	}

	:global(.btn-success:hover) {
		background: linear-gradient(135deg, #1a6b1a 0%, #28a428 100%);
	}
</style>

<slot />
