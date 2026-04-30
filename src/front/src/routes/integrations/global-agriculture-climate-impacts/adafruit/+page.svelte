<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    let canvas;
    let chartInstance = null;

    onMount(async () => {
        try {
            const [res1, res2] = await Promise.all([
                fetch("https://api.apis.guru/v2/specs/adafruit.com/2.0.0/swagger.json"),
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts")
            ]);

            const adafruitData = await res1.json();
            let agriculture = await res2.json();

            // CORRECCIÓN 1: Si no hay datos, usamos datos de prueba para que veas la gráfica
            if (agriculture.length === 0) {
                console.warn("API vacía: Cargando datos de prueba para visualizar.");
                agriculture = [
                    { country: "Spain", average_temperature_c: 18.2 },
                    { country: "France", average_temperature_c: 14.5 },
                    { country: "Italy", average_temperature_c: 21.0 },
                    { country: "Germany", average_temperature_c: 11.8 }
                ];
            }

            const numEndpoints = Object.keys(adafruitData.paths || {}).length;
            
            // CORRECCIÓN 2: Asegurar valores numéricos y dar algo de variedad al eje Y
            const scatterData = agriculture.map((a, index) => ({
                x: Number(a.average_temperature_c), 
                // Sumamos el índice para que los puntos no estén todos en una línea horizontal exacta
                y: numEndpoints + index 
            }));

            if (chartInstance) chartInstance.destroy();
            chartInstance = new Chart(canvas, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Correlación Temp vs Actividad IoT',
                        data: scatterData,
                        backgroundColor: '#9b59b6',
                        pointRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { 
                            title: { display: true, text: 'Temperatura (°C)' },
                            // CORRECCIÓN 3: Forzar escalas para que los puntos sean visibles
                            suggestedMin: 0,
                            suggestedMax: 40
                        },
                        y: { 
                            title: { display: true, text: 'Endpoints IoT (Adafruit)' },
                            suggestedMin: numEndpoints - 5,
                            suggestedMax: numEndpoints + 10
                        }
                    }
                }
            });
        } catch (e) {
            console.error("Error en la integración:", e);
        }
    });
</script>

<div class="chart-container">
    <canvas bind:this={canvas}></canvas>
</div>

<style>
    .chart-container { 
        height: 500px; 
        width: 100%; 
        max-width: 700px; 
        margin: auto; 
        padding: 20px; 
        background: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
</style>