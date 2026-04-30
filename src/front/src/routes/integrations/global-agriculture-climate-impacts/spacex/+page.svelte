<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    let canvas;
    let chartInstance = null;

    onMount(async () => {
        try {
            const [res1, res2] = await Promise.all([
                fetch("https://api.spacexdata.com/v4/launches"),
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts")
            ]);

            const launches = await res1.json();
            const agriculture = await res2.json();

            // Diccionario para unificar datos por año
            const stats = {};

            // 1. Procesar lanzamientos de SpaceX
            launches.forEach(l => {
                const year = new Date(l.date_utc).getFullYear();
                if (year >= 2010 && year <= 2023) { // Rango donde hay datos de ambas
                    if (!stats[year]) stats[year] = { lanzamientos: 0, temp: [] };
                    stats[year].lanzamientos += 1;
                }
            });

            // 2. Procesar agricultura y clima
            agriculture.forEach(a => {
                const year = parseInt(a.year);
                if (stats[year]) {
                    stats[year].temp.push(a.average_temperature_c);
                }
            });

            // 3. Preparar labels y datos finales
            const labels = Object.keys(stats).sort();
            const dataLanzamientos = labels.map(y => stats[y].lanzamientos);
            
            // Calculamos el promedio y aplicamos un factor x2 para que se vea en la gráfica
            const dataTempGrafica = labels.map(y => {
                if (stats[y].temp.length === 0) return 15; // Valor por defecto si no hay dato ese año
                const avg = stats[y].temp.reduce((a, b) => a + b, 0) / stats[y].temp.length;
                return avg * 2; // ESCALADO: Multiplicamos por 2 para que sea visible junto a los lanzamientos
            });

            if (chartInstance) chartInstance.destroy();

            chartInstance = new Chart(canvas, {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Lanzamientos SpaceX',
                            data: dataLanzamientos,
                            backgroundColor: 'rgba(231, 76, 60, 0.4)',
                            borderColor: '#e74c3c',
                            borderWidth: 2
                        },
                        {
                            label: 'Temp. Media x2 (Visibilidad)',
                            data: dataTempGrafica,
                            backgroundColor: 'rgba(46, 204, 113, 0.4)',
                            borderColor: '#2ecc71',
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'INTEGRACIÓN COMPLETA: SPACEX Y CLIMA (2010-2023)',
                            font: { size: 18 }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    let value = context.raw;
                                    if (context.datasetIndex === 1) value = (value / 2).toFixed(2) + " °C";
                                    return `${context.dataset.label}: ${value}`;
                                }
                            }
                        }
                    },
                    scales: {
                        r: {
                            suggestedMin: 0,
                            suggestedMax: 80,
                            ticks: { stepSize: 10 }
                        }
                    }
                }
            });
        } catch (e) {
            console.error("Error en la integración:", e);
        }
    });
</script>

<div class="container">
    <div class="chart-box">
        <canvas bind:this={canvas}></canvas>
    </div>
</div>

<style>
    .container { padding: 20px; background: #f9f9f9; border-radius: 15px; }
    .chart-box { 
        height: 550px; 
        background: white; 
        padding: 20px; 
        border-radius: 10px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
    }
</style>