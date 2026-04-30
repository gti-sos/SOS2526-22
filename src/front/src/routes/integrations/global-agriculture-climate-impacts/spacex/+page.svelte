<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    let canvas;
    let chartInstance = null;
    
    // Estados reactivos (Svelte 5)
    let spaceXData = $state([]); 
    let agriData = $state([]); 
    let loading = $state(true);

    // 1. Procesamiento de datos (Se actualiza solo cuando cargan las APIs)
    let integratedData = $derived.by(() => {
        if (agriData.length === 0 && spaceXData.length === 0) return [];

        const allYears = [...new Set([
            ...agriData.map(d => parseInt(d.year)), 
            ...spaceXData.map(d => new Date(d.date_utc).getFullYear())
        ])].filter(y => y >= 2010 && y <= 2023).sort((a, b) => a - b);

        return allYears.map(year => {
            const agriForYear = agriData.filter(d => parseInt(d.year) === year);
            const launchesForYear = spaceXData.filter(d => new Date(d.date_utc).getFullYear() === year);
            
            const avgTemp = agriForYear.length > 0 
                ? agriForYear.reduce((acc, curr) => acc + (parseFloat(curr.average_temperature_c) || 0), 0) / agriForYear.length 
                : 15;

            return {
                year,
                agriVal: avgTemp,
                launchesVal: launchesForYear.length
            };
        });
    });

    // 2. Efecto para la gráfica (se redibuja cuando integratedData cambia)
    $effect(() => {
        if (integratedData.length > 0 && canvas) {
            if (chartInstance) chartInstance.destroy();

            chartInstance = new Chart(canvas, {
                type: 'radar',
                data: {
                    labels: integratedData.map(d => d.year),
                    datasets: [
                        {
                            label: 'Lanzamientos SpaceX',
                            data: integratedData.map(d => d.launchesVal),
                            backgroundColor: 'rgba(231, 76, 60, 0.4)',
                            borderColor: '#e74c3c',
                            borderWidth: 2
                        },
                        {
                            label: 'Temp. Media x2 (Visibilidad)',
                            data: integratedData.map(d => d.agriVal * 2),
                            backgroundColor: 'rgba(46, 204, 113, 0.4)',
                            borderColor: '#2ecc71',
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { r: { suggestedMin: 0 } }
                }
            });
        }
    });

    onMount(async () => {
        try {
            const [resAgri, resSpx] = await Promise.all([
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts"),
                fetch("https://api.spacexdata.com/v4/launches")
            ]);
            agriData = await resAgri.json();
            spaceXData = await resSpx.json();
            loading = false;
        } catch (e) {
            console.error(e);
            loading = false;
        }
    });
</script>

<main>
    <div class="container">
        <!-- Gráfica -->
        <div class="chart-box">
            <canvas bind:this={canvas}></canvas>
        </div>

        {#if loading}
            <p style="text-align:center">Cargando datos integrados...</p>
        {:else}
            <!-- TABLA LITERAL ESTILO CHEATERS -->
            <section class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Año</th>
                            <th>Métrica Agrícola (Altura)</th>
                            <th>Lanzamientos (SpaceX)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each integratedData as d}
                            <tr>
                                <td>{d.year}</td>
                                <td>{d.agriVal.toFixed(2)}</td>
                                <td class="cheat-val">{d.launchesVal}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </section>
        {/if}
    </div>
</main>

<style>
    main { padding: 2rem; max-width: 1000px; margin: auto; font-family: 'Inter', sans-serif; }
    .container { padding: 20px; background: #f9f9f9; border-radius: 15px; }
    
    .chart-box { 
        height: 500px; 
        background: white; 
        padding: 20px; 
        border-radius: 10px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
        margin-bottom: 30px;
    }

    /* ESTILO TABLA CHEATERS */
    .table-container { margin-top: 2rem; }
    table { 
        width: 100%; 
        border-collapse: collapse; 
        background: white; 
        border-radius: 12px; 
        overflow: hidden; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
    }
    th, td { padding: 15px; text-align: center; border-bottom: 1px solid #f0f0f0; }
    th { background: #2d3748; color: white; font-weight: 500; }
    
    /* El valor resaltado en rojo como en cheaters */
    .cheat-val { font-weight: bold; color: #c0392b; }
    
    tr:hover { background-color: #f8fafc; }
</style>