<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';

    const country = $page.params.country;
    const year = $page.params.year;
    
    // API V2
    const API_URL = `/api/v2/global-agriculture-climate-impacts/${country}/${year}`;

    let dato = $state({ country: country, year: year, crop_type: '', average_temperature_c: '', total_precipitation_mm: '' });
    
    let mensaje = $state('');
    let esError = $state(false);

    function mostrarMensaje(texto, error = false) { mensaje = texto; esError = error; }

    async function getDatoInfo() {
        try {
            const res = await fetch(API_URL);
            if (res.ok) {
                dato = { ...dato, ...(await res.json()) };
            } else {
                mostrarMensaje(res.status === 404 ? `No existe el registro de ${country}.` : "Error de servidor.", true);
            }
        } catch (error) { mostrarMensaje("Fallo de conexión.", true); }
    }

    async function guardarCambios(event) {
        event.preventDefault();
        const payload = {
            country: dato.country, year: parseInt(dato.year), crop_type: dato.crop_type,
            average_temperature_c: parseFloat(dato.average_temperature_c), total_precipitation_mm: parseFloat(dato.total_precipitation_mm)
        };
        try {
            const res = await fetch(API_URL, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            if (res.ok) mostrarMensaje(`Datos modificados correctamente.`);
            else mostrarMensaje("Error: Faltan datos o formato incorrecto.", true);
        } catch (error) { mostrarMensaje("Fallo al guardar.", true); }
    }

    onMount(getDatoInfo);
</script>

<main class="container">
    <div class="card">
        <h1>✏️ Modificar Registro (v2)</h1>

        {#if mensaje} <div class="msg {esError ? 'error' : 'success'}">{mensaje}</div> {/if}

        <form onsubmit={guardarCambios} class="form-grid">
            <div class="field"><label>País:</label><input type="text" value={dato.country} disabled class="bloqueado"></div>
            <div class="field"><label>Año:</label><input type="number" value={dato.year} disabled class="bloqueado"></div>
            <div class="field"><label>Cultivo:</label><input type="text" bind:value={dato.crop_type} required></div>
            <div class="field"><label>Temperatura (ºC):</label><input type="number" step="any" bind:value={dato.average_temperature_c} required></div>
            <div class="field"><label>Precipitaciones (mm):</label><input type="number" step="any" bind:value={dato.total_precipitation_mm} required></div>

            <div class="botones">
                <button type="submit" class="btn-guardar">Guardar</button>
                <a class="btn-volver" href="/global-agriculture-climate-impacts">Volver</a>
            </div>
        </form>
    </div>
</main>

<style>
    .container { max-width: 500px; margin: 40px auto; font-family: sans-serif; padding: 20px;}
    .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
    h1 { color: #2c7da0; text-align: center; border-bottom: 2px solid #eee; padding-bottom: 15px; }
    .msg { padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: bold; }
    .success { background: #d4edda; color: #155724; } .error { background: #f8d7da; color: #721c24; }
    .form-grid { display: flex; flex-direction: column; gap: 15px; }
    .field { display: flex; flex-direction: column; gap: 5px; }
    label { font-weight: bold; font-size: 0.9em; }
    input { padding: 10px; border: 1px solid #ccc; border-radius: 6px; }
    .bloqueado { background: #f5f5f5; cursor: not-allowed; }
    .botones { display: flex; gap: 10px; margin-top: 15px; }
    button, .btn-volver { padding: 12px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; text-align: center; flex: 1; color: white; text-decoration: none; }
    .btn-guardar { background: #27ae60; } .btn-volver { background: #6c757d; }
</style>