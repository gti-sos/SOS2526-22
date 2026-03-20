<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';

    const country = $page.params.country;
    const year = $page.params.year;
    
    // Conectamos con la API v2
    const API_URL = `/api/v2/global-agriculture-climate-impacts/${country}/${year}`;

    let dato = { country: country, year: year, crop_type: '', average_temperature_c: '', total_precipitation_mm: '' };
    let mensaje = '';
    let esError = false;

    function mostrarMensaje(texto, error = false) {
        mensaje = texto; esError = error;
    }

    async function getDatoInfo() {
        try {
            const res = await fetch(API_URL);
            if (res.ok) dato = await res.json();
            else if (res.status === 404) mostrarMensaje(`No existe el registro de ${country}.`, true);
        } catch (e) { mostrarMensaje("Fallo de conexión con el servidor.", true); }
    }

    async function guardarCambios() {
        try {
            dato.year = parseInt(dato.year);
            dato.average_temperature_c = parseFloat(dato.average_temperature_c);
            dato.total_precipitation_mm = parseFloat(dato.total_precipitation_mm);

            const res = await fetch(API_URL, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dato)
            });

            if (res.ok) mostrarMensaje(`¡Actualizado correctamente!`);
            else if (res.status === 400) mostrarMensaje("Error: Revisa los campos numéricos.", true);
            else mostrarMensaje("Ha ocurrido un error.", true);
        } catch (e) { mostrarMensaje("Fallo de conexión.", true); }
    }

    onMount(getDatoInfo);
</script>

<main class="container">
    <div class="card">
        <h1>✏️ Modificar: {country} ({year})</h1>

        {#if mensaje} <div class="msg {esError ? 'error' : 'success'}">{mensaje}</div> {/if}

        <div class="form">
            <label>País (No modificable): <input type="text" value={dato.country} disabled></label>
            <label>Año (No modificable): <input type="number" value={dato.year} disabled></label>
            
            <label>Tipo de Cultivo: <input type="text" bind:value={dato.crop_type}></label>
            <label>Temperatura Media (ºC): <input type="number" step="any" bind:value={dato.average_temperature_c}></label>
            <label>Precipitaciones Totales (mm): <input type="number" step="any" bind:value={dato.total_precipitation_mm}></label>

            <div class="buttons">
                <button class="btn success" on:click={guardarCambios}>Guardar Cambios</button>
                <a class="btn secondary" href="/global-agriculture-climate-impacts">Volver Atrás</a>
            </div>
        </div>
    </div>
</main>

<style>
    .container { max-width: 600px; margin: 40px auto; font-family: 'Segoe UI', sans-serif; }
    .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    h1 { color: #2c7da0; text-align: center; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 25px; }
    
    .msg { padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: bold; }
    .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

    .form { display: flex; flex-direction: column; gap: 15px; }
    label { font-weight: bold; color: #444; display: flex; flex-direction: column; gap: 5px; }
    input { padding: 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 1em; }
    input:disabled { background: #f5f5f5; color: #888; cursor: not-allowed; }

    .buttons { display: flex; gap: 15px; margin-top: 20px; }
    .btn { padding: 12px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; text-align: center; flex: 1; text-decoration: none; color: white; font-size: 1.1em; }
    .success { background: #27ae60; } .success:hover { background: #219653; }
    .secondary { background: #95a5a6; } .secondary:hover { background: #7f8c8d; }
</style>