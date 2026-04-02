<script>
    // @ts-nocheck
    import { dev } from "$app/environment";

    // --- ESTADOS REACTIVOS (Svelte 5) ---
    let recursos = $state([]);
    let loading = $state(false);
    let error = $state(null);
    let successMessage = $state(null);
    let version = $state('v2'); 

    // Paginación y Visibilidad de Formularios
    let currentPage = $state(1);
    let itemsPerPage = $state(10);
    let showCreateForm = $state(false);
    let showEditForm = $state(false);
    let editando = $state(null);

    // Búsqueda por colecciones (Valores Únicos)
    let valoresUnicos = $state([]);
    let campoSeleccionado = $state(null);

    // --- ESTADO DE BÚSQUEDA UNIFICADO ---
    let searchParams = $state({
        country: '',
        year: '',
        crop_type: '',
        temp_min: '',
        temp_max: '',
        prec_min: '',
        prec_max: ''
    });

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

    // --- CARGAR RECURSOS CON FILTROS ---
    async function cargarRecursos(page = 1) {
        loading = true;
        currentPage = page;
        
        let query = new URLSearchParams();
        query.append("limit", itemsPerPage);
        query.append("offset", (currentPage - 1) * itemsPerPage);
        
        // Filtros de texto
        if (searchParams.country) query.append("country", searchParams.country);
        if (searchParams.year) query.append("year", searchParams.year);
        if (searchParams.crop_type) query.append("crop_type", searchParams.crop_type);
        
        // Filtros numéricos (Mín y Máx)
        if (searchParams.temp_min !== '' && searchParams.temp_min !== null) query.append("temp_min", searchParams.temp_min);
        if (searchParams.temp_max !== '' && searchParams.temp_max !== null) query.append("temp_max", searchParams.temp_max);
        if (searchParams.prec_min !== '' && searchParams.prec_min !== null) query.append("prec_min", searchParams.prec_min);
        if (searchParams.prec_max !== '' && searchParams.prec_max !== null) query.append("prec_max", searchParams.prec_max);

        let url = `${getApiUrl()}?${query.toString()}`;

        try {
            const res = await fetch(url);
            if (res.ok) {
                recursos = await res.json();
                error = null;
            } else {
                error = "Error al obtener los datos de la API";
                recursos = [];
            }
        } catch (e) {
            error = "Error de conexión. Asegúrate de que el backend (localhost:3000) está encendido.";
            recursos = [];
        } finally {
            loading = false;
        }
    }

    // --- OBTENER VALORES ÚNICOS ---
    async function cargarValoresUnicos(campo) {
        campoSeleccionado = campo;
        try {
            const res = await fetch(`${getApiUrl()}/${campo}`);
            if (res.ok) {
                valoresUnicos = await res.json();
                successMessage = `Valores únicos de ${campo} cargados`;
            } else {
                error = "Error al obtener valores únicos";
            }
        } catch (e) {
            error = "Error de conexión";
        }
        limpiarMensajes();
    }

    function clearSearch() {
        searchParams = { country: '', year: '', crop_type: '', temp_min: '', temp_max: '', prec_min: '', prec_max: '' };
        valoresUnicos = [];
        campoSeleccionado = null;
        cargarRecursos(1);
    }

    // --- POST, PUT, DELETE ---
    async function crearRecurso() {
        if (version !== 'v2') { error = "v1 es solo lectura"; return; }
        try {
            const res = await fetch(getApiUrl(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newForm, year: parseInt(newForm.year), average_temperature_c: parseFloat(newForm.average_temperature_c), total_precipitation_mm: parseFloat(newForm.total_precipitation_mm) })
            });
            if (res.ok) { successMessage = "Recurso creado"; showCreateForm = false; newForm = { country: '', year: '', crop_type: '', average_temperature_c: '', total_precipitation_mm: '' }; cargarRecursos(1); } else { error = "Error: Datos inválidos o ya existentes"; }
        } catch (e) { error = "Error al crear"; }
        limpiarMensajes();
    }

    function abrirEditor(recurso) { editando = recurso; editForm = { ...recurso }; showEditForm = true; showCreateForm = false; }

    async function guardarEdicion() {
        try {
            const res = await fetch(`${getApiUrl()}/${editando.country}/${editando.year}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editForm, year: parseInt(editForm.year), average_temperature_c: parseFloat(editForm.average_temperature_c), total_precipitation_mm: parseFloat(editForm.total_precipitation_mm) })
            });
            if (res.ok) { successMessage = "Actualizado"; showEditForm = false; cargarRecursos(currentPage); } else { error = "Error al actualizar"; }
        } catch (e) { error = "Fallo de red"; }
        limpiarMensajes();
    }

    async function eliminarUno(recurso) {
        if (!confirm(`¿Borrar ${recurso.country} ${recurso.year}?`)) return;
        const res = await fetch(`${getApiUrl()}/${recurso.country}/${recurso.year}`, { method: 'DELETE' });
        if (res.ok) { successMessage = "Eliminado"; cargarRecursos(currentPage); }
        limpiarMensajes();
    }

    async function eliminarTodo() {
        if (!confirm("¿BORRAR TODA LA COLECCIÓN?")) return;
        await fetch(getApiUrl(), { method: 'DELETE' });
        successMessage = "Base de datos vaciada"; cargarRecursos(1); limpiarMensajes();
    }

    $effect(() => { if (version) cargarRecursos(1); });
</script>

<div class="container">
    <div class="header-box">
        <h1>🌱 Panel Agricultura</h1>
        <select bind:value={version} class="select-version">
            <option value="v1">Modo Lectura (v1)</option>
            <option value="v2">Modo Edición (v2)</option>
        </select>
    </div>

    {#if error} <div class="msg error">{error}</div> {/if}
    {#if successMessage} <div class="msg success">{successMessage}</div> {/if}

    <div class="actions">
        <button onclick={() => fetch(getApiUrl()+'/loadInitialData').then(()=>cargarRecursos(1))} class="btn-sample">📥 Cargar Datos Iniciales</button>
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
                <button onclick={crearRecurso} class="btn-save">Guardar</button>
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
                <button onclick={guardarEdicion} class="btn-save">Actualizar</button>
                <button onclick={() => showEditForm = false} class="btn-cancel">X</button>
            </div>
        </div>
    {/if}

    <div class="card search-advanced">
        <h3>🗂️ Descubrir Valores Únicos (Colecciones)</h3>
        <div class="actions">
            <button onclick={() => cargarValoresUnicos('country')} class="btn-sample">🌍 Ver Países</button>
            <button onclick={() => cargarValoresUnicos('crop_type')} class="btn-sample">🌾 Ver Cultivos</button>
            <button onclick={() => cargarValoresUnicos('year')} class="btn-sample">📅 Ver Años</button>
        </div>
        {#if valoresUnicos.length > 0}
            <div style="margin-top: 15px; padding: 12px; background: #e3f2fd; border: 1px solid #90caf9; border-radius: 6px;">
                <strong>{campoSeleccionado.toUpperCase()}:</strong> {valoresUnicos.join(', ')}
            </div>
        {/if}
    </div>

    <section class="card table-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0;">📊 Datos Registrados</h3>
            <button onclick={clearSearch} class="btn-clear">🧹 Limpiar Todos los Filtros</button>
        </div>
        
        <div style="overflow-x: auto;">
            <table>
                <thead>
                    <tr>
                        <th style="width: 18%;">País</th>
                        <th style="width: 12%;">Año</th>
                        <th style="width: 18%;">Cultivo</th>
                        <th style="width: 20%;">Temp (°C)</th>
                        <th style="width: 20%;">Prec. (mm)</th>
                        <th style="width: 12%; text-align: center;">Acciones</th>
                    </tr>
                    <tr class="filter-row">
                        <td>
                            <input class="full-width" bind:value={searchParams.country} oninput={() => cargarRecursos(1)} placeholder="🔎 País">
                        </td>
                        <td>
                            <input class="full-width" bind:value={searchParams.year} oninput={() => cargarRecursos(1)} placeholder="🔎 Año">
                        </td>
                        <td>
                            <input class="full-width" bind:value={searchParams.crop_type} oninput={() => cargarRecursos(1)} placeholder="🔎 Cultivo">
                        </td>
                        
                        <td>
                            <div class="range-inputs">
                                <input type="number" bind:value={searchParams.temp_min} oninput={() => cargarRecursos(1)} placeholder="Mín">
                                <span>-</span>
                                <input type="number" bind:value={searchParams.temp_max} oninput={() => cargarRecursos(1)} placeholder="Máx">
                            </div>
                        </td>

                        <td>
                            <div class="range-inputs">
                                <input type="number" bind:value={searchParams.prec_min} oninput={() => cargarRecursos(1)} placeholder="Mín">
                                <span>-</span>
                                <input type="number" bind:value={searchParams.prec_max} oninput={() => cargarRecursos(1)} placeholder="Máx">
                            </div>
                        </td>
                        <td></td>
                    </tr>
                </thead>
                <tbody>
                    {#if loading}
                        <tr><td colspan="6" style="text-align:center; padding: 20px;">Cargando datos...</td></tr>
                    {:else}
                        {#each recursos as r}
                            <tr>
                                <td>{r.country}</td>
                                <td>{r.year}</td>
                                <td>{r.crop_type}</td>
                                <td>{r.average_temperature_c}º</td>
                                <td>{r.total_precipitation_mm}mm</td>
                                <td class="cell-actions" style="text-align: center;">
                                    {#if version === 'v2'}
                                        <button onclick={() => abrirEditor(r)} class="btn-edit" title="Editar">✏️</button>
                                        <button onclick={() => eliminarUno(r)} class="btn-del" title="Eliminar">🗑️</button>
                                    {:else}
                                        <span>🔒</span>
                                    {/if}
                                </td>
                            </tr>
                        {:else}
                            <tr><td colspan="6" style="text-align:center; padding: 30px; color: #666;">No se han encontrado resultados con estos filtros.</td></tr>
                        {/each}
                    {/if}
                </tbody>
            </table>
        </div>

        <div class="pagination">
            <button disabled={currentPage === 1} onclick={() => cargarRecursos(currentPage - 1)}>Anterior</button>
            <span>Página {currentPage}</span>
            <button disabled={recursos.length < itemsPerPage} onclick={() => cargarRecursos(currentPage + 1)}>Siguiente</button>
        </div>
    </section>
</div>

<style>
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; font-family: system-ui; }
    .header-box { display: flex; justify-content: space-between; align-items: center; background: #2c7da0; color: white; padding: 1rem 2rem; border-radius: 12px; margin-bottom: 20px; }
    .card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); padding: 20px; margin-bottom: 20px; }
    .actions { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    
    .grid-inputs { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
    .grid-inputs input { padding: 8px; border: 1px solid #ddd; border-radius: 6px; }
    .locked { background: #f0f0f0; }

    table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
    th { text-align: left; padding: 12px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; font-weight: 600; color: #333;}
    td { padding: 12px; border-bottom: 1px solid #eee; vertical-align: middle; }
    
    /* Estilos mejorados para la fila de filtros */
    .filter-row { background-color: #fcfcfc; }
    .filter-row td { padding: 8px 10px; border-bottom: 2px solid #dee2e6; }
    
    input { box-sizing: border-box; }
    .full-width { width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem; transition: border-color 0.2s;}
    .full-width:focus { border-color: #2c7da0; outline: none; }
    
    /* Layout para los rangos Mín-Máx */
    .range-inputs { display: flex; align-items: center; gap: 6px; width: 100%; }
    .range-inputs input { width: 45%; padding: 8px 4px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem; text-align: center; }
    .range-inputs span { color: #64748b; font-weight: bold; }

    button { cursor: pointer; border: none; border-radius: 6px; padding: 8px 16px; font-weight: 600; transition: 0.2s; }
    .btn-post { background: #27ae60; color: white; }
    .btn-sample { background: #2a9d8f; color: white; }
    .btn-delete-all { background: #e63946; color: white; }
    .btn-save { background: #2c7da0; color: white; }
    .btn-clear { background: #6c757d; color: white; }
    
    .cell-actions { display: flex; gap: 5px; justify-content: center; }
    .btn-edit { background: #f39c12; color: white; padding: 6px 10px; }
    .btn-del { background: #e74c3c; color: white; padding: 6px 10px; }
    .btn-cancel { background: #95a5a6; color: white; }
    
    .msg { padding: 12px; border-radius: 8px; margin-bottom: 15px; text-align: center; font-weight: bold; }
    .error { background: #fee2e2; color: #991b1b; }
    .success { background: #dcfce7; color: #166534; }
    .pagination { display: flex; justify-content: center; gap: 20px; align-items: center; margin-top: 20px; }
</style>