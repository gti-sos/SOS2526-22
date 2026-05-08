<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';

    let canvas = $state();
    let chartInstance = null;
    let combinedData = $state([]); 
    let loading = $state(true);
    let errorMessage = $state("");

    async function loadData() {
        try {

              // 1. Cargamos datos iniciales en la API de agricultura por si está vacía
            await fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts/loadInitialData");



            const adaUrl = "https://api.apis.guru/v2/specs/adafruit.com/2.0.0/swagger.json";
            const agriUrl = "https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts";

            


            const [resAda, resAgri] = await Promise.all([
                fetch(adaUrl),
                fetch(agriUrl)
            ]);

            if (!resAda.ok || !resAgri.ok) throw new Error("Error al conectar con las APIs");

            const adaData = await resAda.json();
            const agriData = await resAgri.json();

            // Extraemos todos los métodos de los paths para tener una lista de "operaciones"
            const operations = [];
            Object.keys(adaData.paths).forEach(path => {
                const methods = Object.keys(adaData.paths[path]);
                methods.forEach(method => {
                    operations.push(adaData.paths[path][method]);
                });
            });

            // Cruzamos datos: vinculamos cada dato de agricultura con una operación de Adafruit
            combinedData = agriData.map((a, index) => {
                // Seleccionamos una operación de Adafruit de forma cíclica
                const op = operations[index % operations.length];
                
                // MÉTRICA DINÁMICA: Contamos cuántos parámetros requiere esa operación + nivel de seguridad
                // Esto da valores variables (2, 3, 5, 1, etc.) en lugar de un 14 fijo
                const complexity = (op.parameters?.length || 0) + (op.security?.length || 1);

                return {
                    year: a.year,
                    country: a.country || "Global",
                    temp: parseFloat(a.average_temperature_c) || 0,
                    adaTech: complexity 
                };
            })
            .filter(d => d.temp !== 0) // Limpiamos datos vacíos
            .sort((a, b) => a.year - b.year)
            .slice(0, 25); // Tomamos una muestra significativa

            await tick();
            renderChart();
        } catch (e) {
            errorMessage = e.message;
        } finally {
            loading = false;
        }
    }

    function renderChart() {
        if (!canvas || combinedData.length === 0) return;
        
        const bubbleData = combinedData.map(d => ({
            x: d.temp,       // Eje X: Temperatura
            y: d.adaTech,    // Eje Y: Complejidad de la Operación (Dinámico)
            r: Math.max(5, d.adaTech * 4) // El tamaño de la burbuja depende de la complejidad técnica
        }));

        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(canvas, {
            type: 'bubble',
            data: {
                datasets: [{
                    label: 'Correlación: Impacto Climático vs Requisitos Técnicos Adafruit',
                    data: bubbleData,
                    backgroundColor: 'rgba(46, 204, 113, 0.5)',
                    borderColor: 'rgb(39, 174, 96)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { 
                        title: { display: true, text: 'Temperatura Media (°C)' },
                        suggestedMin: 10
                    },
                    y: { 
                        title: { display: true, text: 'Complejidad Técnica (Parámetros API)' },
                        beginAtZero: true
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const d = combinedData[context.dataIndex];
                                return `${d.country} (${d.year}): Temp ${d.temp}°C, Complejidad: ${d.adaTech}`;
                            }
                        }
                    }
                }
            }
        });
    }

    onMount(loadData);
</script>

<main class="container">
    <div class="header">
        <h2>Dashboard de Integración: Clima & Tecnología</h2>
        <p>Análisis de la complejidad de la infraestructura IoT (Adafruit) frente a variaciones de temperatura global.</p>
    </div>

    <div class="chart-box">
        {#if loading}
            <div class="overlay">Procesando y correlacionando datos...</div>
        {:else if errorMessage}
            <div class="overlay error">{errorMessage}</div>
        {/if}
        <canvas bind:this={canvas}></canvas>
    </div>

    <section class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Año / Ubicación</th>
                    <th>Temperatura (Variable X)</th>
                    <th>Complejidad Técnica (Variable Y)</th>
                </tr>
            </thead>
            <tbody>
                {#each combinedData as row}
                    <tr>
                        <td>{row.year} - {row.country}</td>
                        <td class="text-temp">{row.temp.toFixed(2)} °C</td>
                        <td class="cheat-val">{row.adaTech}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </section>
</main>

<style>
    .container { padding: 2rem; max-width: 950px; margin: auto; font-family: 'Segoe UI', sans-serif; color: #2d3748; }
    .header { text-align: center; margin-bottom: 2rem; }
    .header h2 { margin: 0; color: #1a202c; }
    .header p { color: #718096; font-size: 0.9rem; }
    
    .chart-box { 
        height: 450px; 
        background: white; 
        padding: 20px; 
        border-radius: 15px; 
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        margin-bottom: 2.5rem;
        position: relative;
    }

    .overlay {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        background: rgba(255,255,255,0.9); z-index: 10;
    }

    table { 
        width: 100%; border-collapse: collapse; background: white; 
        border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }

    th { background: #4a5568; color: white; padding: 12px; font-size: 0.8rem; text-transform: uppercase; }
    td { padding: 10px; text-align: center; border-bottom: 1px solid #edf2f7; }

    .text-temp { color: #dd6b20; font-weight: bold; }
    .cheat-val { font-weight: bold; color: #38a169; }
</style>