<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';

    let canvas = $state();
    let chartInstance = null;
    let loading = $state(true);
    let status = $state("Cargando...");

    // Estas variables de estado son la clave para que Svelte las "vigile"
    let labels = $state([]);
    let dataGroup1 = $state([]);
    let dataGroup2 = $state([]);

    async function fetchData() {
        try {
            const [res1, res2] = await Promise.all([
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts"),
                fetch("https://sos2526-13.onrender.com/api/v1/exportations-stats")
            ]);

            const agri = await res1.json();
            const exports = await res2.json();

            const limit = Math.min(agri.length, exports.length);
            
            // Limpiamos y llenamos los estados
            const newLabels = [];
            const newValues1 = [];
            const newValues2 = [];

            for (let i = 0; i < limit; i++) {
                newLabels.push(exports[i].country || `Dato ${i+1}`);
                newValues1.push(agri[i].average_temperature_c || 0);
                newValues2.push(exports[i].number_of_ships || exports[i].tiv_total_order || 0);
            }

            labels = newLabels;
            dataGroup1 = newValues1;
            dataGroup2 = newValues2;

            status = "Datos sincronizados correctamente";
            loading = false;
            
            await tick();
            renderChart();
        } catch (e) {
            status = "Error: " + e.message;
            loading = false;
        }
    }

    function renderChart() {
        if (chartInstance) chartInstance.destroy();
        
        chartInstance = new Chart(canvas, {
            type: 'polarArea', // ESTILO DIFERENTE: Área Polar
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Temperatura (°C)',
                        data: dataGroup1,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: '#36a2eb'
                    },
                    {
                        label: 'Exportaciones/Barcos',
                        data: dataGroup2,
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: '#ff6384'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        ticks: { display: false }
                    }
                }
            }
        });
    }

    onMount(fetchData);
</script>

<div class="container">
    <div class="card">
        <h2>Análisis de Área Polar: Clima vs Exportación</h2>
        <p class="status">{status}</p>

        <div class="chart-wrapper">
            <canvas bind:this={canvas}></canvas>
        </div>
    </div>
</div>

<style>
    .container {
        display: flex;
        justify-content: center;
        padding: 40px;
        background: #f0f2f5;
        min-height: 100vh;
    }
    .card {
        background: white;
        padding: 30px;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        width: 100%;
        max-width: 800px;
        text-align: center;
    }
    .chart-wrapper {
        height: 500px;
        margin-top: 20px;
    }
    .status {
        font-family: monospace;
        color: #666;
        background: #eee;
        padding: 5px;
        border-radius: 5px;
        display: inline-block;
    }
</style>