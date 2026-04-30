<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    let canvas;
    let chartInstance = null;
    
    // Estado para la tabla (Svelte 5)
    let statsList = $state([]);

    onMount(async () => {
        try {
            const [res1, res2] = await Promise.all([
                fetch("https://api.apis.guru/v2/specs/adobe.com/aem/3.7.1-pre.0/openapi.json"),
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts")
            ]);

            const adobeData = await res1.json();
            let agriculture = await res2.json();

            if (agriculture.length === 0) {
                agriculture = [
                    { country: "Spain", year: 2021, average_temperature_c: 18.5 },
                    { country: "France", year: 2022, average_temperature_c: 15.2 },
                    { country: "Italy", year: 2023, average_temperature_c: 21.0 },
                    { country: "Germany", year: 2024, average_temperature_c: 12.5 }
                ];
            }

            const adobeEndpoints = Object.keys(adobeData.paths || {}).length;

            // Guardamos los datos en la variable reactiva para la tabla
            statsList = agriculture.map(a => ({
                country: a.country,
                year: a.year,
                label: `${a.country} (${a.year})`,
                temp: a.average_temperature_c,
                adobeNodes: adobeEndpoints / 10 
            }));

            if (chartInstance) chartInstance.destroy();
            
            chartInstance = new Chart(canvas, {
                type: 'polarArea',
                data: {
                    labels: statsList.map(s => s.label),
                    datasets: [
                        {
                            label: 'Temperatura (°C)',
                            data: statsList.map(s => s.temp),
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
                            data: statsList.map(s => s.adobeNodes),
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
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

<main>
    <div class="chart-container">
        <canvas bind:this={canvas}></canvas>
    </div>

    <!-- TABLA ESTILO CHEATERS -->
    <section class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Localización (País/Año)</th>
                    <th>Temperatura Media (Clima)</th>
                    <th>Complejidad API (Adobe)</th>
                </tr>
            </thead>
            <tbody>
                {#each statsList as s}
                    <tr>
                        <td>{s.country} ({s.year})</td>
                        <td>{s.temp.toFixed(2)} °C</td>
                        <td class="cheat-val">{s.adobeNodes.toFixed(1)}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </section>
</main>

<style>
    main {
        padding: 2rem;
        max-width: 900px;
        margin: auto;
        font-family: 'Inter', sans-serif;
    }

    .chart-container { 
        height: 500px; 
        width: 100%; 
        margin-bottom: 3rem;
        padding: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }

    /* ESTILO EXACTO DE CHEATERS */
    .table-container {
        margin-top: 2rem;
    }

    table { 
        width: 100%; 
        border-collapse: collapse; 
        background: white; 
        border-radius: 12px; 
        overflow: hidden; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
    }

    th, td { 
        padding: 15px; 
        text-align: center; 
        border-bottom: 1px solid #f0f0f0; 
    }

    th { 
        background: #2d3748; 
        color: white; 
        font-weight: 500; 
        text-transform: uppercase;
        font-size: 0.85rem;
        letter-spacing: 0.05em;
    }

    .cheat-val { 
        font-weight: bold; 
        color: #c0392b; 
    }

    tr:hover {
        background-color: #f8fafc;
    }
</style>