<script>
    import { onMount } from 'svelte';
    
    // Conectamos con la API v2
    const API_URL = '/api/v2/global-agriculture-climate-impacts';
    
    let datos = [];
    let loading = false;
    let successMessage = null;
    let error = null;

    // Formularios
    let showCreateForm = false;
    let nuevoDato = { country: '', year: '', crop_type: '', average_temperature_c: '', total_precipitation_mm: '' };

    // Paginación
    let currentPage = 1;
    let itemsPerPage = 5;
    let totalItems = 0;
    let totalPages = 1;

    // Búsqueda
    let searchField = 'country';
    let searchValue = '';
    let fromYear = '';
    let toYear = '';
    let searchMode = false;

    function limpiarMensajes() {
        setTimeout(() => { successMessage = null; error = null; }, 5000);
    }

    // 1. CARGAR DATOS (CON PAGINACIÓN)
    async function cargarDatos(page = currentPage) {
        loading = true; searchMode = false; error = null;
        try {
            const res = await fetch(`${API_URL}?page=${page}&items=${itemsPerPage}`);
            if (!res.ok) throw new Error("Error al cargar los datos.");
            
            const data = await res.json();
            datos = data.data || [];
            totalItems = data.total_items;
            totalPages = data.total_paginas;
            currentPage = data.pagina_actual;
            
            if (datos.length === 0 && currentPage > 1) goToPage(1);
        } catch (e) {
            error = "No hay datos disponibles en la base de datos.";
            datos = [];
        } finally {
            loading = false; limpiarMensajes();
        }
    }

    function goToPage(page) {
        if (page >= 1 && page <= totalPages) cargarDatos(page);
    }

    // 2. BUSCAR DATOS (FILTROS)
    async function buscarDatos() {
        if (!searchValue.trim()) return;
        loading = true; searchMode = true; error = null;
        try {
            const res = await fetch(`${API_URL}?${searchField}=${encodeURIComponent(searchValue)}`);
            if (res.status === 404) throw new Error(`No se encontraron resultados para ${searchValue}`);
            if (!res.ok) throw new Error("Error en la búsqueda");
            
            datos = await res.json();
        } catch (e) {
            error = e.message; datos = [];
        } finally {
            loading = false; limpiarMensajes();
        }
    }

    async function buscarRango() {
        if (!fromYear && !toYear) return;
        loading = true; searchMode = true; error = null;
        try {
            let url = `${API_URL}?`;
            if (fromYear) url += `from=${fromYear}&`;
            if (toYear) url += `to=${toYear}`;
            const res = await fetch(url);
            if (res.status === 404) throw new Error("No hay datos en ese rango de años.");
            datos = await res.json();
        } catch (e) {
            error = e.message; datos = [];
        } finally {
            loading = false; limpiarMensajes();
        }
    }

    // 3. CREAR DATO
    async function crearDato(e) {
        e.preventDefault();
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoDato)
            });

            if (res.status === 201) {
                successMessage = `¡Registro creado con éxito!`;
                showCreateForm = false;
                nuevoDato = { country: '', year: '', crop_type: '', average_temperature_c: '', total_precipitation_mm: '' };
                cargarDatos(1);
            } else if (res.status === 409) {
                error = `Error: Ya existe un registro para ese país y año.`;
            } else {
                error = "Por favor, rellena todos los campos correctamente.";
            }
        } catch (e) { error = "Fallo de conexión al crear."; }
        limpiarMensajes();
    }

    // 4. BORRAR DATOS
    async function borrarDato(country, year) {
        if (!confirm(`¿Seguro que quieres borrar ${country} (${year})?`)) return;
        try {
            const res = await fetch(`${API_URL}/${country}/${year}`, { method: 'DELETE' });
            if (res.ok) { successMessage = "Borrado correctamente."; cargarDatos(currentPage); }
            else { error = "No se pudo borrar el dato."; }
        } catch (e) { error = "Fallo de conexión."; }
        limpiarMensajes();
    }

    async function borrarTodos() {
        if (!confirm("¡ATENCIÓN! ¿Seguro que quieres vaciar la base de datos entera?")) return;
        try {
            await fetch(API_URL, { method: 'DELETE' });
            successMessage = "Base de datos vaciada.";
            cargarDatos(1);
        } catch (e) { error = "Fallo al borrar todo."; }
        limpiarMensajes();
    }

    async function cargarIniciales() {
        try {
            await fetch(`${API_URL}/loadInitialData`);
            successMessage = "Datos de prueba cargados.";
            cargarDatos(1);
        } catch(e) { error = "Fallo al cargar datos."; }
        limpiarMensajes();
    }

    onMount(() => cargarDatos(1));
</script>

