<script>
    // @ts-nocheck
    import { onMount } from 'svelte';

    // ESTADOS (Svelte 5) - Requisito L07 [cite: 902]
    let recursos = $state([]);
    let loading = $state(false);
    let error = $state(null);
    let successMessage = $state(null);

    // Campos para creación (Julio)
    let newCountry = $state('');
    let newYear = $state('');
    let newSavannaFire = $state(0);
    let newForestFire = $state(0);
    let newCropResidues = $state(0);
    let newRiceCultivation = $state(0);
    let newDrainedOrganic = $state(0);
    let newPesticidesManufacturing = $state(0);
    let newFoodTransport = $state(0);

    // API v2
    const API_BASE = '/api/v2/co2-emission-gap-among-countries-clustering-pca';

    // Función para limpiar mensajes (Rúbrica F07: Mensajes informativos) [cite: 66, 70]
    function limpiarMensajes() {
        setTimeout(() => { error = null; successMessage = null; }, 5000);
    }

    // LISTAR (GET) [cite: 57]
    async function cargarRecursos() {
        loading = true;
        try {
            const res = await fetch(API_BASE);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            recursos = await res.json();
        } catch (e) {
            error = "No se pudieron cargar los datos.";
        } finally {
            loading = false;
            limpiarMensajes();
        }
    }

    // CARGAR INICIALES (GET /loadInitialData) [cite: 117]
    async function cargarEjemplo() {
        loading = true;
        try {
            const res = await fetch(`${API_BASE}/loadInitialData`);
            if (res.ok) {
                successMessage = "Se han cargado los datos de ejemplo.";
                await cargarRecursos();
            } else {
                error = "La base de datos ya tiene datos o hubo un error.";
            }
        } catch (e) {
            error = "Error de conexión.";
        } finally {
            loading = false;
            limpiarMensajes();
        }
    }

    // CREAR (POST) [cite: 56]
    async function crearRecurso(event) {
        event.preventDefault();
        const payload = {
            country: newCountry, year: parseInt(newYear),
            savanna_fire: parseFloat(newSavannaFire), forest_fire: parseFloat(newForestFire),
            crop_residues: parseFloat(newCropResidues), rice_cultivation: parseFloat(newRiceCultivation),
            drained_organic: parseFloat(newDrainedOrganic), pesticides_manufacturing: parseFloat(newPesticidesManufacturing),
            food_transport: parseFloat(newFoodTransport)
        };

        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.status === 201) {
            successMessage = "Recurso creado correctamente.";
            newCountry = ''; newYear = ''; // Limpiar campos
            cargarRecursos();
        } else if (res.status === 409) {
            error = "Ese recurso (país/año) ya existe.";
        } else {
            error = "Error al crear. Revisa los campos.";
        }
        limpiarMensajes();
    }

    // BORRAR UNO (DELETE) [cite: 59]
    async function eliminarRecurso(p, a) {
        if (!confirm(`¿Eliminar ${p} ${a}?`)) return;
        const res = await fetch(`${API_BASE}/${p}/${a}`, { method: 'DELETE' });
        if (res.ok) {
            successMessage = "Recurso eliminado.";
            cargarRecursos();
        } else {
            error = "No se pudo eliminar.";
        }
        limpiarMensajes();
    }

    // BORRAR TODOS (DELETE) [cite: 58]
    async function eliminarTodos() {
        if (!confirm("¿Borrar TODO?")) return;
        const res = await fetch(API_BASE, { method: 'DELETE' });
        if (res.ok) {
            successMessage = "Base de datos vaciada.";
            recursos = [];
        }
        limpiarMensajes();
    }

    onMount(cargarRecursos);
</script>

{#if successMessage}<div class="msg msg-success">{successMessage}</div>{/if}
{#if error}<div class="msg msg-error">{error}</div>{/if}

<div class="container">
    <header class="header">
        <h1>🌱 Gestión de Emisiones CO2</h1>
        <p class="subtitle">Julio Morales · API v2</p>
    </header>

    <div class="action-bar">
        <button onclick={cargarEjemplo} class="btn-sample">📥 Cargar datos iniciales</button>
        <button onclick={eliminarTodos} class="btn-danger">🗑️ Eliminar todos</button>
    </div>

    <section class="card">
        <table class="table">
            <thead>
                <tr>
                    <th>País</th><th>Año</th><th>Savanna</th><th>Forest</th><th>Residues</th><th>Rice</th><th>Organic</th><th>Pesticides</th><th>Transport</th><th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr class="create-row">
                    <td><input bind:value={newCountry} placeholder="País" /></td>
                    <td><input type="number" bind:value={newYear} placeholder="Año" /></td>
                    <td><input type="number" bind:value={newSavannaFire} /></td>
                    <td><input type="number" bind:value={newForestFire} /></td>
                    <td><input type="number" bind:value={newCropResidues} /></td>
                    <td><input type="number" bind:value={newRiceCultivation} /></td>
                    <td><input type="number" bind:value={newDrainedOrganic} /></td>
                    <td><input type="number" bind:value={newPesticidesManufacturing} /></td>
                    <td><input type="number" bind:value={newFoodTransport} /></td>
                    <td><button onclick={crearRecurso} class="btn-create">➕ Añadir</button></td>
                </tr>

                {#each recursos as r}
                <tr>
                    <td>{r.country}</td><td>{r.year}</td><td>{r.savanna_fire}</td><td>{r.forest_fire}</td><td>{r.crop_residues}</td>
                    <td>{r.rice_cultivation}</td><td>{r.drained_organic}</td><td>{r.pesticides_manufacturing}</td><td>{r.food_transport}</td>
                    <td class="action-cell">
                        <a href="co2-emissions-stats/{r.country}/{r.year}" class="btn-icon">✏️</a>
                        <button onclick={() => eliminarRecurso(r.country, r.year)} class="btn-icon btn-delete">🗑️</button>
                    </td>
                </tr>
                {/each}
            </tbody>
        </table>
    </section>
</div>

<style>
    /* Estilos del grupo (Uniformidad) */
    :root {
        --primary: #2c7da0;
        --secondary: #2a9d8f;
        --danger: #e76f51;
        --border: #dee2e6;
    }
    .container { max-width: 1400px; margin: 0 auto; font-family: sans-serif; }
    .header { text-align: center; margin-bottom: 20px; }
    .card { background: white; border-radius: 8px; padding: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { border: 1px solid var(--border); padding: 8px; text-align: center; }
    .table th { background: #f4f4f4; }
    .msg { padding: 10px; margin: 10px 0; border-radius: 5px; text-align: center; font-weight: bold; }
    .msg-success { background: #d4edda; color: #155724; }
    .msg-error { background: #f8d7da; color: #721c24; }
    .action-bar { display: flex; gap: 10px; justify-content: center; margin-bottom: 15px; }
    button { cursor: pointer; border: none; border-radius: 4px; padding: 8px 12px; }
    .btn-sample { background: var(--secondary); color: white; }
    .btn-danger { background: var(--danger); color: white; }
    .btn-create { background: var(--primary); color: white; width: 100%; }
    .btn-icon { text-decoration: none; font-size: 1.2rem; background: none; }
    .create-row input { width: 70px; padding: 4px; border: 1px solid #ccc; border-radius: 3px; }
</style>