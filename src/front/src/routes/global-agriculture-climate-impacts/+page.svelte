<script>
    // @ts-nocheck
    import { dev } from "$app/environment";
    import { onMount } from 'svelte';

    // --- ESTADOS REACTIVOS (Svelte 5) ---
    let recursos = $state([]);
    let loading = $state(false);
    let error = $state(null);
    let successMessage = $state(null);

    // Paginación
    let currentPage = $state(1);
    let itemsPerPage = $state(5);

    // Formularios
    let editando = $state(null);
    let showEditForm = $state(false);
    let showCreateForm = $state(false);

    // Datos creación
    let newForm = $state({ country: '', year: '', crop_type: '', average_temperature_c: '', total_precipitation_mm: '' });

    // Datos edición
    let editForm = $state({ country: '', year: '', crop_type: '', average_temperature_c: '', total_precipitation_mm: '' });

    // Búsquedas
    let searchField = $state('country');
    let searchValue = $state('');
    let fromYear = $state('');
    let toYear = $state('');
    let searchMode = $state(false);

    // --- CONFIGURACIÓN API ---
    let API_BASE = '/api/v2/global-agriculture-climate-impacts';
    if (dev) { API_BASE = 'http://localhost:3000' + API_BASE; }

    function limpiarMensajes() {
        setTimeout(() => { error = null; successMessage = null; }, 5000);
    }

    // --- FUNCIONES CORE ---

    async function cargarRecursos(page = 1) {
        loading = true; error = null; searchMode = false;
        currentPage = page;
        let offset = (page - 1) * itemsPerPage;
        
        try {
            const res = await fetch(`${API_BASE}?offset=${offset}&limit=${itemsPerPage}`);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            recursos = await res.json();
        } catch (e) { error = "No se pudo conectar con el servidor."; }
        finally { loading = false; }
    }

    async function cargarEjemplo() {
        try {
            const res = await fetch(API_BASE + '/loadInitialData');
            if (res.ok) {
                successMessage = "Datos iniciales cargados.";
                await cargarRecursos(1);
            }
        } catch (e) { error = "Error al cargar ejemplos."; }
        limpiarMensajes();
    }

    // --- BÚSQUEDAS (GET con Query Params) ---
    async function ejecutarBusqueda() {
        loading = true; error = null; searchMode = true;
        let url = `${API_BASE}?`;
        
        if (searchValue) url += `${searchField}=${encodeURIComponent(searchValue.toLowerCase())}&`;
        if (fromYear) url += `from=${fromYear}&`;
        if (toYear) url += `to=${toYear}&`;

        try {
            const res = await fetch(url);
            recursos = await res.json();
            if (recursos.length === 0) error = "No se encontraron resultados.";
        } catch (e) { error = "Error en la búsqueda."; }
        finally { loading = false; limpiarMensajes(); }
    }

    // --- CRUD OPERACIONES ---
    async function crearRecurso() {
        const payload = { ...newForm, year: parseInt(newForm.year), 
            average_temperature_c: parseFloat(newForm.average_temperature_c), 
            total_precipitation_mm: parseFloat(newForm.total_precipitation_mm) };

        try {
            const res = await fetch(API_BASE, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.status === 409) throw new Error("El recurso ya existe.");
            if (!res.ok) throw new Error("Error en el formato de datos.");
            
            successMessage = "Creado con éxito.";
            showCreateForm = false;
            newForm = { country: '', year: '', crop_type: '', average_temperature_c: '', total_precipitation_mm: '' };
            await cargarRecursos(1);
        } catch (e) { error = e.message; }
        limpiarMensajes();
    }

    function iniciarEdicion(recurso) {
        editando = { ...recurso };
        editForm = { ...recurso };
        showEditForm = true;
        showCreateForm = false;
    }

    async function guardarEdicion() {
        const payload = { ...editForm, year: parseInt(editForm.year), 
            average_temperature_c: parseFloat(editForm.average_temperature_c), 
            total_precipitation_mm: parseFloat(editForm.total_precipitation_mm) };

        try {
            const res = await fetch(`${API_BASE}/${editando.country}/${editando.year}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                successMessage = "Actualizado correctamente.";
                showEditForm = false;
                await cargarRecursos(currentPage);
            } else { throw new Error("Error al actualizar."); }
        } catch (e) { error = e.message; }
        limpiarMensajes();
    }

    async function eliminarUno(recurso) {
        if (!confirm("¿Borrar este registro?")) return;
        try {
            const res = await fetch(`${API_BASE}/${recurso.country}/${recurso.year}`, { method: 'DELETE' });
            if (res.ok) {
                successMessage = "Eliminado.";
                await cargarRecursos(currentPage);
            }
        } catch (e) { error = "Error al eliminar."; }
        limpiarMensajes();
    }

    async function borrarTodo() {
        if (!confirm("¡Atención! Vas a borrar TODOS los datos de la V2. ¿Continuar?")) return;
        try {
            await fetch(API_BASE, { method: 'DELETE' });
            successMessage = "Base de datos vaciada.";
            recursos = [];
        } catch (e) { error = "Error al vaciar."; }
        limpiarMensajes();
    }

    onMount(() => cargarRecursos(1));
</script>

<div class="container">
    <h1>🌾 Gestión de Agricultura v2</h1>

    {#if successMessage} <div class="msg success">{successMessage}</div> {/if}
    {#if error} <div class="msg error">{error}</div> {/if}

    <section class="card search-box">
        <h3>🔍 Buscador Avanzado</h3>
        <div class="search-grid">
            <select bind:value={searchField}>
                <option value="country">País</option>
                <option value="crop_type">Cultivo</option>
            </select>
            <input type="text" bind:value={searchValue} placeholder="Escribe aquí...">
            <input type="number" bind:value={fromYear} placeholder="Año Desde">
            <input type="number" bind:value={toYear} placeholder="Año Hasta">
            <button onclick={ejecutarBusqueda} class="btn-search">Buscar</button>
            {#if searchMode}
                <button onclick={() => cargarRecursos(1)} class="btn-clear">Limpiar</button>
            {/if}
        </div>
    </section>

    <div class="top-buttons">
        <button onclick={cargarEjemplo} class="btn-load">Cargar Ejemplos</button>
        <button onclick={() => {showCreateForm = !showCreateForm; showEditForm = false;}} class="btn-new">
            {showCreateForm ? 'Cerrar' : 'Nuevo Registro'}
        </button>
        <button onclick={borrarTodo} class="btn-delete-all">Borrar Todo</button>
    </div>

    {#if showCreateForm}
        <div class="card form-card">
            <h3>➕ Nuevo Registro</h3>
            <div class="form-inputs">
                <input bind:value={newForm.country} placeholder="País">
                <input type="number" bind:value={newForm.year} placeholder="Año">
                <input bind:value={newForm.crop_type} placeholder="Cultivo">
                <input type="number" step="any" bind:value={newForm.average_temperature_c} placeholder="Temp">
                <input type="number" step="any" bind:value={newForm.total_precipitation_mm} placeholder="Precip">
                <button onclick={crearRecurso} class="btn-save">Guardar</button>
            </div>
        </div>
    {/if}

    {#if showEditForm}
        <div class="card form-card edit">
            <h3>✏️ Editando: {editando.country}</h3>
            <div class="form-inputs">
                <input value={editForm.country} disabled class="locked">
                <input value={editForm.year} disabled class="locked">
                <input bind:value={editForm.crop_type} placeholder="Cultivo">
                <input type="number" step="any" bind:value={editForm.average_temperature_c} placeholder="Temp">
                <input type="number" step="any" bind:value={editForm.total_precipitation_mm} placeholder="Precip">
                <button onclick={guardarEdicion} class="btn-save">Actualizar</button>
                <button onclick={() => showEditForm = false} class="btn-clear">Cancelar</button>
            </div>
        </div>
    {/if}

    <section class="card">
        <table>
            <thead>
                <tr>
                    <th>País</th><th>Año</th><th>Cultivo</th><th>Temp</th><th>Precip</th><th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {#each recursos as r}
                    <tr>
                        <td>{r.country}</td><td>{r.year}</td><td>{r.crop_type}</td>
                        <td>{r.average_temperature_c}º</td><td>{r.total_precipitation_mm}mm</td>
                        <td>
                            <button onclick={() => iniciarEdicion(r)} class="btn-icon">✏️</button>
                            <button onclick={() => eliminarUno(r)} class="btn-icon">🗑️</button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>

        {#if !searchMode}
            <div class="pagination">
                <button disabled={currentPage === 1} onclick={() => cargarRecursos(currentPage - 1)}>Ant.</button>
                <span>Pág {currentPage}</span>
                <button disabled={recursos.length < itemsPerPage} onclick={() => cargarRecursos(currentPage + 1)}>Sig.</button>
            </div>
        {/if}
    </section>
</div>

<style>
    .container { max-width: 900px; margin: auto; padding: 20px; font-family: 'Segoe UI', sans-serif; }
    .card { background: #fdfdfd; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px; border: 1px solid #eee; }
    .search-grid { display: grid; grid-template-columns: 1fr 2fr 1fr 1fr auto auto; gap: 10px; }
    .search-grid input, select { padding: 8px; border-radius: 6px; border: 1px solid #ddd; }
    .top-buttons { display: flex; gap: 10px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #2c7da0; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    .form-inputs { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
    .form-inputs input { padding: 10px; border: 1px solid #ccc; border-radius: 6px; }
    .locked { background: #eee; cursor: not-allowed; }
    .msg { padding: 10px; border-radius: 6px; margin-bottom: 10px; text-align: center; font-weight: bold; }
    .success { background: #d4edda; color: #155724; }
    .error { background: #f8d7da; color: #721c24; }
    button { cursor: pointer; border: none; border-radius: 6px; padding: 10px; font-weight: bold; transition: 0.2s; }
    button:hover { opacity: 0.8; }
    .btn-search { background: #2c7da0; color: white; }
    .btn-new { background: #27ae60; color: white; }
    .btn-load { background: #2a9d8f; color: white; }
    .btn-delete-all { background: #e63946; color: white; }
    .btn-save { background: #2c7da0; color: white; }
    .btn-icon { background: none; font-size: 1.2rem; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 20px; }
</style>