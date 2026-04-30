<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    let canvas;
    let chartInstance = null;
    
    // USAMOS $state PARA QUE LA TABLA SE RELLENE EN CUANTO LLEGUEN LOS DATOS
    let combinedData = $state([]); 

    onMount(async () => {
        try {
            const [res1, res2] = await Promise.all([
                fetch("https://api.spacexdata.com/v4/launches"),
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts")
            ]);

            let launches = await res1.json();
            let agriculture = await res2.json();

            // Fallback por si la API de agricultura falla o está vacía
            if (!agriculture || agriculture.length === 0) {
                agriculture = [
                    { year: 2018, average_temperature_c: 14.5, country: "España" },
                    { year: 2019, average_temperature_c: 15.2, country: "Francia" },
                    { year: 2020, average_temperature_c: 16.1, country: "Italia" },
                    { year: 2021, average_temperature_c: 16.8, country: "Portugal" },
                    { year: 2022, average_temperature_c: 17.5, country: "Grecia" }
                ];
            }

            const launchesCount = {};
            launches.forEach(l => {
                const year = new Date(l.date_utc).getFullYear();
                launchesCount[year] = (launchesCount[year] || 0) + 1;
            });

            // ASIGNACIÓN REACTIVA: Aquí es donde la tabla recibe los datos
            combinedData = agriculture.map(a => ({
                year: a.year,
                country: a.country || "N/A",
                temp: parseFloat(a.average_temperature_c),
                spx: launchesCount[a.year] || 0
            }));

            // Configuración de la gráfica
            const bubbleData = combinedData.map(d => ({
                x: d.temp,
                y: d.spx,
                r: d.temp 
            }));

            if (chartInstance) chartInstance.destroy();

            chartInstance = new Chart(canvas, {
                type: 'bubble',
                data: {
                    datasets: [{
                        label: 'Integración (Tamaño = Temperatura)',
                        data: bubbleData,
                        backgroundColor: bubbleData.map(d => 
                            d.x > 16 ? 'rgba(255, 99, 132, 0.6)' : 'rgba(155, 89, 182, 0.6)'
                        ),
                        borderColor: bubbleData.map(d => 
                            d.x > 16 ? 'rgb(255, 99, 132)' : 'rgb(155, 89, 182)'
                        ),
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Temperatura Media (°C)' } },
                        y: { title: { display: true, text: 'Nº Lanzamientos SpaceX' } }
                    }
                }
            });
        } catch (e) {
            console.error("Error cargando datos:", e);
        }
    });
</script>

<main class="container">
    <!-- Gráfica de Burbujas -->
    <div class="chart-box">
        <canvas bind:this={canvas}></canvas>
    </div>

    <!-- TABLA ESTILO CHEATERS (LLENA DE DATOS) -->
    <section class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Año / País</th>
                    <th>Temperatura Media (Clima)</th>
                    <th>Lanzamientos (SpaceX)</th>
                </tr>
            </thead>
            <tbody>
                {#each combinedData as row}
                    <tr>
                        <td>{row.year} - {row.country}</td>
                        <td>{row.temp.toFixed(2)} °C</td>
                        <td class="cheat-val">{row.spx}</td>
                    </tr>
                {:else}
                    <!-- Esto solo sale mientras carga -->
                    <tr>
                        <td colspan="3" style="padding: 30px; color: #888;">Cargando datos de la API...</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </section>
</main>

<style>
    .container { 
        padding: 2rem; 
        max-width: 1000px; 
        margin: auto; 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    }

    .chart-box { 
        height: 450px; 
        background: white; 
        padding: 20px; 
        border-radius: 15px; 
        box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        margin-bottom: 3rem;
        border: 1px solid #eee;
    }

    /* CSS ESTILO CHEATERS */
    .table-container {
        margin-top: 1rem;
    }

    table { 
        width: 100%; 
        border-collapse: collapse; 
        background: white; 
        border-radius: 12px; 
        overflow: hidden; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.05); 
    }

    th, td { 
        padding: 15px; 
        text-align: center; 
        border-bottom: 1px solid #f0f0f0; 
    }

    th { 
        background: #2d3748; /* El gris oscuro de la tabla cheaters */
        color: white; 
        font-weight: 600; 
        text-transform: uppercase;
        font-size: 0.8rem;
        letter-spacing: 0.05rem;
    }

    /* Columna final resaltada en rojo */
    .cheat-val { 
        font-weight: bold; 
        color: #c0392b; 
        font-size: 1.1rem;
    }

    tr:hover {
        background-color: #f8fafc;
    }
</style>