<script>
    // @ts-nocheck
    let recursos = $state([]);
    let loading = $state(false);
    let error = $state(null);
    let successMessage = $state(null);

    // Estado para paginación
    let currentPage = $state(1);
    let itemsPerPage = $state(5);
    let totalItems = $state(0);
    let totalPages = $state(1);
    let paginationData = $state(null);

    // Estado para el formulario de edición
    let editando = $state(null);
    let showEditForm = $state(false);

    // Control de visibilidad del formulario de creación
    let showCreateForm = $state(false);

    // Datos del formulario de creación
    let newCountry = $state('');
    let newCode = $state('');
    let newYear = $state('');
    let newMethylChloroform = $state('');
    let newMethylBromide = $state('');
    let newHcfc = $state('');
    let newCarbonTetrachloride = $state('');
    let newHalon = $state('');
    let newCfc = $state('');

    // Datos del formulario de edición
    let editForm = $state({
        country: '',
        code: '',
        year: '',
        methyl_chloroform: '',
        methyl_bromide: '',
        hcfc: '',
        carbon_tetrachloride: '',
        halon: '',
        cfc: ''
    });

    // Estado para búsquedas y filtros
    let searchField = $state('country');
    let searchValue = $state('');
    let searchResults = $state(null);
    let searchError = $state(null);
    let searchMode = $state(false);
    let searchLoading = $state(false);

    // Filtro por rango
    let fromYear = $state('');
    let toYear = $state('');
    let rangeResults = $state(null);
    let rangeError = $state(null);
    let rangeMode = $state(false);

    // Búsqueda de recurso concreto
    let concreteCountry = $state('');
    let concreteYear = $state('');
    let concreteResult = $state(null);
    let concreteError = $state(null);
    let concreteMode = $state(false);

    // Búsqueda de campo (ej. /year)
    let fieldName = $state('year');
    let fieldResults = $state(null);
    let fieldError = $state(null);
    let fieldMode = $state(false);

    import { dev } from "$app/environment";

    // API v2
    let API_BASE = '/api/v2/ozone-depleting-substance-consumptions';
    if (dev) {
        API_BASE = 'http://localhost:3000' + API_BASE;
    }

    // Limpiar mensajes después de 5 segundos
    function limpiarMensajes() {
        setTimeout(() => {
            error = null;
            successMessage = null;
            searchError = null;
            rangeError = null;
            concreteError = null;
            fieldError = null;
        }, 5000);
    }

    // Cargar recursos con paginación
    async function cargarRecursos(page = currentPage, mostrarMensajeExito = false) {
        searchMode = false;
        rangeMode = false;
        concreteMode = false;
        fieldMode = false;
        showCreateForm = false; // Ocultar formulario al cambiar de vista

        loading = true;
        error = null;
        try {
            const url = `${API_BASE}?page=${page}&items=${itemsPerPage}&t=${Date.now()}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const data = await res.json();

            recursos = data.data || [];
            paginationData = data;

            if (paginationData) {
                totalItems = paginationData.total_items;
                totalPages = paginationData.total_paginas;
                currentPage = paginationData.pagina_actual;
            }

            if (recursos.length === 0 && currentPage > 1) {
                goToPage(1);
            }

            if (mostrarMensajeExito) {
                successMessage = 'Lista actualizada correctamente.';
            }
        } catch (e) {
            error = 'No se pudieron cargar los datos. Por favor, inténtalo de nuevo más tarde.';
        } finally {
            loading = false;
            limpiarMensajes();
        }
    }

    // Cambiar de página
    function goToPage(page) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            cargarRecursos(page);
        }
    }

    // Cambiar items por página
    function changeItemsPerPage() {
        currentPage = 1;
        cargarRecursos(1);
    }

    // Cargar datos de ejemplo
    async function cargarEjemplo() {
        loading = true;
        error = null;
        try {
            await fetch(API_BASE, { method: 'DELETE' });
            const res = await fetch(API_BASE + '/loadInitialData');
            if (!res.ok) throw new Error(`Error ${res.status}`);
            successMessage = 'Se han cargado 11 registros de ejemplo.';
            await cargarRecursos(1);
        } catch (e) {
            error = 'No se pudieron cargar los datos de ejemplo. Comprueba la conexión con el servidor.';
        } finally {
            loading = false;
            limpiarMensajes();
        }
    }

    // Búsqueda por campo
    async function buscarPorCampo() {
        if (!searchValue.trim()) {
            searchError = 'Por favor, introduce un valor para buscar.';
            return;
        }
        searchLoading = true;
        searchError = null;
        searchResults = null;
        searchMode = true;
        rangeMode = false;
        concreteMode = false;
        fieldMode = false;

        try {
            const url = `${API_BASE}?${searchField}=${encodeURIComponent(searchValue)}`;
            const res = await fetch(url);
            if (!res.ok) {
                if (res.status === 404) {
                    searchResults = [];
                    searchError = `No se encontraron recursos con ${searchField} = "${searchValue}".`;
                    return;
                }
                throw new Error(`Error ${res.status}`);
            }
            const data = await res.json();
            searchResults = data;
            if (searchResults.length === 0) {
                searchError = `No se encontraron recursos con ${searchField} = "${searchValue}".`;
            }
        } catch (e) {
            searchError = 'Error al realizar la búsqueda. Inténtalo de nuevo.';
        } finally {
            searchLoading = false;
            limpiarMensajes();
        }
    }

    // Búsqueda por rango
    async function buscarPorRango() {
        if (!fromYear && !toYear) {
            rangeError = 'Debes indicar al menos un año (desde o hasta).';
            return;
        }
        rangeError = null;
        rangeResults = null;
        rangeMode = true;
        searchMode = false;
        concreteMode = false;
        fieldMode = false;
        searchLoading = true;

        try {
            let url = `${API_BASE}?`;
            if (fromYear) url += `from=${fromYear}&`;
            if (toYear) url += `to=${toYear}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const data = await res.json();
            rangeResults = data;
            if (rangeResults.length === 0) {
                rangeError = `No hay recursos entre ${fromYear || 'inicio'} y ${toYear || 'fin'}.`;
            }
        } catch (e) {
            rangeError = 'Error en la búsqueda por rango.';
        } finally {
            searchLoading = false;
            limpiarMensajes();
        }
    }

    // Recurso concreto
    async function buscarConcreto() {
        if (!concreteCountry.trim() || !concreteYear) {
            concreteError = 'Debes introducir país y año.';
            return;
        }
        concreteError = null;
        concreteResult = null;
        concreteMode = true;
        searchMode = false;
        rangeMode = false;
        fieldMode = false;
        searchLoading = true;

        try {
            const url = `${API_BASE}/${encodeURIComponent(concreteCountry)}/${concreteYear}`;
            const res = await fetch(url);
            if (res.status === 404) {
                concreteError = `No existe un recurso con país "${concreteCountry}" y año ${concreteYear}.`;
                return;
            }
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const data = await res.json();
            concreteResult = data;
        } catch (e) {
            concreteError = 'Error al buscar el recurso concreto.';
        } finally {
            searchLoading = false;
            limpiarMensajes();
        }
    }

    // Valores de un campo
    async function buscarCampo() {
        if (!fieldName) {
            fieldError = 'Selecciona un campo.';
            return;
        }
        fieldError = null;
        fieldResults = null;
        fieldMode = true;
        searchMode = false;
        rangeMode = false;
        concreteMode = false;
        searchLoading = true;

        try {
            const url = `${API_BASE}/${fieldName}`;
            const res = await fetch(url);
            if (res.status === 404) {
                fieldError = `El campo "${fieldName}" no existe.`;
                return;
            }
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const data = await res.json();
            fieldResults = data;
        } catch (e) {
            fieldError = 'Error al obtener los valores del campo.';
        } finally {
            searchLoading = false;
            limpiarMensajes();
        }
    }

    // Crear recurso
    async function crearRecurso(event) {
        event.preventDefault();
        loading = true;
        error = null;

        const payload = {
            country: newCountry.toLowerCase(),
            code: newCode.toLowerCase(),
            year: parseInt(newYear),
            methyl_chloroform: parseFloat(newMethylChloroform) || 0,
            methyl_bromide: parseFloat(newMethylBromide) || 0,
            hcfc: parseFloat(newHcfc) || 0,
            carbon_tetrachloride: parseFloat(newCarbonTetrachloride) || 0,
            halon: parseFloat(newHalon) || 0,
            cfc: parseFloat(newCfc) || 0
        };

        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.status === 409) {
                throw new Error(`Ya existe un recurso con el país "${newCountry}" y el año ${newYear}.`);
            }
            if (res.status === 400) {
                throw new Error('Los datos enviados no son válidos. Revisa que todos los campos obligatorios estén completos y con el formato correcto.');
            }
            if (!res.ok) {
                throw new Error('Error al crear el recurso. Inténtalo de nuevo más tarde.');
            }

            newCountry = newCode = newYear = newMethylChloroform = newMethylBromide = newHcfc = newCarbonTetrachloride = newHalon = newCfc = '';
            successMessage = 'Recurso creado correctamente.';
            showCreateForm = false; // Ocultar formulario tras crear
            await cargarRecursos(1);
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
            limpiarMensajes();
        }
    }

    function iniciarEdicion(recurso) {
        editando = recurso;
        editForm = { ...recurso };
        showEditForm = true;
        setTimeout(() => {
            document.getElementById('edit-form')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    function cancelarEdicion() {
        showEditForm = false;
        editando = null;
    }

    async function guardarEdicion(event) {
        event.preventDefault();
        if (!editando) return;
        loading = true;
        error = null;

        const payload = {
            country: editForm.country,
            code: editForm.code,
            year: editForm.year,
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

            if (res.status === 404) {
                throw new Error(`No se encontró el recurso "${editando.country}" (${editando.year}) para actualizar. Puede que haya sido eliminado.`);
            }
            if (res.status === 400) {
                throw new Error('Los datos enviados no son válidos. Revisa los campos e inténtalo de nuevo.');
            }
            if (!res.ok) {
                throw new Error('Error al actualizar el recurso. Inténtalo de nuevo.');
            }

            successMessage = 'Recurso actualizado correctamente.';
            cancelarEdicion();
            await cargarRecursos(currentPage);
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
            limpiarMensajes();
        }
    }

    async function eliminarRecurso(recurso) {
        if (!confirm(`¿Estás seguro de que quieres eliminar el recurso de ${recurso.country} (${recurso.year})?`)) return;
        loading = true;
        error = null;
        try {
            const res = await fetch(`${API_BASE}/${recurso.country}/${recurso.year}`, {
                method: 'DELETE'
            });

            if (res.status === 404) {
                throw new Error(`No se encontró el recurso "${recurso.country}" (${recurso.year}) para eliminar. Puede que ya no exista.`);
            }
            if (!res.ok) {
                throw new Error('Error al eliminar el recurso. Inténtalo de nuevo.');
            }

            successMessage = 'Recurso eliminado correctamente.';
            await cargarRecursos(currentPage);
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
            limpiarMensajes();
        }
    }

    async function eliminarTodos() {
        if (!confirm('¿Estás seguro de que quieres eliminar TODOS los recursos? Esta acción no se puede deshacer.')) return;
        loading = true;
        error = null;
        successMessage = null;
        try {
            const res = await fetch(API_BASE, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al eliminar todos los recursos');

            await cargarRecursos(1, false);
            successMessage = 'Todos los recursos han sido eliminados.';
        } catch (e) {
            error = 'Error al eliminar todos los recursos. Inténtalo de nuevo.';
        } finally {
            loading = false;
            limpiarMensajes();
        }
    }

    // Cargar al montar
    cargarRecursos(1);
</script>

<!-- Mensajes de éxito y error -->
{#if successMessage}
    <div class="msg msg-success">{successMessage}</div>
{/if}
{#if error}
    <div class="msg msg-error">{error}</div>
{/if}

<div class="container">
    <header class="header">
        <h1>🌍 Gestión de consumo de sustancias que agotan la capa de ozono</h1>
        <p class="subtitle">API v2 · Panel de administración</p>
    </header>

    <!-- SECCIÓN DE BÚSQUEDAS Y FILTROS -->
    <section class="card">
        <h2>🔍 Búsquedas y filtros</h2>
        <div class="search-grid">
            <!-- Por campo -->
            <div class="search-item">
                <label>Buscar por campo</label>
                <div class="input-group">
                    <select bind:value={searchField}>
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
                    <input type="text" bind:value={searchValue} placeholder="Valor" />
                    <button onclick={buscarPorCampo} disabled={searchLoading} class="btn-primary">Buscar</button>
                </div>
                {#if searchError}<span class="error-text">{searchError}</span>{/if}
            </div>

            <!-- Rango de años -->
            <div class="search-item">
                <label>Filtrar por rango de años</label>
                <div class="input-group">
                    <input type="number" bind:value={fromYear} placeholder="Desde" />
                    <input type="number" bind:value={toYear} placeholder="Hasta" />
                    <button onclick={buscarPorRango} disabled={searchLoading} class="btn-primary">Filtrar</button>
                </div>
                {#if rangeError}<span class="error-text">{rangeError}</span>{/if}
            </div>

            <!-- Recurso concreto -->
            <div class="search-item">
                <label>Buscar recurso concreto</label>
                <div class="input-group">
                    <input type="text" bind:value={concreteCountry} placeholder="País" />
                    <input type="number" bind:value={concreteYear} placeholder="Año" />
                    <button onclick={buscarConcreto} disabled={searchLoading} class="btn-primary">Buscar</button>
                </div>
                {#if concreteError}<span class="error-text">{concreteError}</span>{/if}
            </div>

            <!-- Valores de un campo -->
            <div class="search-item">
                <label>Ver todos los valores de un campo</label>
                <div class="input-group">
                    <select bind:value={fieldName}>
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
                    <button onclick={buscarCampo} disabled={searchLoading} class="btn-primary">Ver</button>
                </div>
                {#if fieldError}<span class="error-text">{fieldError}</span>{/if}
            </div>
        </div>
        <div class="search-actions">
            <button onclick={() => cargarRecursos(1)} class="btn-secondary">🗂️ Volver a lista paginada</button>
        </div>
    </section>

    <!-- Botones de acción global -->
    <div class="action-bar">
        <button onclick={cargarEjemplo} disabled={loading} class="btn-sample">📥 Cargar datos de ejemplo</button>
        <button onclick={() => { showCreateForm = !showCreateForm; }} class="btn-create">
            {showCreateForm ? '✖️ Cerrar' : '➕ Nuevo recurso'}
        </button>
        <button onclick={eliminarTodos} disabled={loading} class="btn-danger">🗑️ Eliminar todos</button>
        <button onclick={() => cargarRecursos(currentPage, true)} disabled={loading} class="btn-refresh">🔄 Actualizar lista</button>
    </div>

    <!-- Formulario de creación (visible solo si showCreateForm es true) -->
    {#if showCreateForm}
        <section class="card create-card">
            <h2>➕ Crear nuevo recurso</h2>
            <form onsubmit={crearRecurso}>
                <div class="form-grid">
                    <input type="text" bind:value={newCountry} placeholder="País *" required />
                    <input type="text" bind:value={newCode} placeholder="Código *" required />
                    <input type="number" bind:value={newYear} placeholder="Año *" required />
                    <input type="number" step="any" bind:value={newMethylChloroform} placeholder="Metilcloroformo" />
                    <input type="number" step="any" bind:value={newMethylBromide} placeholder="Bromuro de metilo" />
                    <input type="number" step="any" bind:value={newHcfc} placeholder="HCFC" />
                    <input type="number" step="any" bind:value={newCarbonTetrachloride} placeholder="Tetracloruro de carbono" />
                    <input type="number" step="any" bind:value={newHalon} placeholder="Halon" />
                    <input type="number" step="any" bind:value={newCfc} placeholder="CFC" />
                </div>
                <div class="form-actions">
                    <button type="submit" disabled={loading} class="btn-submit">Guardar recurso</button>
                    <button type="button" onclick={() => showCreateForm = false} class="btn-cancel">Cancelar</button>
                </div>
            </form>
        </section>
    {/if}

    <!-- Formulario de edición (vista separada) -->
    {#if showEditForm && editando}
        <section id="edit-form" class="card edit-card">
            <h2>✏️ Editando: {editando.country} ({editando.year})</h2>
            <form onsubmit={guardarEdicion}>
                <div class="form-grid">
                    <div class="readonly-field">
                        <label>País:</label>
                        <input type="text" bind:value={editForm.country} readonly disabled />
                    </div>
                    <div>
                        <label>Código:</label>
                        <input type="text" bind:value={editForm.code} required />
                    </div>
                    <div class="readonly-field">
                        <label>Año:</label>
                        <input type="number" bind:value={editForm.year} readonly disabled />
                    </div>
                    <div>
                        <label>Metilcloroformo:</label>
                        <input type="number" step="any" bind:value={editForm.methyl_chloroform} />
                    </div>
                    <div>
                        <label>Bromuro de metilo:</label>
                        <input type="number" step="any" bind:value={editForm.methyl_bromide} />
                    </div>
                    <div>
                        <label>HCFC:</label>
                        <input type="number" step="any" bind:value={editForm.hcfc} />
                    </div>
                    <div>
                        <label>Tetracloruro de carbono:</label>
                        <input type="number" step="any" bind:value={editForm.carbon_tetrachloride} />
                    </div>
                    <div>
                        <label>Halon:</label>
                        <input type="number" step="any" bind:value={editForm.halon} />
                    </div>
                    <div>
                        <label>CFC:</label>
                        <input type="number" step="any" bind:value={editForm.cfc} />
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" disabled={loading} class="btn-submit">Guardar cambios</button>
                    <button type="button" onclick={cancelarEdicion} class="btn-cancel">Cancelar</button>
                </div>
            </form>
        </section>
    {/if}

    <!-- Mostrar resultados de búsquedas -->
    {#if searchMode}
        <section class="card results-card">
            <h3>Resultados de búsqueda por {searchField} = "{searchValue}"</h3>
            {#if searchLoading}
                <p class="loading">Buscando...</p>
            {:else if searchError}
                <p class="error-text">{searchError}</p>
            {:else if searchResults && searchResults.length > 0}
                <table class="table">
                    <thead>
                        <tr>
                            <th>País</th><th>Código</th><th>Año</th><th>Metilcloroformo</th><th>Bromuro de metilo</th>
                            <th>HCFC</th><th>Tetracloruro de carbono</th><th>Halon</th><th>CFC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each searchResults as item (item.country + item.year)}
                            <tr>
                                <td>{item.country}</td><td>{item.code}</td><td>{item.year}</td>
                                <td>{item.methyl_chloroform}</td><td>{item.methyl_bromide}</td>
                                <td>{item.hcfc}</td><td>{item.carbon_tetrachloride}</td>
                                <td>{item.halon}</td><td>{item.cfc}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {:else}
                <p>No hay resultados.</p>
            {/if}
        </section>
    {/if}

    {#if rangeMode}
        <section class="card results-card">
            <h3>Resultados de filtro por rango {fromYear ? `desde ${fromYear}` : ''} {toYear ? `hasta ${toYear}` : ''}</h3>
            {#if searchLoading}
                <p class="loading">Buscando...</p>
            {:else if rangeError}
                <p class="error-text">{rangeError}</p>
            {:else if rangeResults && rangeResults.length > 0}
                <table class="table">
                    <thead>
                        <tr>
                            <th>País</th><th>Código</th><th>Año</th><th>Metilcloroformo</th><th>Bromuro de metilo</th>
                            <th>HCFC</th><th>Tetracloruro de carbono</th><th>Halon</th><th>CFC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each rangeResults as item (item.country + item.year)}
                            <tr>
                                <td>{item.country}</td><td>{item.code}</td><td>{item.year}</td>
                                <td>{item.methyl_chloroform}</td><td>{item.methyl_bromide}</td>
                                <td>{item.hcfc}</td><td>{item.carbon_tetrachloride}</td>
                                <td>{item.halon}</td><td>{item.cfc}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {:else}
                <p>No hay resultados.</p>
            {/if}
        </section>
    {/if}

    {#if concreteMode}
        <section class="card results-card">
            <h3>Recurso concreto: {concreteCountry} / {concreteYear}</h3>
            {#if searchLoading}
                <p class="loading">Buscando...</p>
            {:else if concreteError}
                <p class="error-text">{concreteError}</p>
            {:else if concreteResult}
                <table class="table">
                    <thead>
                        <tr>
                            <th>País</th><th>Código</th><th>Año</th><th>Metilcloroformo</th><th>Bromuro de metilo</th>
                            <th>HCFC</th><th>Tetracloruro de carbono</th><th>Halon</th><th>CFC</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{concreteResult.country}</td><td>{concreteResult.code}</td><td>{concreteResult.year}</td>
                            <td>{concreteResult.methyl_chloroform}</td><td>{concreteResult.methyl_bromide}</td>
                            <td>{concreteResult.hcfc}</td><td>{concreteResult.carbon_tetrachloride}</td>
                            <td>{concreteResult.halon}</td><td>{concreteResult.cfc}</td>
                        </tr>
                    </tbody>
                </table>
            {/if}
        </section>
    {/if}

    {#if fieldMode}
        <section class="card results-card">
            <h3>Valores del campo "{fieldName}"</h3>
            {#if searchLoading}
                <p class="loading">Buscando...</p>
            {:else if fieldError}
                <p class="error-text">{fieldError}</p>
            {:else if fieldResults && fieldResults.length > 0}
                <div class="value-list">
                    {#each fieldResults as val (val)}
                        <span class="value-tag">{val}</span>
                    {/each}
                </div>
            {:else}
                <p>No hay valores.</p>
            {/if}
        </section>
    {/if}

    <!-- Listado normal paginado -->
    {#if !searchMode && !rangeMode && !concreteMode && !fieldMode}
        <!-- Controles de paginación superior -->
        {#if recursos.length > 0}
            <div class="pagination-bar">
                <div class="pagination-left">
                    <label>Mostrar:</label>
                    <select bind:value={itemsPerPage} onchange={changeItemsPerPage}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                    <span>por página</span>
                </div>
                <div class="pagination-right">
                    <button onclick={() => goToPage(1)} disabled={currentPage === 1} class="btn-page">⏮️</button>
                    <button onclick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} class="btn-page">◀</button>
                    <span class="page-info">Pág. {currentPage} de {totalPages} ({totalItems} total)</span>
                    <button onclick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} class="btn-page">▶</button>
                    <button onclick={() => goToPage(totalPages)} disabled={currentPage === totalPages} class="btn-page">⏭️</button>
                </div>
            </div>
        {/if}

        <!-- Tabla de recursos -->
        <section class="card">
            {#if loading}
                <p class="loading">Cargando...</p>
            {:else if recursos.length === 0}
                <p class="empty">No hay recursos para mostrar. Puedes cargar datos de ejemplo o crear uno nuevo.</p>
            {:else}
                <table class="table">
                    <thead>
                        <tr>
                            <th>País</th><th>Código</th><th>Año</th><th>Metilcloroformo</th><th>Bromuro de metilo</th>
                            <th>HCFC</th><th>Tetracloruro de carbono</th><th>Halon</th><th>CFC</th><th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each recursos as recurso (recurso.country + recurso.year)}
                            <tr>
                                <td>{recurso.country}</td>
                                <td>{recurso.code}</td>
                                <td>{recurso.year}</td>
                                <td>{recurso.methyl_chloroform}</td>
                                <td>{recurso.methyl_bromide}</td>
                                <td>{recurso.hcfc}</td>
                                <td>{recurso.carbon_tetrachloride}</td>
                                <td>{recurso.halon}</td>
                                <td>{recurso.cfc}</td>
                                <td class="action-cell">
                                    <button onclick={() => iniciarEdicion(recurso)} disabled={loading} class="btn-icon btn-edit" title="Editar">✏️</button>
                                    <button onclick={() => eliminarRecurso(recurso)} disabled={loading} class="btn-icon btn-delete" title="Eliminar">🗑️</button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
        </section>

        <!-- Paginación inferior -->
        {#if recursos.length > 0}
            <div class="pagination-bar bottom">
                <div class="pagination-right">
                    <button onclick={() => goToPage(1)} disabled={currentPage === 1} class="btn-page">⏮️</button>
                    <button onclick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} class="btn-page">◀</button>
                    <span class="page-info">{currentPage}/{totalPages}</span>
                    <button onclick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} class="btn-page">▶</button>
                    <button onclick={() => goToPage(totalPages)} disabled={currentPage === totalPages} class="btn-page">⏭️</button>
                </div>
            </div>
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