<script>
    // @ts-nocheck
    import { dev } from "$app/environment";

    // --- ESTADOS ---
    let recursos = $state([]);
    let loading = $state(false);
    let error = $state(null);
    let successMessage = $state(null);

    // Paginación adaptada a offset/limit
    let currentPage = $state(1);
    let itemsPerPage = $state(5);

    // Formularios
    let editando = $state(null);
    let showEditForm = $state(false);
    let showCreateForm = $state(false);

    // Datos creación
    let newYear = $state('');
    let newCountry = $state('');
    let newCropType = $state('');
    let newAverageTemperatureC = $state('');
    let newTotalPrecipitationMm = $state('');

    // Datos edición
    let editForm = $state({
        year: '', country: '', crop_type: '', average_temperature_c: '', total_precipitation_mm: ''
    });

    // Búsquedas
    let searchField = $state('country');
    let searchValue = $state('');
    let searchMode = $state(false);

    // Búsqueda por rango
    let fromYear = $state('');
    let toYear = $state('');

    let concreteCountry = $state('');
    let concreteYear = $state('');
    let concreteMode = $state(false);

    // --- CONFIGURACIÓN API (Apuntando a V2 como dice tu backend) ---
    let API_BASE = '/api/v2/global-agriculture-climate-impacts';
    if (dev) {
        API_BASE = 'http://localhost:3000' + API_BASE; 
    }

    function limpiarMensajes() {
        setTimeout(() => { error = null; successMessage = null; }, 5000);
    }

    // --- FUNCIONES CRUD ---
    async function cargarRecursos(page = 1, forceMessage = false) {
        searchMode = false; concreteMode = false; showCreateForm = false; 
        loading = true; error = null; currentPage = page;
        
        let offset = (page - 1) * itemsPerPage;
        
        try {
            const res = await fetch(`${API_BASE}?offset=${offset}&limit=${itemsPerPage}`);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            recursos = await res.json();
            if (forceMessage) successMessage = 'Lista actualizada.';
        } catch (e) {
            error = 'Error de conexión. ¿Está encendido el backend?';
        } finally {
            loading = false; limpiarMensajes();
        }
    }

    async function cargarEjemplo() {
        loading = true; error = null;
        try {
            await fetch(API_BASE, { method: 'DELETE' }); // Limpiamos primero
            const res = await fetch(API_BASE + '/loadInitialData');
            if (!res.ok) throw new Error('Fallo al cargar ejemplos');
            successMessage = 'Datos de ejemplo cargados (v2).';
            await cargarRecursos(1);
        } catch (e) { error = e.message; } finally { loading = false; limpiarMensajes(); }
    }

    async function buscarPorCampo() {
        if (!searchValue.trim()) { error = 'Introduce un valor para buscar.'; return; }
        searchMode = true; concreteMode = false; loading = true; error = null;
        try {
            const res = await fetch(`${API_BASE}?${searchField}=${encodeURIComponent(searchValue)}`);
            recursos = await res.json();
            if (recursos.length === 0) error = `No hay resultados para ${searchField} = "${searchValue}".`;
        } catch (e) { error = 'Error en la búsqueda.'; recursos = []; } finally { loading = false; limpiarMensajes(); }
    }

    async function buscarPorRango() {
        if (!fromYear && !toYear) { error = 'Introduce al menos un año en el rango.'; return; }
        searchMode = true; concreteMode = false; loading = true; error = null;
        let query = [];
        if (fromYear) query.push(`from=${fromYear}`);
        if (toYear) query.push(`to=${toYear}`);
        
        try {
            const res = await fetch(`${API_BASE}?${query.join('&')}`);
            recursos = await res.json();
            if (recursos.length === 0) error = 'No hay resultados en ese rango de años.';
        } catch (e) { error = 'Error en la búsqueda por rango.'; } finally { loading = false; limpiarMensajes(); }
    }

    async function buscarConcreto() {
        if (!concreteCountry || !concreteYear) { error = 'Faltan datos.'; return; }
        concreteMode = true; searchMode = false; loading = true; error = null;
        try {
            const res = await fetch(`${API_BASE}/${encodeURIComponent(concreteCountry)}/${concreteYear}`);
            if (!res.ok) throw new Error('No encontrado');
            recursos = [await res.json()];
        } catch (e) { error = 'Recurso no encontrado.'; recursos = []; } finally { loading = false; limpiarMensajes(); }
    }

    async function crearRecurso(event) {
        event.preventDefault(); loading = true; error = null;
        const payload = {
            country: newCountry, year: parseInt(newYear), crop_type: newCropType,
            average_temperature_c: parseFloat(newAverageTemperatureC), total_precipitation_mm: parseFloat(newTotalPrecipitationMm)
        };

        try {
            const res = await fetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('Error al crear: Puede que ya exista o falten datos.');
            
            newYear = newCountry = newCropType = newAverageTemperatureC = newTotalPrecipitationMm = '';
            successMessage = 'Recurso creado correctamente.'; showCreateForm = false; await cargarRecursos(1);
        } catch (e) { error = e.message; } finally { loading = false; limpiarMensajes(); }
    }

    function iniciarEdicion(recurso) {
        editando = recurso; editForm = { ...recurso }; showEditForm = true;
        setTimeout(() => document.getElementById('edit-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }

    async function guardarEdicion(event) {
        event.preventDefault(); loading = true; error = null;
        const payload = {
            country: editForm.country, year: parseInt(editForm.year), crop_type: editForm.crop_type,
            average_temperature_c: parseFloat(editForm.average_temperature_c), total_precipitation_mm: parseFloat(editForm.total_precipitation_mm)
        };

        try {
            const res = await fetch(`${API_BASE}/${editando.country}/${editando.year}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('Error al actualizar.');
            successMessage = 'Recurso actualizado.'; showEditForm = false; editando = null; await cargarRecursos(currentPage);
        } catch (e) { error = e.message; } finally { loading = false; limpiarMensajes(); }
    }

    async function eliminarRecurso(recurso) {
        if (!confirm(`¿Eliminar ${recurso.country} (${recurso.year})?`)) return;
        loading = true; error = null;
        try {
            await fetch(`${API_BASE}/${recurso.country}/${recurso.year}`, { method: 'DELETE' });
            successMessage = 'Recurso eliminado.'; await cargarRecursos(currentPage);
        } catch (e) { error = 'Error al eliminar.'; } finally { loading = false; limpiarMensajes(); }
    }

    async function eliminarTodos() {
        if (!confirm('¿Seguro que quieres eliminar TODOS los recursos de v2?')) return;
        try {
            await fetch(API_BASE, { method: 'DELETE' });
            successMessage = 'Todos eliminados.'; await cargarRecursos(1);
        } catch (e) {}
    }

    cargarRecursos(1);
</script>

{#if successMessage} <div class="msg msg-success">{successMessage}</div> {/if}
{#if error} <div class="msg msg-error">{error}</div> {/if}

<div class="container">
    <header class="header">
        <h1>🌱 Panel de Agricultura y Clima</h1>
        <p class="subtitle">Conectado a API v2</p>
    </header>

    <section class="card">
        <h2>🔍 Búsquedas y Filtros</h2>
        <div class="search-grid">
            <div class="search-item">
                <label>Búsqueda General</label>
                <div class="input-group">
                    <select bind:value={searchField}>
                        <option value="country">País</option>
                        <option value="crop_type">Tipo de Cultivo</option>
                    </select>
                    <input type="text" bind:value={searchValue} placeholder="Valor" />
                    <button onclick={buscarPorCampo} class="btn-primary">Buscar</button>
                </div>
            </div>

            <div class="search-item">
                <label>Filtrar por rango de Años</label>
                <div class="input-group">
                    <input type="number" bind:value={fromYear} placeholder="Desde" />
                    <input type="number" bind:value={toYear} placeholder="Hasta" />
                    <button onclick={buscarPorRango} class="btn-primary">Filtrar</button>
                </div>
            </div>

            <div class="search-item">
                <label>Recurso Específico</label>
                <div class="input-group">
                    <input type="text" bind:value={concreteCountry} placeholder="País" />
                    <input type="number" bind:value={concreteYear} placeholder="Año" />
                    <button onclick={buscarConcreto} class="btn-primary">Buscar</button>
                </div>
            </div>
        </div>
        {#if searchMode || concreteMode}
            <div style="text-align: center; margin-top: 15px;">
                <button onclick={() => cargarRecursos(1)} class="btn-secondary">🗂️ Quitar filtros y ver todo</button>
            </div>
        {/if}
    </section>

    <div class="action-bar">
        <button onclick={cargarEjemplo} class="btn-sample">📥 Cargar Ejemplos</button>
        <button onclick={() => { showCreateForm = !showCreateForm; }} class="btn-create">
            {showCreateForm ? '✖️ Cerrar Formulario' : '➕ Nuevo recurso'}
        </button>
        <button onclick={eliminarTodos} class="btn-danger">🗑️ Borrar Todos</button>
    </div>

    {#if showCreateForm}
        <section class="card create-card">
            <h2>➕ Añadir Recurso</h2>
            <form onsubmit={crearRecurso} class="form-grid">
                <input type="text" bind:value={newCountry} placeholder="País" required />
                <input type="number" bind:value={newYear} placeholder="Año" required />
                <input type="text" bind:value={newCropType} placeholder="Cultivo" required />
                <input type="number" step="any" bind:value={newAverageTemperatureC} placeholder="Temp (°C)" required />
                <input type="number" step="any" bind:value={newTotalPrecipitationMm} placeholder="Precipitación (mm)" required />
                <button type="submit" class="btn-submit">Guardar</button>
            </form>
        </section>
    {/if}

    {#if showEditForm && editando}
        <section id="edit-form" class="card edit-card">
            <h2>✏️ Editando: {editando.country} ({editando.year})</h2>
            <form onsubmit={guardarEdicion} class="form-grid">
                <input type="text" bind:value={editForm.country} disabled title="El país no se puede editar" />
                <input type="number" bind:value={editForm.year} disabled title="El año no se puede editar" />
                <input type="text" bind:value={editForm.crop_type} required />
                <input type="number" step="any" bind:value={editForm.average_temperature_c} required />
                <input type="number" step="any" bind:value={editForm.total_precipitation_mm} required />
                <div style="grid-column: 1/-1; display:flex; gap:10px;">
                    <button type="submit" class="btn-submit" style="flex:1;">Guardar cambios</button>
                    <button type="button" onclick={() => showEditForm = false} class="btn-secondary" style="flex:1;">Cancelar</button>
                </div>
            </form>
        </section>
    {/if}

    <section class="card">
        {#if loading} <p>Cargando...</p>
        {:else if recursos.length === 0} <p class="empty">No hay datos.</p>
        {:else}
            <div style="overflow-x: auto;">
                <table class="table">
                    <thead><tr><th>País</th><th>Año</th><th>Cultivo</th><th>Temp (°C)</th><th>Precip (mm)</th><th>Acciones</th></tr></thead>
                    <tbody>
                        {#each recursos as recurso}
                            <tr>
                                <td>{recurso.country}</td><td>{recurso.year}</td><td>{recurso.crop_type}</td>
                                <td>{recurso.average_temperature_c}</td><td>{recurso.total_precipitation_mm}</td>
                                <td class="action-cell">
                                    <button onclick={() => iniciarEdicion(recurso)} class="btn-edit">✏️</button>
                                    <a href="/global-agriculture-climate-impacts/{recurso.country}/{recurso.year}" class="btn-link">🔗</a>
                                    <button onclick={() => eliminarRecurso(recurso)} class="btn-delete">❌</button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            {#if !searchMode && !concreteMode}
                <div class="pagination">
                    <button disabled={currentPage === 1} onclick={() => cargarRecursos(currentPage - 1)}>Anterior</button>
                    <span>Página {currentPage}</span>
                    <button disabled={recursos.length < itemsPerPage} onclick={() => cargarRecursos(currentPage + 1)}>Siguiente</button>
                </div>
            {/if}
        {/if}
    </section>
</div>

<style>
    :root { --primary: #2c7da0; --secondary: #2a9d8f; --danger: #e63946; }
    .container { max-width: 1000px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
    .header { text-align: center; margin-bottom: 20px; }
    .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .search-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
    .input-group { display: flex; gap: 5px; margin-top: 5px; }
    .input-group input, .input-group select { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    .action-bar { display: flex; gap: 10px; margin-bottom: 20px; justify-content: center; flex-wrap: wrap; }
    button, .btn-link { padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; color: white; text-decoration: none;}
    button:hover, .btn-link:hover { opacity: 0.9; }
    button:disabled { background: #ccc !important; cursor: not-allowed; }
    .btn-primary, .btn-submit { background: var(--primary); }
    .btn-secondary { background: #6c757d; }
    .btn-sample { background: var(--secondary); }
    .btn-create { background: #4caf50; }
    .btn-danger, .btn-delete { background: var(--danger); }
    .btn-edit { background: #ff9800; }
    .btn-link { background: #8e44ad; padding: 8px 12px; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; align-items: center; }
    .form-grid input { padding: 10px; border: 1px solid #ccc; border-radius: 4px; width: 100%; box-sizing: border-box;}
    .table { width: 100%; border-collapse: collapse; white-space: nowrap; }
    .table th, .table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    .table th { background: var(--primary); color: white; }
    .table tr:hover { background-color: #f9f9f9; }
    .action-cell { display: flex; gap: 5px; }
    .msg { padding: 15px; margin-bottom: 20px; border-radius: 4px; text-align: center; font-weight: bold; }
    .msg-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .msg-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 15px; }
</style>