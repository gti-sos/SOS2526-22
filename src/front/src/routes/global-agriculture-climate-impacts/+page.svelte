<script>
    // @ts-nocheck
    import { dev } from "$app/environment";
    import { onMount } from 'svelte';

    // --- ESTADOS REACTIVOS ---
    let recursos = $state([]);
    let loading = $state(false);
    let error = $state(null);
    let successMessage = $state(null);
    let version = $state('v2'); 

    // Paginación y Visibilidad de Formularios
    let currentPage = $state(1);
    let itemsPerPage = $state(5);
    let showCreateForm = $state(false);
    let showEditForm = $state(false);
    let editando = $state(null);

    // --- BÚSQUEDA POR CAMPOS ---
    let filtros = $state({ country: '', year: '', crop_type: '', average_temperature_c: '', total_precipitation_mm: '' });

    // --- DATOS DE FORMULARIOS ---
    let newForm = $state({ country: '', year: '', crop_type: '', average_temperature_c: '', total_precipitation_mm: '' });
    let editForm = $state({ country: '', year: '', crop_type: '', average_temperature_c: '', total_precipitation_mm: '' });

    function getApiUrl() {
        let base = `/api/${version}/global-agriculture-climate-impacts`;
        if (dev) base = 'http://localhost:3000' + base;
        return base;
    }

    function limpiarMensajes() {
        setTimeout(() => { error = null; successMessage = null; }, 4000);
    }

    // --- GET (Cargar con filtros y paginación) ---
    async function cargarRecursos(page = 1) {
        loading = true;
        currentPage = page;
        let offset = (page - 1) * itemsPerPage;
        
        let query = `?offset=${offset}&limit=${itemsPerPage}`;
        if (filtros.country) query += `&country=${filtros.country.toLowerCase()}`;
        if (filtros.year) query += `&year=${filtros.year}`;
        if (filtros.crop_type) query += `&crop_type=${filtros.crop_type.toLowerCase()}`;

        try {
            const res = await fetch(getApiUrl() + query);
            recursos = res.ok ? await res.json() : [];
        } catch (e) { error = "Error de conexión"; }
        finally { loading = false; }
    }

    // --- POST (Crear) ---
    async function crearRecurso() {
        if (version !== 'v2') return error = "v1 es solo lectura";
        try {
            const res = await fetch(getApiUrl(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newForm,
                    year: parseInt(newForm.year),
                    average_temperature_c: parseFloat(newForm.average_temperature_c),
                    total_precipitation_mm: parseFloat(newForm.total_precipitation_mm)
                })
            });
            if (res.ok) {
                successMessage = "Recurso creado";
                showCreateForm = false;
                newForm = { country: '', year: '', crop_type: '', average_temperature_c: '', total_precipitation_mm: '' };
                cargarRecursos(1);
            } else { error = "Error: Datos inválidos o ya existentes"; }
        } catch (e) { error = "Error al crear"; }
        limpiarMensajes();
    }

    // --- PUT (Actualizar) ---
    function abrirEditor(recurso) {
        editando = recurso;
        editForm = { ...recurso };
        showEditForm = true;
        showCreateForm = false;
    }

    async function guardarEdicion() {
        try {
            const res = await fetch(`${getApiUrl()}/${editando.country}/${editando.year}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editForm,
                    year: parseInt(editForm.year),
                    average_temperature_c: parseFloat(editForm.average_temperature_c),
                    total_precipitation_mm: parseFloat(editForm.total_precipitation_mm)
                })
            });
            if (res.ok) {
                successMessage = "Actualizado correctamente";
                showEditForm = false;
                cargarRecursos(currentPage);
            } else { error = "Error al actualizar"; }
        } catch (e) { error = "Fallo de red"; }
        limpiarMensajes();
    }

    // --- DELETE (Uno y Todos) ---
    async function eliminarUno(recurso) {
        if (!confirm(`¿Borrar ${recurso.country} ${recurso.year}?`)) return;
        const res = await fetch(`${getApiUrl()}/${recurso.country}/${recurso.year}`, { method: 'DELETE' });
        if (res.ok) { successMessage = "Eliminado"; cargarRecursos(currentPage); }
        limpiarMensajes();
    }

    async function eliminarTodo() {
        if (!confirm("¿BORRAR TODA LA COLECCIÓN?")) return;
        await fetch(getApiUrl(), { method: 'DELETE' });
        successMessage = "Base de datos vaciada";
        cargarRecursos(1);
        limpiarMensajes();
    }

    onMount(() => cargarRecursos(1));
    $effect(() => { version; cargarRecursos(1); });
</script>

<div class="container">
    <div class="header-box">
        <h1>🌱 Panel Agricultura V2</h1>
        <select bind:value={version} class="select-version">
            <option value="v1">Modo Lectura (v1)</option>
            <option value="v2">Modo Edición (v2)</option>
        </select>
    </div>

    {#if error} <div class="msg error">{error}</div> {/if}
    {#if successMessage} <div class="msg success">{successMessage}</div> {/if}

    <div class="actions">
        <button onclick={() => fetch(getApiUrl()+'/loadInitialData').then(()=>cargarRecursos(1))} class="btn-sample">📥 Datos Iniciales</button>
        {#if version === 'v2'}
            <button onclick={() => {showCreateForm = !showCreateForm; showEditForm = false;}} class="btn-post">➕ Nuevo Registro</button>
            <button onclick={eliminarTodo} class="btn-delete-all">🗑️ Borrar Todo</button>
        {/if}
    </div>

    {#if showCreateForm}
        <div class="card form-box">
            <h3>Añadir Nuevo</h3>
            <div class="grid-inputs">
                <input bind:value={newForm.country} placeholder="País">
                <input type="number" bind:value={newForm.year} placeholder="Año">
                <input bind:value={newForm.crop_type} placeholder="Cultivo">
                <input type="number" step="any" bind:value={newForm.average_temperature_c} placeholder="Temp">
                <input type="number" step="any" bind:value={newForm.total_precipitation_mm} placeholder="Prec">
                <button onclick={crearRecurso} class="btn-save">Guardar POST</button>
            </div>
        </div>
    {/if}

    {#if showEditForm}
        <div class="card form-box edit">
            <h3>Editando {editando.country} ({editando.year})</h3>
            <div class="grid-inputs">
                <input value={editForm.country} disabled class="locked">
                <input value={editForm.year} disabled class="locked">
                <input bind:value={editForm.crop_type} placeholder="Cultivo">
                <input type="number" step="any" bind:value={editForm.average_temperature_c} placeholder="Temp">
                <input type="number" step="any" bind:value={editForm.total_precipitation_mm} placeholder="Prec">
                <button onclick={guardarEdicion} class="btn-save">Actualizar PUT</button>
                <button onclick={() => showEditForm = false} class="btn-cancel">X</button>
            </div>
        </div>
    {/if}

    <section class="card table-container">
        <table>
            <thead>
                <tr>
                    <th>País</th><th>Año</th><th>Cultivo</th><th>Temp</th><th>Prec.</th><th>Acciones</th>
                </tr>
                <tr class="filter-row">
                    <td><input bind:value={filtros.country} oninput={() => cargarRecursos(1)} placeholder="🔎"></td>
                    <td><input bind:value={filtros.year} oninput={() => cargarRecursos(1)} placeholder="🔎"></td>
                    <td><input bind:value={filtros.crop_type} oninput={() => cargarRecursos(1)} placeholder="🔎"></td>
                    <td colspan="2">Filtros activos</td>
                    <td><button onclick={()=>{filtros={country:'',year:'',crop_type:''}; cargarRecursos(1)}} class="btn-clear">Reset</button></td>
                </tr>
            </thead>
            <tbody>
                {#each recursos as r}
                    <tr>
                        <td>{r.country}</td><td>{r.year}</td><td>{r.crop_type}</td>
                        <td>{r.average_temperature_c}º</td><td>{r.total_precipitation_mm}mm</td>
                        <td class="cell-actions">
                            {#if version === 'v2'}
                                <button onclick={() => abrirEditor(r)} class="btn-edit">✏️</button>
                                <button onclick={() => eliminarUno(r)} class="btn-del">🗑️</button>
                            {:else}
                                <span>🔒</span>
                            {/if}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>

        <div class="pagination">
            <button disabled={currentPage === 1} onclick={() => cargarRecursos(currentPage - 1)}>Anterior</button>
            <span>Página {currentPage}</span>
            <button disabled={recursos.length < itemsPerPage} onclick={() => cargarRecursos(currentPage + 1)}>Siguiente</button>
        </div>
    </section>
</div>

<style>
    .container { max-width: 1000px; margin: 0 auto; padding: 20px; font-family: system-ui; }
    .header-box { display: flex; justify-content: space-between; align-items: center; background: #2c7da0; color: white; padding: 1rem 2rem; border-radius: 12px; margin-bottom: 20px; }
    .card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); padding: 20px; margin-bottom: 20px; }
    .actions { display: flex; gap: 10px; margin-bottom: 20px; }
    
    .grid-inputs { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
    .grid-inputs input { padding: 8px; border: 1px solid #ddd; border-radius: 6px; }
    .locked { background: #f0f0f0; }

    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { text-align: left; padding: 12px; border-bottom: 2px solid #eee; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    .filter-row input { width: 80%; padding: 4px; border: 1px solid #ccc; border-radius: 4px; }

    button { cursor: pointer; border: none; border-radius: 6px; padding: 8px 16px; font-weight: 600; transition: 0.2s; }
    .btn-post { background: #27ae60; color: white; }
    .btn-sample { background: #2a9d8f; color: white; }
    .btn-delete-all { background: #e63946; color: white; }
    .btn-save { background: #2c7da0; color: white; }
    .btn-edit { background: #f39c12; color: white; }
    .btn-del { background: #e74c3c; color: white; }
    
    .msg { padding: 12px; border-radius: 8px; margin-bottom: 15px; text-align: center; font-weight: bold; }
    .error { background: #fee2e2; color: #991b1b; }
    .success { background: #dcfce7; color: #166534; }
    .pagination { display: flex; justify-content: center; gap: 20px; align-items: center; margin-top: 20px; }
</style>