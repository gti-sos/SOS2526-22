<script>
    // @ts-nocheck
    import { dev } from "$app/environment";

    // Estados reactivos
    let recursos = $state([]);
    let loading = $state(false);
    let message = $state({ type: null, text: null });
    let currentPage = $state(1);
    let itemsPerPage = $state(5);
    let totalItems = $state(0);
    let totalPages = $state(1);

    // Formularios
    let showCreateForm = $state(false);
    let newData = $state({
        country: '', code: '', year: '', methyl_chloroform: '', methyl_bromide: '',
        hcfc: '', carbon_tetrachloride: '', halon: '', cfc: ''
    });
    let editando = $state(null);
    // svelte-ignore state_referenced_locally
        let editForm = $state({ ...newData });

    // Búsquedas
    let activeSearch = $state({ type: null, params: {} }); // type: 'field', 'range', 'concrete', 'fieldValues'
    let searchResults = $state(null);
    let searchLoading = $state(false);

    // API base
    let API_BASE = dev ? 'http://localhost:3000/api/v2/ozone-depleting-substance-consumptions' : '/api/v2/ozone-depleting-substance-consumptions';

    // Funciones auxiliares
    function setMessage(text, type = 'success') { message = { text, type }; setTimeout(() => { if (message.text === text) message = { type: null, text: null }; }, 5000); }

    // Carga principal con paginación
    async function cargarRecursos(page = currentPage, showSuccess = false) {
        activeSearch = { type: null, params: {} };
        loading = true;
        try {
            const res = await fetch(`${API_BASE}?page=${page}&items=${itemsPerPage}&t=${Date.now()}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            recursos = data.data || [];
            totalItems = data.total_items;
            totalPages = data.total_paginas;
            currentPage = data.pagina_actual;
            if (showSuccess) setMessage('Lista actualizada correctamente.');
        } catch { setMessage('Error al cargar datos.', 'error'); }
        finally { loading = false; }
    }

    // Ejecutar búsqueda según activeSearch
    async function ejecutarBusqueda() {
        if (activeSearch.type === null) return;
        searchLoading = true;
        searchResults = null;
        try {
            let url = API_BASE;
            if (activeSearch.type === 'field') {
                url += `?${activeSearch.params.field}=${encodeURIComponent(activeSearch.params.value)}`;
            } else if (activeSearch.type === 'range') {
                url += `?${activeSearch.params.from ? `from=${activeSearch.params.from}&` : ''}${activeSearch.params.to ? `to=${activeSearch.params.to}` : ''}`;
            } else if (activeSearch.type === 'concrete') {
                url += `/${encodeURIComponent(activeSearch.params.country)}/${activeSearch.params.year}`;
            } else if (activeSearch.type === 'fieldValues') {
                url += `/${activeSearch.params.fieldName}`;
            }
            const res = await fetch(url);
            if (!res.ok) {
                if (res.status === 404) searchResults = [];
                else throw new Error();
            } else {
                searchResults = await res.json();
            }
            if (activeSearch.type === 'concrete' && !searchResults) setMessage(`No existe recurso con país "${activeSearch.params.country}" y año ${activeSearch.params.year}.`, 'error');
            else if ((Array.isArray(searchResults) && searchResults.length === 0)) setMessage('No hay resultados.', 'error');
            else setMessage('Búsqueda completada.', 'success');
        } catch { setMessage('Error en la búsqueda.', 'error'); }
        finally { searchLoading = false; }
    }

    // Crear recurso
    async function crearRecurso(e) {
        e.preventDefault();
        loading = true;
        const payload = { ...newData, year: parseInt(newData.year), methyl_chloroform: parseFloat(newData.methyl_chloroform)||0, methyl_bromide: parseFloat(newData.methyl_bromide)||0, hcfc: parseFloat(newData.hcfc)||0, carbon_tetrachloride: parseFloat(newData.carbon_tetrachloride)||0, halon: parseFloat(newData.halon)||0, cfc: parseFloat(newData.cfc)||0 };
        try {
            const res = await fetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.status === 409) throw new Error(`Ya existe recurso con país "${newData.country}" y año ${newData.year}.`);
            if (!res.ok) throw new Error();
            setMessage('Recurso creado correctamente.');
            newData = { country: '', code: '', year: '', methyl_chloroform: '', methyl_bromide: '', hcfc: '', carbon_tetrachloride: '', halon: '', cfc: '' };
            showCreateForm = false;
            await cargarRecursos(1);
        } catch (e) { setMessage(e.message || 'Error al crear.', 'error'); }
        finally { loading = false; }
    }

    // Editar
    function iniciarEdicion(r) { editando = r; editForm = { ...r }; }
    function cancelarEdicion() { editando = null; }
    async function guardarEdicion(e) {
        e.preventDefault();
        if (!editando) return;
        loading = true;
        const payload = { ...editForm, year: parseInt(editForm.year), methyl_chloroform: parseFloat(editForm.methyl_chloroform)||0, methyl_bromide: parseFloat(editForm.methyl_bromide)||0, hcfc: parseFloat(editForm.hcfc)||0, carbon_tetrachloride: parseFloat(editForm.carbon_tetrachloride)||0, halon: parseFloat(editForm.halon)||0, cfc: parseFloat(editForm.cfc)||0 };
        try {
            const res = await fetch(`${API_BASE}/${editando.country}/${editando.year}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.status === 404) throw new Error(`Recurso ${editando.country}/${editando.year} no encontrado.`);
            if (!res.ok) throw new Error();
            setMessage('Recurso actualizado correctamente.');
            cancelarEdicion();
            await cargarRecursos(currentPage);
        } catch (e) { setMessage(e.message || 'Error al actualizar.', 'error'); }
        finally { loading = false; }
    }

    // Eliminar
    async function eliminarRecurso(r) {
        if (!confirm(`¿Eliminar ${r.country} (${r.year})?`)) return;
        loading = true;
        try {
            const res = await fetch(`${API_BASE}/${r.country}/${r.year}`, { method: 'DELETE' });
            if (res.status === 404) throw new Error(`Recurso no encontrado.`);
            if (!res.ok) throw new Error();
            setMessage('Recurso eliminado.');
            await cargarRecursos(currentPage);
        } catch (e) { setMessage(e.message || 'Error al eliminar.', 'error'); }
        finally { loading = false; }
    }

    async function eliminarTodos() {
        if (!confirm('¿Eliminar TODOS los recursos? No se puede deshacer.')) return;
        loading = true;
        try {
            const res = await fetch(API_BASE, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            setMessage('Todos los recursos eliminados.');
            await cargarRecursos(1);
        } catch { setMessage('Error al eliminar todos.', 'error'); }
        finally { loading = false; }
    }

    // Carga inicial
    cargarRecursos(1);
</script>

<!-- Mensajes -->
{#if message.text}
    <div class="msg msg-{message.type}">{message.text}</div>
{/if}

<div class="container">
    <header><h1>🌍 Gestión de consumo de sustancias (v2)</h1></header>

    <!-- SECCIÓN DE BÚSQUEDAS Y FILTROS -->
    <section class="card">
        <h2>🔍 Búsquedas y filtros</h2>
        <div class="search-grid">
            <!-- Por campo -->
            <div class="search-item">
                <label>Buscar por campo</label>
                <div class="input-group">
                    <select bind:value={activeSearch.params.field}>
                        <option value="country">País</option><option value="code">Código</option><option value="year">Año</option>
                        <option value="methyl_chloroform">Metilcloroformo</option><option value="methyl_bromide">Bromuro de metilo</option>
                        <option value="hcfc">HCFC</option><option value="carbon_tetrachloride">Tetracloruro de carbono</option>
                        <option value="halon">Halon</option><option value="cfc">CFC</option>
                    </select>
                    <input type="text" bind:value={activeSearch.params.value} placeholder="Valor" />
                    <button onclick={() => { activeSearch = { type: 'field', params: { field: activeSearch.params.field, value: activeSearch.params.value } }; ejecutarBusqueda(); }} class="btn-primary">Buscar</button>
                </div>
            </div>
            <!-- Rango de años -->
            <div class="search-item">
                <label>Filtrar por rango de años</label>
                <div class="input-group">
                    <input type="number" bind:value={activeSearch.params.from} placeholder="Desde" />
                    <input type="number" bind:value={activeSearch.params.to} placeholder="Hasta" />
                    <button onclick={() => { activeSearch = { type: 'range', params: { from: activeSearch.params.from, to: activeSearch.params.to } }; ejecutarBusqueda(); }} class="btn-primary">Filtrar</button>
                </div>
            </div>
            <!-- Recurso concreto -->
            <div class="search-item">
                <label>Buscar recurso concreto</label>
                <div class="input-group">
                    <input type="text" bind:value={activeSearch.params.country} placeholder="País" />
                    <input type="number" bind:value={activeSearch.params.year} placeholder="Año" />
                    <button onclick={() => { activeSearch = { type: 'concrete', params: { country: activeSearch.params.country, year: activeSearch.params.year } }; ejecutarBusqueda(); }} class="btn-primary">Buscar</button>
                </div>
            </div>
            <!-- Valores de un campo -->
            <div class="search-item">
                <label>Ver todos los valores de un campo</label>
                <div class="input-group">
                    <select bind:value={activeSearch.params.fieldName}>
                        <option value="country">País</option><option value="code">Código</option><option value="year">Año</option>
                        <option value="methyl_chloroform">Metilcloroformo</option><option value="methyl_bromide">Bromuro de metilo</option>
                        <option value="hcfc">HCFC</option><option value="carbon_tetrachloride">Tetracloruro de carbono</option>
                        <option value="halon">Halon</option><option value="cfc">CFC</option>
                    </select>
                    <button onclick={() => { activeSearch = { type: 'fieldValues', params: { fieldName: activeSearch.params.fieldName } }; ejecutarBusqueda(); }} class="btn-primary">Ver</button>
                </div>
            </div>
        </div>
    </section>

    <!-- Botones de acción global -->
    <div class="action-bar">
        <button onclick={async () => { await fetch(API_BASE, { method: 'DELETE' }); await fetch(API_BASE + '/loadInitialData'); cargarRecursos(1); setMessage('Datos de ejemplo cargados.'); }} class="btn-sample">📥 Cargar datos de ejemplo</button>
        <button onclick={() => showCreateForm = !showCreateForm} class="btn-create">{showCreateForm ? '✖️ Cerrar' : '➕ Nuevo recurso'}</button>
        <button onclick={eliminarTodos} class="btn-danger">🗑️ Eliminar todos</button>
        <button onclick={() => cargarRecursos(currentPage, true)} class="btn-refresh">🔄 Actualizar lista</button>
    </div>

    <!-- Formulario de creación -->
    {#if showCreateForm}
        <section class="card create-card">
            <h2>➕ Crear nuevo recurso</h2>
            <form onsubmit={crearRecurso}>
                <div class="form-grid">
                    {#each ['country','code','year','methyl_chloroform','methyl_bromide','hcfc','carbon_tetrachloride','halon','cfc'] as field}
                        <input type={field === 'year' ? 'number' : field.includes('_') ? 'number' : 'text'} step={field.includes('_') ? 'any' : undefined} bind:value={newData[field]} placeholder={field.replace(/_/g,' ').toUpperCase()} required={field === 'country' || field === 'code' || field === 'year'} />
                    {/each}
                </div>
                <div class="form-actions">
                    <button type="submit" disabled={loading} class="btn-submit">Guardar recurso</button>
                    <button type="button" onclick={() => showCreateForm = false} class="btn-cancel">Cancelar</button>
                </div>
            </form>
        </section>
    {/if}

    <!-- Formulario de edición -->
    {#if editando}
        <section id="edit-form" class="card edit-card">
            <h2>✏️ Editando: {editando.country} ({editando.year})</h2>
            <form onsubmit={guardarEdicion}>
                <div class="form-grid">
                    <div class="readonly-field"><label>País:</label><input type="text" bind:value={editForm.country} readonly disabled /></div>
                    <div><label>Código:</label><input type="text" bind:value={editForm.code} required /></div>
                    <div class="readonly-field"><label>Año:</label><input type="number" bind:value={editForm.year} readonly disabled /></div>
                    {#each ['methyl_chloroform','methyl_bromide','hcfc','carbon_tetrachloride','halon','cfc'] as field}
                        <div><label>{field.replace(/_/g,' ')}:</label><input type="number" step="any" bind:value={editForm[field]} /></div>
                    {/each}
                </div>
                <div class="form-actions">
                    <button type="submit" disabled={loading} class="btn-submit">Guardar cambios</button>
                    <button type="button" onclick={cancelarEdicion} class="btn-cancel">Cancelar</button>
                </div>
            </form>
        </section>
    {/if}

    <!-- Mostrar resultados de búsqueda (si hay activa) -->
    {#if activeSearch.type}
        <section class="card results-card">
            <h3>Resultados</h3>
            {#if searchLoading}
                <p class="loading">Buscando...</p>
            {:else if searchResults !== null}
                {#if Array.isArray(searchResults) && searchResults.length > 0}
                    <table class="table">
                        <thead><tr><th>País</th><th>Código</th><th>Año</th><th>Metilcloroformo</th><th>Bromuro de metilo</th><th>HCFC</th><th>Tetracloruro de carbono</th><th>Halon</th><th>CFC</th></tr></thead>
                        <tbody>
                            {#each searchResults as item}
                                <tr><td>{item.country}</td><td>{item.code}</td><td>{item.year}</td><td>{item.methyl_chloroform}</td><td>{item.methyl_bromide}</td><td>{item.hcfc}</td><td>{item.carbon_tetrachloride}</td><td>{item.halon}</td><td>{item.cfc}</td></tr>
                            {/each}
                        </tbody>
                    </table>
                {:else if !Array.isArray(searchResults) && searchResults}
                    <table class="table"><thead><tr><th>País</th><th>Código</th><th>Año</th><th>Metilcloroformo</th><th>Bromuro de metilo</th><th>HCFC</th><th>Tetracloruro de carbono</th><th>Halon</th><th>CFC</th></tr></thead><tbody><tr><td>{searchResults.country}</td><td>{searchResults.code}</td><td>{searchResults.year}</td><td>{searchResults.methyl_chloroform}</td><td>{searchResults.methyl_bromide}</td><td>{searchResults.hcfc}</td><td>{searchResults.carbon_tetrachloride}</td><td>{searchResults.halon}</td><td>{searchResults.cfc}</td></tr></tbody></table>
                {:else}
                    <p>No hay resultados.</p>
                {/if}
            {/if}
        </section>
    {/if}

    <!-- Listado normal paginado (solo si no hay búsqueda activa) -->
    {#if !activeSearch.type}
        <!-- Controles de paginación -->
        {#if recursos.length > 0}
            <div class="pagination-bar">
                <div class="pagination-left"><label>Mostrar:</label><select bind:value={itemsPerPage} onchange={() => { currentPage=1; cargarRecursos(1); }}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select><span>por página</span></div>
                <div class="pagination-right">
                    <button onclick={() => cargarRecursos(1)} disabled={currentPage===1} class="btn-page">⏮️</button>
                    <button onclick={() => cargarRecursos(currentPage-1)} disabled={currentPage===1} class="btn-page">◀</button>
                    <span class="page-info">Pág. {currentPage} de {totalPages} ({totalItems} total)</span>
                    <button onclick={() => cargarRecursos(currentPage+1)} disabled={currentPage===totalPages} class="btn-page">▶</button>
                    <button onclick={() => cargarRecursos(totalPages)} disabled={currentPage===totalPages} class="btn-page">⏭️</button>
                </div>
            </div>
        {/if}

        <section class="card">
            {#if loading}
                <p class="loading">Cargando...</p>
            {:else if recursos.length === 0}
                <p class="empty">No hay recursos. Puedes cargar datos de ejemplo o crear uno nuevo.</p>
            {:else}
                <table class="table">
                    <thead><tr><th>País</th><th>Código</th><th>Año</th><th>Metilcloroformo</th><th>Bromuro de metilo</th><th>HCFC</th><th>Tetracloruro de carbono</th><th>Halon</th><th>CFC</th><th>Acciones</th></tr></thead>
                    <tbody>
                        {#each recursos as r}
                            <tr><td>{r.country}</td><td>{r.code}</td><td>{r.year}</td><td>{r.methyl_chloroform}</td><td>{r.methyl_bromide}</td><td>{r.hcfc}</td><td>{r.carbon_tetrachloride}</td><td>{r.halon}</td><td>{r.cfc}</td><td class="action-cell"><button onclick={() => iniciarEdicion(r)} class="btn-icon btn-edit" title="Editar">✏️</button><button onclick={() => eliminarRecurso(r)} class="btn-icon btn-delete" title="Eliminar">delete</button></td></tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
        </section>

        {#if recursos.length > 0}
            <div class="pagination-bar bottom"><div class="pagination-right"><button onclick={() => cargarRecursos(1)} disabled={currentPage===1} class="btn-page">⏮️</button><button onclick={() => cargarRecursos(currentPage-1)} disabled={currentPage===1} class="btn-page">◀</button><span class="page-info">{currentPage}/{totalPages}</span><button onclick={() => cargarRecursos(currentPage+1)} disabled={currentPage===totalPages} class="btn-page">▶</button><button onclick={() => cargarRecursos(totalPages)} disabled={currentPage===totalPages} class="btn-page">⏭️</button></div></div>
        {/if}
    {/if}
</div>



<style>
    /* Variables de color */
    :root {
        --primary: #2c7da0;
        --primary-light: #61a5c2;
        --secondary: #2a9d8f;
        --danger: #e76f51;
        --warning: #e9c46a;
        --light: #f8f9fa;
        --dark: #264653;
        --gray: #6c757d;
        --border: #dee2e6;
        --shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    * {
        box-sizing: border-box;
    }

    body {
        font-family: 'Segoe UI', Roboto, system-ui, sans-serif;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3e0f2 100%);
        margin: 0;
        padding: 20px;
        min-height: 100vh;
    }

    .container {
        max-width: 1400px;
        margin: 0 auto;
    }

    .header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .header h1 {
        color: var(--dark);
        font-size: 2.2rem;
        margin-bottom: 0.2rem;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
    }

    .subtitle {
        color: var(--gray);
        font-size: 1.1rem;
        margin-top: 0;
    }

    /* Tarjetas */
    .card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: var(--shadow);
        border: 1px solid var(--border);
    }

    .create-card {
        border-left: 5px solid var(--secondary);
    }

    .edit-card {
        border-left: 5px solid var(--warning);
    }

    .results-card {
        border-left: 5px solid var(--primary);
    }

    /* Mensajes */
    .msg {
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        text-align: center;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    .msg-success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }

    .msg-error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }

    /* Barra de acciones */
    .action-bar {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin: 1.5rem 0;
        justify-content: center;
    }

    /* Botones */
    button {
        padding: 0.6rem 1.2rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover:not(:disabled) { background: var(--primary-light); }

    .btn-secondary { background: var(--gray); color: white; }

    .btn-sample { background: var(--secondary); color: white; }
    .btn-create { background: var(--primary); color: white; }
    .btn-danger { background: var(--danger); color: white; }
    .btn-refresh { background: var(--gray); color: white; }
    .btn-submit { background: var(--secondary); color: white; }
    .btn-cancel { background: var(--gray); color: white; }

    .btn-icon {
        padding: 0.4rem 0.6rem;
        font-size: 1.2rem;
        background: transparent;
        box-shadow: none;
    }
    .btn-icon:hover:not(:disabled) {
        background: rgba(0,0,0,0.05);
        transform: scale(1.2);
    }
    .btn-edit { color: var(--warning); }
    .btn-delete { color: var(--danger); }

    .btn-page {
        padding: 0.3rem 0.8rem;
        background: var(--light);
        color: var(--dark);
        border: 1px solid var(--border);
    }

    /* Búsquedas */
    .search-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 1rem;
    }

    .search-item label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: var(--dark);
    }

    .input-group {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .input-group select, .input-group input {
        flex: 1 1 auto;
        padding: 0.5rem;
        border: 1px solid var(--border);
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .input-group input[type="number"] {
        min-width: 100px;
    }

    .error-text {
        color: var(--danger);
        font-size: 0.85rem;
        margin-top: 0.3rem;
        display: block;
    }

    .search-actions {
        display: flex;
        justify-content: center;
        margin-top: 1rem;
    }

    /* Formularios */
    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .form-grid input {
        width: 100%;
        padding: 0.6rem;
        border: 1px solid var(--border);
        border-radius: 6px;
        font-size: 0.95rem;
    }

    .form-grid input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(44,125,160,0.2);
    }

    .readonly-field input {
        background-color: #e9ecef;
    }

    .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }

    /* Tabla */
    .table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
        font-size: 0.95rem;
    }

    .table th, .table td {
        border: 1px solid var(--border);
        padding: 0.75rem;
        text-align: left;
    }

    .table th {
        background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
        font-weight: 600;
        color: var(--dark);
    }

    .table tbody tr:nth-child(even) {
        background-color: #f8f9fa;
    }

    .table tbody tr:hover {
        background-color: #e2f0ff;
    }

    .action-cell {
        display: flex;
        gap: 0.3rem;
        justify-content: center;
    }

    /* Paginación */
    .pagination-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 1rem 0;
        flex-wrap: wrap;
        gap: 1rem;
        background: white;
        padding: 0.8rem 1.5rem;
        border-radius: 8px;
        box-shadow: var(--shadow);
    }

    .pagination-left, .pagination-right {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .page-info {
        padding: 0.3rem 1rem;
        background: var(--light);
        border-radius: 20px;
        font-weight: 500;
    }

    .bottom {
        justify-content: center;
    }

    /* Lista de valores */
    .value-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .value-tag {
        background: var(--primary-light);
        color: white;
        padding: 0.3rem 1rem;
        border-radius: 20px;
        font-size: 0.9rem;
    }

    /* Estados */
    .loading, .empty {
        text-align: center;
        padding: 3rem;
        color: var(--gray);
        font-style: italic;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .form-grid {
            grid-template-columns: 1fr;
        }
        .search-grid {
            grid-template-columns: 1fr;
        }
        .action-bar {
            flex-direction: column;
        }
        .pagination-bar {
            flex-direction: column;
            align-items: stretch;
        }
        .pagination-left, .pagination-right {
            justify-content: center;
        }
    }
</style>