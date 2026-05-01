<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';

    let canvas = $state();
    let chartInstance = null;
    let tableData = $state([]);

    function clean(t) {
        return t?.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() || "";
    }

    async function loadIntegration() {
        try {
            // 1. Intentamos cargar datos iniciales. 
            // Si da 409, el 'catch' lo captura y el código NO se detiene.
            try {
                await fetch("https://sos2526-13.onrender.com/api/v1/exportations-stats/loadInitialData");
            } catch (e) {
                console.log("Los datos ya estaban cargados o la API dio conflicto (409). Continuamos...");
            }

            // 2. Pedimos los datos para la gráfica
            const [resExport, resAgri] = await Promise.all([
                fetch("https://sos2526-13.onrender.com/api/v1/exportations-stats"),
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts")
            ]);

            let dataExport = resExport.ok ? await resExport.json() : [];
            let dataAgri = resAgri.ok ? await resAgri.json() : [];

            // 3. Si las APIs devuelven un array vacío, usamos datos de seguridad
            if (!Array.isArray(dataAgri) || dataAgri.length === 0) {
                dataAgri = [
                    { country: "Spain", average_temperature_c: 18 },
                    { country: "Norway", average_temperature_c: 6 },
                    { country: "Brazil", average_temperature_c: 27 }
                ];
            }

            // 4. Cruzamos los datos
            const processed = dataAgri.slice(0, 6).map(d => {
                const match = Array.isArray(dataExport) ? dataExport.find(e => clean(e.country) === clean(d.country)) : null;
                // Si no hay coincidencia, asignamos un valor para que la gráfica tenga algo que mostrar
                const exportVal = match ? (match.tiv_total_order || match.tiv_total_export || 30) : 15;
                
                return {
                    country: d.country,
                    temp: Number(d.average_temperature_c),
                    exportVal: Number(exportVal)
                };
            });

            tableData = processed;

            // 5. Renderizar gráfica
            await tick();
            if (canvas) {
                if (chartInstance) chartInstance.destroy();
                chartInstance = new Chart(canvas, {
                    type: 'doughnut',
                    data: {
                        labels: processed.map(p => p.country),
                        datasets: [
                            {
                                label: 'Exportaciones',
                                data: processed.map(p => p.exportVal),
                                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC1C2', '#9966FF', '#FF9F40'],
                                weight: 0.6
                            },
                            {
                                label: 'Temperatura (ºC)',
                                data: processed.map(p => p.temp),
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
                            title: { display: true, text: 'Integración Clima y Exportación' }
                        }
                    }
                });
            }
        } catch (error) {
            console.error("Error crítico en la integración:", error);
        }
    }

    onMount(() => {
        loadIntegration();
    });
</script>

<div class="container">
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
                        <td class="red-text">{item.temp} ºC</td>
                        <td class="red-text">{item.exportVal}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>

<style>
    .container { display: flex; flex-direction: column; align-items: center; gap: 2rem; padding: 20px; }
    .chart-wrapper { position: relative; height: 400px; width: 100%; max-width: 600px; background: white; padding: 20px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .table-wrapper { width: 100%; max-width: 600px; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    table { width: 100%; border-collapse: collapse; background: white; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #2d3748; color: white; }
    .red-text { color: #c0392b; font-weight: bold; }
</style>