<main class="container">
    <header class="header">
        <h1>🌱 Impactos Climáticos en Agricultura</h1>
        <p class="subtitle">Panel de Gestión - API v2</p>
    </header>

    {#if successMessage} <div class="msg success">{successMessage}</div> {/if}
    {#if error} <div class="msg error">{error}</div> {/if}

    <section class="card">
        <h2>🔍 Búsquedas y Filtros</h2>
        <div class="search-grid">
            <div class="search-box">
                <label>Buscar por campo exacto:</label>
                <div class="input-group">
                    <select bind:value={searchField}>
                        <option value="country">País</option>
                        <option value="crop_type">Tipo de Cultivo</option>
                        <option value="year">Año</option>
                    </select>
                    <input type="text" bind:value={searchValue} placeholder="Valor..." />
                    <button class="btn primary" on:click={buscarDatos}>Buscar</button>
                </div>
            </div>

            <div class="search-box">
                <label>Filtrar por rango de Años:</label>
                <div class="input-group">
                    <input type="number" bind:value={fromYear} placeholder="Desde año" />
                    <input type="number" bind:value={toYear} placeholder="Hasta año" />
                    <button class="btn primary" on:click={buscarRango}>Filtrar</button>
                </div>
            </div>
        </div>
        {#if searchMode}
            <button class="btn secondary back-btn" on:click={() => cargarDatos(1)}>Volver a la lista completa</button>
        {/if}
    </section>

    <div class="actions-bar">
        <button class="btn action" on:click={cargarIniciales}>📥 Cargar Datos Base</button>
        <button class="btn action create" on:click={() => showCreateForm = !showCreateForm}>
            {showCreateForm ? '✖️ Cancelar' : '➕ Nuevo Registro'}
        </button>
        <button class="btn danger" on:click={borrarTodos}>🗑️ Borrar Todo</button>
    </div>

    {#if showCreateForm}
        <section class="card form-card">
            <h2>Añadir Nuevo Registro</h2>
            <form on:submit={crearDato} class="create-form">
                <input type="text" bind:value={nuevoDato.country} placeholder="País (Ej: Spain)" required />
                <input type="number" bind:value={nuevoDato.year} placeholder="Año (Ej: 2020)" required />
                <input type="text" bind:value={nuevoDato.crop_type} placeholder="Cultivo (Ej: Wheat)" required />
                <input type="number" step="any" bind:value={nuevoDato.average_temperature_c} placeholder="Temp Media ºC" required />
                <input type="number" step="any" bind:value={nuevoDato.total_precipitation_mm} placeholder="Precipitación mm" required />
                <button type="submit" class="btn success">Guardar</button>
            </form>
        </section>
    {/if}

    <section class="card">
        {#if loading}
            <p>Cargando datos...</p>
        {:else if datos.length === 0}
            <p>No hay registros disponibles. Prueba a cargar los datos base.</p>
        {:else}
            {#if !searchMode && totalPages > 1}
                <div class="pagination">
                    <button class="btn page" disabled={currentPage === 1} on:click={() => goToPage(currentPage - 1)}>◀ Anterior</button>
                    <span>Página {currentPage} de {totalPages}</span>
                    <button class="btn page" disabled={currentPage === totalPages} on:click={() => goToPage(currentPage + 1)}>Siguiente ▶</button>
                </div>
            {/if}

            <table class="table">
                <thead>
                    <tr>
                        <th>País</th><th>Año</th><th>Cultivo</th><th>Temp. Media (ºC)</th><th>Precipitaciones (mm)</th><th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {#each datos as dato}
                        <tr>
                            <td>{dato.country}</td><td>{dato.year}</td><td>{dato.crop_type}</td>
                            <td>{dato.average_temperature_c}</td><td>{dato.total_precipitation_mm}</td>
                            <td class="cell-actions">
                                <a class="btn edit" href="/global-agriculture-climate-impacts/{dato.country}/{dato.year}">Editar</a>
                                <button class="btn danger-small" on:click={() => borrarDato(dato.country, dato.year)}>X</button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    </section>
</main>

<style>
    .container { max-width: 1100px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', sans-serif; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { color: #2c7da0; margin-bottom: 5px; }
    .subtitle { color: #666; font-size: 1.1em; }

    .msg { padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: bold; }
    .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

    .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #eee; }
    .card h2 { margin-top: 0; color: #333; font-size: 1.3em; margin-bottom: 20px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }

    .search-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
    .input-group { display: flex; gap: 10px; margin-top: 8px; }
    .input-group select, .input-group input { padding: 10px; border: 1px solid #ccc; border-radius: 6px; flex: 1; }

    .actions-bar { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
    
    .btn { padding: 10px 15px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; text-decoration: none; color: white; display: inline-block; text-align: center; }
    .primary { background: #3498db; } .primary:hover { background: #2980b9; }
    .secondary { background: #95a5a6; } .secondary:hover { background: #7f8c8d; }
    .action { background: #2c3e50; } .action:hover { background: #1a252f; }
    .create { background: #27ae60; } .create:hover { background: #219653; }
    .danger { background: #e74c3c; margin-left: auto; } .danger:hover { background: #c0392b; }
    .success { background: #2ecc71; }
    .edit { background: #f39c12; padding: 6px 12px; font-size: 0.9em; } .edit:hover { background: #d68910; }
    .danger-small { background: #e74c3c; padding: 6px 12px; font-size: 0.9em; } .danger-small:hover { background: #c0392b; }
    .page { background: #ecf0f1; color: #333; } .page:disabled { opacity: 0.5; cursor: not-allowed; }

    .create-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; }
    .create-form input { padding: 10px; border: 1px solid #ccc; border-radius: 6px; }

    .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    .table th { background: #f8f9fa; color: #333; }
    .cell-actions { display: flex; gap: 5px; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: 20px; font-weight: bold; }
</style>