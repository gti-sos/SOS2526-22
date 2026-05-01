<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';

    let canvas = $state();
    let chartInstance = null;
    let tableData = $state([]);

    // Limpieza estricta para comparar nombres de países sin errores por espacios o tildes
    function clean(t) {
        return t?.toString()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim() || "";
    }

    async function loadIntegration() {
        try {
            // 1. Fetch de datos reales (SIN datos de carga inicial forzada ni precargados)
            const [resExport, resAgri] = await Promise.all([
                fetch("https://sos2526-13.onrender.com/api/v1/exportations-stats"),
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts")
            ]);

            const dataExport = resExport.ok ? await resExport.json() : [];
            const dataAgri = resAgri.ok ? await resAgri.json() : [];

            // 2. CREACIÓN DE MAPA DINÁMICO (Cruza los datos de ambas APIs)
            const statsMap = new Map();

            // Procesar Exportaciones: creamos la entrada en el mapa
            dataExport.forEach(item => {
                const name = item.country || item.province || item.territory;
                if (name) {
                    const key = clean(name);
                    statsMap.set(key, {
                        country: name,
                        exportVal: Number(item.tiv_total_order || item.tiv_total_export || 0),
                        temp: 0 // Se llenará si coincide con la otra API
                    });
                }
            });

            // Procesar Agricultura: si el país ya existe, añade la temperatura. Si no, crea entrada nueva.
            dataAgri.forEach(item => {
                const name = item.country || item.province || item.territory;
                if (name) {
                    const key = clean(name);
                    if (statsMap.has(key)) {
                        statsMap.get(key).temp = Number(item.average_temperature_c || 0);
                    } else {
                        statsMap.set(key, {
                            country: name,
                            exportVal: 0,
                            temp: Number(item.average_temperature_c || 0)
                        });
                    }
                }
            });

            // Convertir mapa a array y filtrar para que la gráfica tenga sentido (solo datos > 0)
            tableData = Array.from(statsMap.values())
                .filter(d => d.exportVal > 0 || d.temp > 0)
                .slice(0, 10); // Limitamos a 10 para claridad visual

            // 3. Renderizar Gráfica Doughnut
            await tick();
            if (canvas && tableData.length > 0) {
                if (chartInstance) chartInstance.destroy();
                chartInstance = new Chart(canvas, {
                    type: 'doughnut',
                    data: {
                        labels: tableData.map(p => p.country),
                        datasets: [
                            {
                                label: 'Exportaciones (TIV)',
                                data: tableData.map(p => p.exportVal),
                                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC1C2', '#9966FF', '#FF9F40'],
                                weight: 0.6
                            },
                            {
                                label: 'Temperatura (ºC)',
                                data: tableData.map(p => p.temp),
                                backgroundColor: ['#FF6384AA', '#36A2EBAA', '#FFCE56AA', '#4BC1C2AA', '#9966FFAA', '#FF9F40AA'],
                                weight: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' },
                            title: { display: true, text: 'Integración Real Clima y Exportación' }
                        }
                    }
                });
            }
        } catch (error) {
            console.error("Error crítico en la integración:", error);
        }
    }

    onMount(loadIntegration);
</script>

<div class="container">
    {#if tableData.length === 0}
        <div class="loading-state">
            <p>Conectando con las APIs...</p>
            <p><small>Si no aparecen datos, asegúrate de que los recursos en Render tengan datos cargados.</small></p>
        </div>
    {:else}
        <div class="chart-wrapper">
            <canvas bind:this={canvas}></canvas>
        </div>

        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>País</th>
                        <th>Temperatura (ºC)</th>
                        <th>Exportación (TIV)</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tableData as item}
                        <tr>
                            <td>{item.country}</td>
                            <td class="text-temp">{item.temp} ºC</td>
                            <td class="text-export">{item.exportVal}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<style>
    .container { display: flex; flex-direction: column; align-items: center; gap: 2rem; padding: 20px; font-family: sans-serif; }
    .chart-wrapper { position: relative; height: 450px; width: 100%; max-width: 600px; background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .table-wrapper { width: 100%; max-width: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    table { width: 100%; border-collapse: collapse; background: white; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #2d3748; color: white; }
    .text-temp { color: #e53e3e; font-weight: bold; }
    .text-export { color: #3182ce; font-weight: bold; }
    .loading-state { text-align: center; margin-top: 50px; color: #555; }
</style>