<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';

    let canvas = $state();
    let chartInstance = null;
    
    // CORRECCIÓN: Todas las variables que cambian y afectan al HTML deben ser $state
    let tableData = $state([]);
    let errorMessage = $state("");
    let loading = $state(true); 

    async function loadIntegration() {
        console.log("--- Iniciando carga con flujo corregido ---");
        loading = true;
        errorMessage = "";

        try {
            // 1. CARGA INICIAL
            const resLoad = await fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts/loadInitialData");
            
            if (!resLoad.ok && resLoad.status !== 409) {
                console.warn("La precarga de agricultura no devolvió el estado esperado.");
            }

            // 2. PETICIÓN DE DATOS
            const [resExport, resAgri] = await Promise.all([
                fetch("https://sos2526-13.onrender.com/api/v1/exportations-stats"),
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts")
            ]);

            // Verificación de estados
            if (!resExport.ok) console.error("Error en API Exportaciones:", resExport.status);
            if (!resAgri.ok) console.error("Error en API Agricultura:", resAgri.status);

            const dataExport = resExport.ok ? await resExport.json() : [];
            const dataAgri = resAgri.ok ? await resAgri.json() : [];

            const yearMap = new Map();

            // PROCESAR EXPORTACIONES
            dataExport.forEach(item => {
                const year = item.year_of_order || item.year; 
                if (year) {
                    if (!yearMap.has(year)) {
                        yearMap.set(year, { year, exportVal: 0, temp: 0, countries: new Set() });
                    }
                    const val = Number(item.tiv_total_order || 0);
                    yearMap.get(year).exportVal += val;
                    if(item.supplier) yearMap.get(year).countries.add(item.supplier);
                }
            });

            // PROCESAR AGRICULTURA
            dataAgri.forEach(item => {
                const year = item.year; 
                if (year) {
                    if (!yearMap.has(year)) {
                        yearMap.set(year, { year, exportVal: 0, temp: 0, countries: new Set() });
                    }
                    const currentData = yearMap.get(year);
                    if (item.average_temperature_c) {
                        currentData.temp = Number(item.average_temperature_c);
                    }
                    if(item.country) currentData.countries.add(item.country);
                }
            });

            // FILTRADO Y ORDENACIÓN
            const processedData = Array.from(yearMap.values())
                .filter(d => d.exportVal > 0 || d.temp !== 0)
                .sort((a, b) => a.year - b.year);

            if (processedData.length === 0) {
                errorMessage = "No se han podido cruzar los datos o las APIs están vacías.";
                loading = false;
                return;
            }

            tableData = processedData;
            loading = false;

            // Renderizado de la gráfica
            await tick();
            if (canvas) {
                if (chartInstance) chartInstance.destroy();
                chartInstance = new Chart(canvas, {
                    type: 'doughnut',
                    data: {
                        labels: tableData.map(d => `Año ${d.year}`),
                        datasets: [
                            {
                                label: 'Exportaciones (TIV)',
                                data: tableData.map(d => d.exportVal),
                                backgroundColor: ['#36A2EB', '#4BC0C0', '#9966FF', '#FF9F40', '#FFCD56'],
                                hoverOffset: 15
                            },
                            {
                                label: 'Temp Media (ºC)',
                                data: tableData.map(d => d.temp),
                                backgroundColor: ['#FF6384', '#FF6384CC', '#FF638499', '#FF638466', '#FF638433'],
                                weight: 0.6
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'right' },
                            title: { display: true, text: 'Relación Anual Clima vs Exportaciones' }
                        }
                    }
                });
            }
        } catch (error) {
            console.error("Error en la integración:", error);
            errorMessage = "Error de conexión con las APIs. Revisa la consola.";
            loading = false;
        }
    }

    onMount(() => {
        loadIntegration();
        return () => { if (chartInstance) chartInstance.destroy(); };
    });
</script>

<div class="container">
    {#if errorMessage}
        <div class="error-banner">
            <strong>Atención:</strong> {errorMessage}
        </div>
    {/if}

    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Conectando con APIs y procesando datos...</p>
        </div>
    {:else if tableData.length > 0}
        <div class="chart-wrapper">
            <canvas bind:this={canvas}></canvas>
        </div>

        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Año</th>
                        <th>Temperatura Media</th>
                        <th>Suma Exportaciones</th>
                        <th>Países Implicados</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tableData as item}
                        <tr>
                            <td><strong>{item.year}</strong></td>
                            <td class="text-temp">{item.temp > 0 ? item.temp.toFixed(2) + ' ºC' : 'Sin datos'}</td>
                            <td class="text-export">{item.exportVal.toLocaleString()}</td>
                            <td class="text-muted">
                                {Array.from(item.countries).slice(0,3).join(', ')}
                                {item.countries.size > 3 ? '...' : ''}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<style>
    /* Estilos base */
    .container { display: flex; flex-direction: column; align-items: center; gap: 2rem; padding: 20px; font-family: sans-serif; }
    .error-banner { width: 100%; max-width: 600px; padding: 15px; background-color: #fff5f5; color: #c53030; border: 1px solid #feb2b2; border-radius: 8px; text-align: center; }
    .chart-wrapper { position: relative; height: 450px; width: 100%; max-width: 600px; background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .table-wrapper { width: 100%; max-width: 800px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    table { width: 100%; border-collapse: collapse; background: white; }
    th, td { padding: 14px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #2d3748; color: white; }
    .text-temp { color: #e53e3e; font-weight: bold; }
    .text-export { color: #3182ce; font-weight: bold; }
    .text-muted { color: #718096; font-size: 0.85rem; }
    
    .loading-state { text-align: center; margin-top: 50px; color: #555; }
    .spinner { 
        width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; 
        border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>