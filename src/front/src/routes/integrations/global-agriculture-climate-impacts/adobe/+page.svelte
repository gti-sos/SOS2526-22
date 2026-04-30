<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    let canvas;
    let chartInstance = null;

    onMount(async () => {
        try {
            const [res1, res2] = await Promise.all([
                fetch("https://api.apis.guru/v2/specs/adobe.com/aem/3.7.1-pre.0/openapi.json"),
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts")
            ]);

            const adobeData = await res1.json();
            let agriculture = await res2.json();

            // FALLBACK: Si tu API está vacía, cargamos datos de ejemplo para que la gráfica no salga blanca
            if (agriculture.length === 0) {
                console.warn("API de agricultura vacía, usando datos de prueba.");
                agriculture = [
                    { country: "Spain", year: 2021, average_temperature_c: 18.5 },
                    { country: "France", year: 2022, average_temperature_c: 15.2 },
                    { country: "Italy", year: 2023, average_temperature_c: 21.0 },
                    { country: "Germany", year: 2024, average_temperature_c: 12.5 }
                ];
            }

            // Calculamos la cantidad de rutas (endpoints) de la API de Adobe
            const adobeEndpoints = Object.keys(adobeData.paths || {}).length;

            const stats = agriculture.map(a => ({
                label: `${a.country} (${a.year})`,
                temp: a.average_temperature_c,
                adobeNodes: adobeEndpoints / 10 // Normalizamos para que la escala sea similar
            }));

            if (chartInstance) chartInstance.destroy();
            
            chartInstance = new Chart(canvas, {
                type: 'polarArea',
                data: {
                    labels: stats.map(s => s.label),
                    datasets: [
                        {
                            label: 'Temperatura (°C)',
                            data: stats.map(s => s.temp),
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.5)',
                                'rgba(54, 162, 235, 0.5)',
                                'rgba(255, 206, 86, 0.5)',
                                'rgba(75, 192, 192, 0.5)'
                            ],
                            borderWidth: 1
                        },
                        {
                            label: 'Complejidad Adobe (Endpoints/10)',
                            data: stats.map(s => s.adobeNodes),
                            backgroundColor: 'rgba(0, 0, 0, 0.1)', // Fondo gris suave para comparar
                            borderWidth: 2,
                            borderColor: 'rgba(0, 0, 0, 0.3)'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            grid: { color: '#ddd' },
                            ticks: { backdropColor: 'transparent' }
                        }
                    },
                    plugins: {
                        legend: { position: 'bottom' },
                        title: {
                            display: true,
                            text: 'Integración: Clima vs API Adobe'
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
        height: 600px; 
        width: 100%; 
        max-width: 700px; 
        margin: auto; 
        padding: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
</style>