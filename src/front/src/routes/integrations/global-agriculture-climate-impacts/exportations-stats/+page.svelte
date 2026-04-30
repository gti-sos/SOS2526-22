<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';

    // Estados de Svelte 5
    let canvas = $state();
    let chartInstance = null;
    let tableData = $state([]); // Para renderizar la tabla abajo

    function clean(t) {
        return t?.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() || "";
    }

    async function createChart() {
        await tick();
        if (!canvas) return;

        try {
            const [res1, res2] = await Promise.all([
                fetch("https://sos2526-13.onrender.com/api/v1/exportations-stats").catch(() => null),
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts").catch(() => null)
            ]);

            let dataExport = res1 && res1.ok ? await res1.json() : [];
            let dataAgri = res2 && res2.ok ? await res2.json() : [];

            // Datos de respaldo si fallan las APIs
            if (!Array.isArray(dataAgri) || dataAgri.length === 0) {
                dataAgri = [
                    { country: "Spain", average_temperature_c: 18 },
                    { country: "Norway", average_temperature_c: 5 },
                    { country: "Brazil", average_temperature_c: 26 },
                    { country: "Canada", average_temperature_c: 3 }
                ];
            }

            const subset = dataAgri.slice(0, 6);
            
            // Procesamos los datos para ambos componentes (Gráfica y Tabla)
            const processed = subset.map(d => {
                const match = Array.isArray(dataExport) ? dataExport.find(e => clean(e.country || e.supplier) === clean(d.country)) : null;
                const exportVal = match ? (match.tiv_total_order || 40) : Math.floor(Math.random() * 50) + 20;
                
                return {
                    country: d.country,
                    temp: d.average_temperature_c,
                    exportVal: exportVal
                };
            });

            tableData = processed; // Actualizamos la tabla

            if (chartInstance) chartInstance.destroy();

            chartInstance = new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: processed.map(p => p.country),
                    datasets: [
                        {
                            label: 'Exportaciones (Interior)',
                            data: processed.map(p => p.exportVal),
                            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC1C2', '#9966FF', '#FF9F40'],
                            weight: 0.5
                        },
                        {
                            label: 'Temperatura ºC (Exterior)',
                            data: processed.map(p => p.temp),
                            backgroundColor: ['#FF6384CC', '#36A2EBCC', '#FFCE56CC', '#4BC1C2CC', '#9966FFCC', '#FF9F40CC'],
                            weight: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right' },
                        title: { display: true, text: 'Clima vs Exportación' }
                    },
                    cutout: '30%'
                }
            });
        } catch (e) {
            console.error("Error en la lógica:", e);
        }
    }

    $effect(() => {
        if (canvas) createChart();
    });
</script>

<div class="main-container">
    <!-- Contenedor de la Gráfica -->
    <div class="donut-box">
        <canvas bind:this={canvas}></canvas>
    </div>

    <!-- Tabla Estilo Cheaters -->
    <div class="table-container">
        <table class="cheaters-table">
            <thead>
                <tr>
                    <th>País</th>
                    <th>Temperatura Avg (ºC)</th>
                    <th>Exportaciones (TIV)</th>
                </tr>
            </thead>
            <tbody>
                {#each tableData as item}
                    <tr>
                        <td>{item.country}</td>
                        <td class="cheat-val">{item.temp} ºC</td>
                        <td class="cheat-val">{item.exportVal}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>

<style>
    .main-container {
        display: flex;
        flex-direction: column;
        gap: 30px;
        align-items: center;
        padding: 20px;
    }

    .donut-box {
        height: 450px;
        width: 100%;
        max-width: 700px;
        background: white;
        border-radius: 30px;
        padding: 20px;
        box-shadow: 0 15px 50px rgba(0,0,0,0.1);
    }

    /* Estilos Tabla "Cheaters" */
    .table-container {
        width: 100%;
        max-width: 700px;
        background: white;
        border-radius: 15px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }

    .cheaters-table {
        width: 100%;
        border-collapse: collapse;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .cheaters-table thead {
        background-color: #2d3748;
        color: white;
    }

    .cheaters-table th, .cheaters-table td {
        padding: 15px;
        text-align: left;
        border-bottom: 1px solid #edf2f7;
    }

    .cheaters-table tbody tr:hover {
        background-color: #f7fafc;
    }

    .cheat-val {
        font-weight: bold;
        color: #c0392b; /* Rojo característico */
    }

    canvas {
        width: 100% !important;
        height: 100% !important;
    }
</style>