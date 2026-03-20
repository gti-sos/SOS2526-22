<script>
    import { onMount } from 'svelte';
    import { page } from '$app/state'; // Requisito Svelte 5 para rutas [cite: 747]

    // Obtenemos los parámetros de la URL dinámicamente
    const { country, year } = page.params;
    const API_URL = `/api/v2/co2-emission-gap-among-countries-clustering-pca/${country}/${year}`;

    let emission = $state({
        country: "", year: 0, savanna_fire: 0, forest_fire: 0, crop_residues: 0,
        rice_cultivation: 0, drained_organic: 0, pesticides_manufacturing: 0, food_transport: 0
    });
    let message = $state("");
    let messageType = $state("");

    onMount(async () => {
        const res = await fetch(API_URL);
        if (res.ok) {
            emission = await res.json();
        } else {
            message = "Error: No se encuentra el recurso.";
            messageType = "error";
        }
    });

    async function updateEmission() {
        const res = await fetch(API_URL, {
            method: "PUT",
            body: JSON.stringify(emission),
            headers: { "Content-Type": "application/json" }
        });

        if (res.ok) {
            message = "Recurso actualizado con éxito.";
            messageType = "success";
        } else {
            message = "Error al actualizar. Verifica los campos.";
            messageType = "error";
        }
    }
</script>

<main class="container">
    <h1>✏️ Editar: {country} ({year})</h1>

    {#if message}
        <div class="msg msg-{messageType}">{message}</div>
    {/if}

    <section class="card">
        <div class="form-grid">
            <label>Savanna Fire: <input type="number" bind:value={emission.savanna_fire} /></label>
            <label>Forest Fire: <input type="number" bind:value={emission.forest_fire} /></label>
            <label>Crop Residues: <input type="number" bind:value={emission.crop_residues} /></label>
            <label>Rice Cultivation: <input type="number" bind:value={emission.rice_cultivation} /></label>
            <label>Drained Organic: <input type="number" bind:value={emission.drained_organic} /></label>
            <label>Pesticides: <input type="number" bind:value={emission.pesticides_manufacturing} /></label>
            <label>Food Transport: <input type="number" bind:value={emission.food_transport} /></label>
        </div>
        
        <div class="actions">
            <button onclick={updateEmission} class="btn-submit">💾 Guardar Cambios</button>
            <a href="/co2-emissions-stats" class="btn-back">⬅️ Volver</a>
        </div>
    </section>
</main>

<style>
    /* Estilos básicos para que combine con el resto */
    .container { max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
    .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
    .form-grid label { display: flex; flex-direction: column; font-weight: bold; }
    input { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    .msg { padding: 10px; margin-bottom: 15px; border-radius: 4px; text-align: center; }
    .msg-success { background: #d4edda; color: #155724; }
    .msg-error { background: #f8d7da; color: #721c24; }
    .btn-submit { background: #2a9d8f; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
    .btn-back { text-decoration: none; color: #666; margin-left: 10px; }
</style>