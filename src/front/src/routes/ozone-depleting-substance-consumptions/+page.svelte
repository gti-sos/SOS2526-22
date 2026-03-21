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
    let editForm = $state({
        country: '', code: '', year: '', methyl_chloroform: '', methyl_bromide: '',
        hcfc: '', carbon_tetrachloride: '', halon: '', cfc: ''
    });

    // Búsquedas
    let activeSearch = $state({ type: null, params: {} }); 
    let searchResults = $state(null);
    let searchLoading = $state(false);

    // Parámetros de búsqueda unificada
    let searchParams = $state({
        country: '',
        code: '',
        exactYear: '',
        from: '',
        to: '',
        field: 'country',
        fieldValue: ''
    });

    // API base
    let API_BASE = dev ? 'http://localhost:3000/api/v2/ozone-depleting-substance-consumptions' : '/api/v2/ozone-depleting-substance-consumptions';

    // Funciones auxiliares
    function setMessage(text, type = 'success') {
        message = { text, type };
        setTimeout(() => {
            if (message.text === text) message = { type: null, text: null };
        }, 5000);
    }

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
        } catch {
            setMessage('Error al cargar datos.', 'error');
        } finally {
            loading = false;
        }
    }

    // Búsqueda unificada 
    async function buscarUnificado() {
        activeSearch = { type: null, params: {} };
        searchResults = null;

        const hasAny = searchParams.country || searchParams.code || searchParams.exactYear ||
                       searchParams.from || searchParams.to ||
                       (searchParams.fieldValue && searchParams.field);
        if (!hasAny) {
            setMessage('Debes rellenar al menos un filtro.', 'error');
            return;
        }

        const from = searchParams.from ? parseInt(searchParams.from) : null;
        const to = searchParams.to ? parseInt(searchParams.to) : null;
        const exactYear = searchParams.exactYear ? parseInt(searchParams.exactYear) : null;

        if (from !== null && to !== null && from > to) {
            setMessage('El año "Desde" no puede ser mayor que el año "Hasta".', 'error');
            return;
        }
        if (exactYear !== null && from !== null && exactYear < from) {
            setMessage(`El año exacto (${exactYear}) es menor que el año "Desde" (${from}).`, 'error');
            return;
        }
        if (exactYear !== null && to !== null && exactYear > to) {
            setMessage(`El año exacto (${exactYear}) es mayor que el año "Hasta" (${to}).`, 'error');
            return;
        }
        
        /* eslint-disable-next-line */
        const params = new URLSearchParams();
        if (searchParams.country) params.append('country', searchParams.country.toLowerCase());
        if (searchParams.code) params.append('code', searchParams.code.toLowerCase());
        if (searchParams.exactYear) params.append('year', searchParams.exactYear);
        if (searchParams.from) params.append('from', searchParams.from);
        if (searchParams.to) params.append('to', searchParams.to);
        if (searchParams.fieldValue && searchParams.field) {
            params.append(searchParams.field, searchParams.fieldValue);
        }

        const queryString = params.toString();
        const url = `${API_BASE}?${queryString}`;

        searchLoading = true;
        try {
            const res = await fetch(url);
            if (!res.ok) {
                if (res.status === 404) searchResults = [];
                else throw new Error();
            } else {
                searchResults = await res.json();
            }
            activeSearch = { type: 'unified', params: {} };
            if (Array.isArray(searchResults) && searchResults.length === 0) {
                setMessage('No hay resultados.', 'error');
            } else {
                setMessage(`Se encontraron ${searchResults.length} resultados.`, 'success');
            }
        } catch {
            setMessage('Error en la búsqueda.', 'error');
        } finally {
            searchLoading = false;
        }
    }

    function limpiarFiltros() {
        searchParams = {
            country: '', code: '', exactYear: '', from: '', to: '',
            field: 'country', fieldValue: ''
        };
        activeSearch = { type: null, params: {} };
        searchResults = null;
        setMessage('Filtros limpiados.', 'success');
    }

    // Crear recurso
    async function crearRecurso(e) {
        e.preventDefault();
        if (!newData.country || !newData.code || !newData.year) {
            setMessage('Los campos País, Código y Año son obligatorios.', 'error');
            return;
        }
        loading = true;
        const payload = {
            ...newData,
            year: parseInt(newData.year),
            methyl_chloroform: parseFloat(newData.methyl_chloroform) || 0,
            methyl_bromide: parseFloat(newData.methyl_bromide) || 0,
            hcfc: parseFloat(newData.hcfc) || 0,
            carbon_tetrachloride: parseFloat(newData.carbon_tetrachloride) || 0,
            halon: parseFloat(newData.halon) || 0,
            cfc: parseFloat(newData.cfc) || 0
        };
        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.status === 409) throw new Error(`Ya existe recurso con país "${newData.country}" y año ${newData.year}.`);
            if (!res.ok) throw new Error();
            setMessage('Recurso creado correctamente.');
            newData = { country: '', code: '', year: '', methyl_chloroform: '', methyl_bromide: '', hcfc: '', carbon_tetrachloride: '', halon: '', cfc: '' };
            showCreateForm = false;
            await cargarRecursos(1);
        } catch (e) {
            setMessage(e.message || 'Error al crear.', 'error');
        } finally {
            loading = false;
        }
    }

    // Editar
    function iniciarEdicion(r) {
        editando = r;
        editForm = { ...r };
    }
    function cancelarEdicion() {
        editando = null;
    }
    async function guardarEdicion(e) {
        e.preventDefault();
        if (!editando) return;
        loading = true;
        const payload = {
            ...editForm,
            year: parseInt(editForm.year),
            methyl_chloroform: parseFloat(editForm.methyl_chloroform) || 0,
            methyl_bromide: parseFloat(editForm.methyl_bromide) || 0,
            hcfc: parseFloat(editForm.hcfc) || 0,
            carbon_tetrachloride: parseFloat(editForm.carbon_tetrachloride) || 0,
            halon: parseFloat(editForm.halon) || 0,
            cfc: parseFloat(editForm.cfc) || 0
        };
        try {
            const res = await fetch(`${API_BASE}/${editando.country}/${editando.year}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.status === 404) throw new Error(`Recurso ${editando.country}/${editando.year} no encontrado.`);
            if (!res.ok) throw new Error();
            setMessage('Recurso actualizado correctamente.');
            cancelarEdicion();
            await cargarRecursos(currentPage);
        } catch (e) {
            setMessage(e.message || 'Error al actualizar.', 'error');
        } finally {
            loading = false;
        }
    }

    // Eliminar recurso individual
    async function eliminarRecurso(r) {
        if (!confirm(`¿Eliminar ${r.country} (${r.year})?`)) return;
        loading = true;
        try {
            const res = await fetch(`${API_BASE}/${r.country}/${r.year}`, { method: 'DELETE' });
            if (res.status === 404) throw new Error(`Recurso no encontrado.`);
            if (!res.ok) throw new Error();
            setMessage('Recurso eliminado.');
            await cargarRecursos(currentPage);
        } catch (e) {
            setMessage(e.message || 'Error al eliminar.', 'error');
        } finally {
            loading = false;
        }
    }

    // Eliminar todos los recursos
    async function eliminarTodos() {
        if (!confirm('¿Eliminar TODOS los recursos? No se puede deshacer.')) return;
        loading = true;
        try {
            const res = await fetch(API_BASE, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            setMessage('Todos los recursos eliminados.');
            await cargarRecursos(1);
        } catch {
            setMessage('Error al eliminar todo.', 'error');
        } finally {
            loading = false;
        }
    }

    // Cargar datos iniciales
    async function cargarDatosEjemplo() {
        loading = true;
        try {
            await fetch(API_BASE, { method: 'DELETE' });
            const res = await fetch(API_BASE + '/loadInitialData');
            if (!res.ok) throw new Error();
            setMessage('Datos iniciales cargados correctamente.');
            await cargarRecursos(1);
        } catch {
            setMessage('Error al cargar datos iniciales.', 'error');
        } finally {
            loading = false;
        }
    }
    cargarRecursos(1);
</script>

<!-- Mensajes -->
{#if message.text}
    <div class="msg msg-{message.type}">{message.text}</div>
{/if}

<div class="container">
    <header><h1>Gestión de consumo de sustancias (v2)</h1></header>

    <!-- SECCIÓN DE BÚSQUEDA  -->
     <!-- svelte-ignore a11y_label_has_associated_control -->
    <section class="card">
        <h2>Búsqueda avanzada</h2>
        <div class="search-form">
            <div class="search-row">
                <div class="search-field">
                    
                    <label>País</label>
                    <input type="text" bind:value={searchParams.country} placeholder="Ej. japan" />
                </div>
                <div class="search-field">
                    <label>Código</label>
                    <input type="text" bind:value={searchParams.code} placeholder="Ej. jpn" />
                </div>
                <div class="search-field">
                    <label>Año exacto</label>
                    <input type="number" bind:value={searchParams.exactYear} placeholder="Ej. 2013" />
                </div>
            </div>
            <div class="search-row">
                <div class="search-field">
                    <label>Desde año</label>
                    <input type="number" bind:value={searchParams.from} placeholder="Ej. 2010" />
                </div>
                <div class="search-field">
                    <label>Hasta año</label>
                    <input type="number" bind:value={searchParams.to} placeholder="Ej. 2020" />
                </div>
                <div class="search-field">
                    <label>Buscar por campo específico</label>
                    <div class="input-group">
                        <select bind:value={searchParams.field}>
                            <option value="country">País</option>
                            <option value="code">Código</option>
                            <option value="year">Año</option>
                            <option value="methyl_chloroform">Metilcloroformo</option>
                            <option value="methyl_bromide">Bromuro de metilo</option>
                            <option value="hcfc">HCFC</option>
                            <option value="carbon_tetrachloride">Tetracloruro de carbono</option>
                            <option value="halon">Halon</option>
                            <option value="cfc">CFC</option>
                        </select>
                        <input type="text" bind:value={searchParams.fieldValue} placeholder="Valor" />
                    </div>
                </div>
            </div>
            <div class="search-actions">
                <button onclick={buscarUnificado} class="btn-primary">Buscar</button>
                <button onclick={limpiarFiltros} class="btn-secondary">Limpiar filtros</button>
            </div>
        </div>
    </section>

    <!-- Botones de acción global -->
    <div class="action-bar">
        <button onclick={cargarDatosEjemplo} class="btn-sample">Cargar datos iniciales</button>
        <button onclick={() => showCreateForm = !showCreateForm} class="btn-create">{showCreateForm ? ' Cerrar' : 'Nuevo recurso'}</button>
        <button onclick={eliminarTodos} class="btn-danger">Eliminar todo</button>
        <button onclick={() => cargarRecursos(currentPage, true)} class="btn-refresh">Actualizar lista</button>
    </div>

    <!-- Formulario de creación -->
    {#if showCreateForm}
        <section class="card create-card">
            <h2>Crear nuevo recurso</h2>
            <form onsubmit={crearRecurso}>
                <div class="form-grid">
                        {#each ['country','code','year','methyl_chloroform','methyl_bromide','hcfc','carbon_tetrachloride','halon','cfc'] as field (field)}
    <input
        type={field === 'year' ? 'number' : field.includes('_') ? 'number' : 'text'}
        step={field.includes('_') ? 'any' : undefined}
        bind:value={newData[field]}
        placeholder={field.replace(/_/g, ' ').toUpperCase()}
        required={field === 'country' || field === 'code' || field === 'year'}
    />
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
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <section id="edit-form" class="card edit-card">
            <h2>Editando: {editando.country} ({editando.year})</h2>
            <form onsubmit={guardarEdicion}>
                <div class="form-grid">
                    <div class="readonly-field"><label>País:</label><input type="text" bind:value={editForm.country} readonly disabled /></div>
                    <div><label>Código:</label><input type="text" bind:value={editForm.code} required /></div>
                    <div class="readonly-field"><label>Año:</label><input type="number" bind:value={editForm.year} readonly disabled /></div>
                    {#each ['country','code','year','methyl_chloroform','methyl_bromide','hcfc','carbon_tetrachloride','halon','cfc'] as field (field)}
    <input
        type={field === 'year' ? 'number' : field.includes('_') ? 'number' : 'text'}
        step={field.includes('_') ? 'any' : undefined}
        bind:value={newData[field]}
        placeholder={field.replace(/_/g, ' ').toUpperCase()}
        required={field === 'country' || field === 'code' || field === 'year'}
    />
{/each}
                </div>
                <div class="form-actions">
                    <button type="submit" disabled={loading} class="btn-submit">Guardar cambios</button>
                    <button type="button" onclick={cancelarEdicion} class="btn-cancel">Cancelar</button>
                </div>
            </form>
        </section>
    {/if}

    <!-- Mostrar resultados de búsqueda -->
    {#if activeSearch.type}
        <section class="card results-card">
            <h3>Resultados</h3>
            {#if searchLoading}
                <p class="loading">Buscando...</p>
            {:else if searchResults !== null}
                {#if Array.isArray(searchResults) && searchResults.length > 0}
                    <table class="table">
                        <thead>
                            <tr>
                                <th>País</th><th>Código</th><th>Año</th>
                                <th>Metilcloroformo</th><th>Bromuro de metilo</th>
                                <th>HCFC</th><th>Tetracloruro de carbono</th>
                                <th>Halon</th><th>CFC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each searchResults as item (item.country + item.year)}
                                <tr>
                                    <td>{item.country}</td>
                                    <td>{item.code}</td>
                                    <td>{item.year}</td>
                                    <td>{item.methyl_chloroform}</td>
                                    <td>{item.methyl_bromide}</td>
                                    <td>{item.hcfc}</td>
                                    <td>{item.carbon_tetrachloride}</td>
                                    <td>{item.halon}</td>
                                    <td>{item.cfc}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {:else if !Array.isArray(searchResults) && searchResults}
                    <table class="table">
                        <thead>
                            <tr>
                                <th>País</th><th>Código</th><th>Año</th>
                                <th>Metilcloroformo</th><th>Bromuro de metilo</th>
                                <th>HCFC</th><th>Tetracloruro de carbono</th>
                                <th>Halon</th><th>CFC</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{searchResults.country}</td>
                                <td>{searchResults.code}</td>
                                <td>{searchResults.year}</td>
                                <td>{searchResults.methyl_chloroform}</td>
                                <td>{searchResults.methyl_bromide}</td>
                                <td>{searchResults.hcfc}</td>
                                <td>{searchResults.carbon_tetrachloride}</td>
                                <td>{searchResults.halon}</td>
                                <td>{searchResults.cfc}</td>
                            </tr>
                        </tbody>
                    </table>
                {:else}
                    <p>No hay resultados.</p>
                {/if}
            {/if}
        </section>
    {/if}

    <!-- Listado normal paginado -->
    {#if !activeSearch.type}
        {#if recursos.length > 0}
            <div class="pagination-bar">
                <div class="pagination-left">
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label>Mostrar:</label>
                    <select bind:value={itemsPerPage} onchange={() => { currentPage=1; cargarRecursos(1); }}>
                        <option value={5}>5</option><option value={10}>10</option>
                        <option value={20}>20</option><option value={50}>50</option>
                    </select>
                    <span>por página</span>
                </div>
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
                <p class="empty">No hay recursos. Puedes cargar datos iniciales o crear uno nuevo.</p>
            {:else}
                <table class="table">
                    <thead>
                        <tr>
                            <th>País</th><th>Código</th><th>Año</th>
                            <th>Metilcloroformo</th><th>Bromuro de metilo</th>
                            <th>HCFC</th><th>Tetracloruro de carbono</th>
                            <th>Halon</th><th>CFC</th><th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each recursos as r (r.country + r.year)}
                        <tr>
                            <td>{r.country}</td>
                            <td>{r.code}</td>
                            <td>{r.year}</td>
                            <td>{r.methyl_chloroform}</td>
                            <td>{r.methyl_bromide}</td>
                            <td>{r.hcfc}</td>
                            <td>{r.carbon_tetrachloride}</td>
                            <td>{r.halon}</td>
                            <td>{r.cfc}</td>
                            <td class="action-cell">
                                <button onclick={() => iniciarEdicion(r)} class="btn-icon btn-edit" title="Editar">Editar</button>
                                <button onclick={() => eliminarRecurso(r)} class="btn-icon btn-delete" title="Eliminar">Borrar</button>
                            </td>
                        </tr>
                    {/each}
                    </tbody>
                </table>
            {/if}
        </section>

        {#if recursos.length > 0}
            <div class="pagination-bar bottom">
                <div class="pagination-right">
                    <button onclick={() => cargarRecursos(1)} disabled={currentPage===1} class="btn-page">⏮️</button>
                    <button onclick={() => cargarRecursos(currentPage-1)} disabled={currentPage===1} class="btn-page">◀</button>
                    <span class="page-info">{currentPage}/{totalPages}</span>
                    <button onclick={() => cargarRecursos(currentPage+1)} disabled={currentPage===totalPages} class="btn-page">▶</button>
                    <button onclick={() => cargarRecursos(totalPages)} disabled={currentPage===totalPages} class="btn-page">⏭️</button>
                </div>
            </div>
        {/if}
    {/if}
</div>

<style>
    /* Variables de color mejoradas */
    :root {
        --primary: #2c7da0;
        --primary-light: #61a5c2;
        --primary-dark: #1f5e7a;
        --secondary: #2a9d8f;
        --secondary-light: #6cbfaf;
        --danger: #e76f51;
        --danger-light: #f4a261;
        --warning: #e9c46a;
        --light: #f8f9fa;
        --dark: #264653;
        --gray: #6c757d;
        --gray-light: #e9ecef;
        --border: #dee2e6;
        --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
        --shadow-hover: 0 20px 25px -12px rgba(0, 0, 0, 0.15);
    }

    * {
        box-sizing: border-box;
    }

    .container {
        max-width: 1400px;
        margin: 0 auto;
    }

    header h1 {
        font-size: 2.5rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
        margin-bottom: 0.5rem;
        text-align: center;
    }

    /* Tarjetas */
    .card {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(2px);
        border-radius: 1.5rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
        box-shadow: var(--shadow);
        border: 1px solid rgba(255, 255, 255, 0.5);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-hover);
    }

    .create-card {
        border-left: 6px solid var(--secondary);
    }

    .edit-card {
        border-left: 6px solid var(--warning);
    }

    .results-card {
        border-left: 6px solid var(--primary);
    }

    /* Mensajes */
    .msg {
        padding: 1rem 1.5rem;
        border-radius: 1rem;
        margin-bottom: 1.5rem;
        font-weight: 500;
        backdrop-filter: blur(4px);
        animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
        from {
            transform: translateY(-20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .msg-success {
        background: rgba(42, 157, 143, 0.15);
        color: var(--secondary);
        border-left: 4px solid var(--secondary);
    }

    .msg-error {
        background: rgba(231, 111, 81, 0.15);
        color: var(--danger);
        border-left: 4px solid var(--danger);
    }

    /* Barra de acciones */
    .action-bar {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin: 2rem 0;
        justify-content: center;
    }

    /* Botones */
    button {
        padding: 0.7rem 1.4rem;
        border: none;
        border-radius: 2rem;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    button:active:not(:disabled) {
        transform: translateY(1px);
    }

    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-primary {
        background: var(--primary);
        color: white;
    }
    .btn-primary:hover:not(:disabled) {
        background: var(--primary-dark);
    }

    .btn-secondary {
        background: var(--gray);
        color: white;
    }
    .btn-secondary:hover:not(:disabled) {
        background: #5a626e;
    }

    .btn-sample {
        background: var(--secondary);
        color: white;
    }
    .btn-sample:hover:not(:disabled) {
        background: #21867a;
    }

    .btn-create {
        background: var(--primary);
        color: white;
    }

    .btn-danger {
        background: var(--danger);
        color: white;
    }
    .btn-danger:hover:not(:disabled) {
        background: #d45c3e;
    }

    .btn-refresh {
        background: var(--gray);
        color: white;
    }

    .btn-submit {
        background: var(--secondary);
        color: white;
    }

    .btn-cancel {
        background: var(--gray);
        color: white;
    }

    .btn-icon {
        padding: 0.5rem;
        font-size: 1.2rem;
        background: transparent;
        box-shadow: none;
        border-radius: 0.75rem;
    }
    .btn-icon:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.05);
        transform: scale(1.1);
    }
    .btn-edit {
        color: var(--warning);
    }
    .btn-delete {
        color: var(--danger);
    }

    .btn-page {
        padding: 0.4rem 0.8rem;
        background: var(--light);
        color: var(--dark);
        border: 1px solid var(--border);
        border-radius: 0.75rem;
    }

    /* Formularios de búsqueda */
    .search-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    .search-row {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: space-between;
    }
    .search-field {
        flex: 1;
        min-width: 160px;
    }
    .search-field label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.5rem;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: var(--gray);
    }
    .search-field input,
    .search-field select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: 1rem;
        background: white;
        transition: border 0.2s, box-shadow 0.2s;
        font-size: 0.9rem;
    }
    .search-field input:focus,
    .search-field select:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(44, 125, 160, 0.2);
    }
    .search-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 0.5rem;
    }

    .input-group {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        align-items: center;
    }
    .input-group select,
    .input-group input {
        flex: 1;
        padding: 0.6rem;
        border-radius: 1rem;
    }

    /* Formularios de creación/edición */
    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    .form-grid input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: 1rem;
        background: white;
        transition: border 0.2s;
        font-size: 0.9rem;
    }
    .form-grid input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(44, 125, 160, 0.2);
    }
    .readonly-field input {
        background: var(--gray-light);
        cursor: not-allowed;
    }
    .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }

    /* Tablas */
    .table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
        font-size: 0.9rem;
        border-radius: 1rem;
        overflow: hidden;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .table th,
    .table td {
        border-bottom: 1px solid var(--border);
        padding: 0.9rem 1rem;
        text-align: left;
    }
    .table th {
        background: var(--light);
        font-weight: 600;
        color: var(--dark);
        letter-spacing: 0.02em;
        text-transform: uppercase;
        font-size: 0.75rem;
    }
    .table tbody tr {
        transition: background 0.2s;
    }
    .table tbody tr:nth-child(even) {
        background-color: rgba(0, 0, 0, 0.01);
    }
    .table tbody tr:hover {
        background-color: rgba(44, 125, 160, 0.05);
    }
    .action-cell {
        display: flex;
        gap: 0.5rem;
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
        border-radius: 2rem;
        box-shadow: var(--shadow);
    }
    .pagination-left,
    .pagination-right {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .page-info {
        padding: 0.25rem 0.8rem;
        background: var(--light);
        border-radius: 2rem;
        font-weight: 500;
        font-size: 0.9rem;
    }
    .bottom {
        justify-content: center;
    }

    /* Estados */
    .loading,
    .empty {
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
        .search-row {
            flex-direction: column;
        }
        .action-bar {
            flex-direction: column;
            align-items: stretch;
        }
        .pagination-bar {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
        }
        .pagination-left,
        .pagination-right {
            justify-content: center;
        }
        .table {
            font-size: 0.8rem;
        }
        .table th,
        .table td {
            padding: 0.6rem 0.5rem;
        }
        .btn-icon {
            padding: 0.3rem;
        }
    }
</style>