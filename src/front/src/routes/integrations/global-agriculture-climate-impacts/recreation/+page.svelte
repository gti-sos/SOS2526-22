<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';

    let canvas = $state();
    let chartInstance = null;
    let combinedData = $state([]);
    let loading = $state(true);

    async function loadData() {
        try {
            // Fetch directo a las APIs sin datos precargados
            const [resExp, resAgri] = await Promise.all([
                fetch("https://sos2526-13.onrender.com/api/v1/exportations-stats"),
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts")
            ]);

            const dataExp = await resExp.json();
            const dataAgri = await resAgri.json();

            // Procesamiento dinámico de campos (soporta 'year' y 'year_of_order')
            const yearMap = new Map();

            dataExp.forEach(d => {
                const year = d.year_of_order || d.year;
                if (year) {
                    if (!yearMap.has(year)) yearMap.set(year, { year, exports: 0, temp: 0 });
                    yearMap.get(year).exports += Number(d.tiv_total_order || 0);
                }
            });

            dataAgri.forEach(d => {
                const year = d.year;
                if (year) {
                    // Si el año ya existe de las exportaciones, añadimos la temp
                    if (yearMap.has(year)) {
                        yearMap.get(year).temp = parseFloat(d.average_temperature_c || 0);
                    } else {
                        // Si no existe, lo creamos (para que la gráfica no salga vacía)
                        yearMap.set(year, { year, exports: 0, temp: parseFloat(d.average_temperature_c || 0) });
                    }
                }
            });

            // Convertimos a array, filtramos años basura y ordenamos cronológicamente
            combinedData = Array.from(yearMap.values())
                .filter(d => d.year > 1900 && (d.exports > 0 || d.temp > 0))
                .sort((a, b) => a.year - b.year)
                .slice(-15); // Mostramos los últimos 15 años registrados para que no sature

            await tick();
            renderChart();
        } catch (e) {
            console.error("Error integrando APIs:", e);
        } finally {
            loading = false;
        }
    }

    function renderChart() {
        if (!canvas || combinedData.length === 0) return;
        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(canvas, {
            type: 'bar', // ESTILO BARRAS (No lineal)
            data: {
                labels: combinedData.map(d => d.year),
                datasets: [
                    {
                        label: 'Exportaciones (TIV)',
                        data: combinedData.map(d => d.exports),
                        backgroundColor: '#4299e1',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Temp. Media (°C)',
                        data: combinedData.map(d => d.temp),
                        backgroundColor: '#f56565',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Volumen de Exportación' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: 'Grados Celsius' }
                    }
                }
            }
        });
    }

    onMount(loadData);
</script>

<main class="container">
    <div class="chart-wrapper">
        {#if loading}
            <div class="status">Cargando datos reales de las APIs...</div>
        {:else if combinedData.length === 0}
            <div class="status error">No se han encontrado datos coincidentes.</div>
        {/if}
        <canvas bind:this={canvas}></canvas>
    </div>

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Año</th>
                    <th>Temperatura Registrada</th>
                    <th>Exportaciones Totales</th>
                </tr>
            </thead>
            <tbody>
                {#each combinedData as row}
                    <tr>
                        <td>{row.year}</td>
                        <td class="val-temp">{row.temp > 0 ? row.temp.toFixed(2) + ' °C' : 'N/D'}</td>
                        <td class="val-exp">{row.exports > 0 ? row.exports.toLocaleString() : 'N/D'}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</main>

<style>
    .container { padding: 20px; max-width: 1000px; margin: auto; font-family: sans-serif; }
    
    .chart-wrapper { 
        height: 400px; 
        background: #fff; 
        padding: 20px; 
        border: 1px solid #ddd; 
        border-radius: 10px;
        margin-bottom: 20px;
        position: relative;
    }

    .status { 
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        color: #666; font-weight: bold;
    }

    .table-container { border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; background: white; }
    th { background: #2d3748; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #edf2f7; }

    .val-temp { color: #e53e3e; font-weight: bold; }
    .val-exp { color: #3182ce; font-weight: bold; }
</style>