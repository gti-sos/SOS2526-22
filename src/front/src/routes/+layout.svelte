<script>
	import favicon from '$lib/assets/favicon.svg';
	import Header from './Header.svelte';
	import Footer from './Footer.svelte';
	import 'bootstrap/dist/css/bootstrap.min.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>


<Header></Header>
<hr>
<main class="container"> {@render children()}
</main>
<hr>
<Footer></Footer>
