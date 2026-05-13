<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';

    let canvas = $state();
    let chartInstance = null;
    let combinedData = $state([]);
    let loading = $state(true);

    async function loadData() {
        loading = true;
        try {
            await fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts/loadInitialData");
            await fetch("https://sos2526-24.onrender.com/api/v2/recreation-culture-expenditure/loadInitialData");

            const results = await Promise.allSettled([
                fetch("https://sos2526-24.onrender.com/api/v2/recreation-culture-expenditure").then(r => r.json()),
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts").then(r => r.json())
            ]);

            const dataRec = results[0].status === 'fulfilled' ? results[0].value : [];
            const dataAgri = results[1].status === 'fulfilled' ? results[1].value : [];

            const merger = {};

            dataAgri.forEach(item => {
                const y = parseInt(item.year);
                if (isNaN(y)) return;
                if (!merger[y]) merger[y] = { year: y, temp: null, recValue: 0 };
                const val = parseFloat(item.average_temperature_c);
                merger[y].temp = isNaN(val) ? null : val;
            });

            dataRec.forEach(item => {
                const y = parseInt(item.year);
                if (isNaN(y)) return;
                if (!merger[y]) merger[y] = { year: y, temp: null, recValue: 0 };
                const val = parseFloat(item.recreation_value || 0);
                merger[y].recValue += isNaN(val) ? 0 : val;
            });

            combinedData = Object.values(merger).sort((a, b) => a.year - b.year);

            loading = false;
            await tick(); 
            renderChart();
        } catch (e) {
            console.error("Error crítico:", e);
            loading = false;
        }
    }

    function renderChart() {
        if (!canvas || combinedData.length === 0) return;
        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(canvas, {
            type: 'bar', // Tipo base global: BARRAS
            data: {
                labels: combinedData.map(d => d.year),
                datasets: [
                    {
                        label: 'Gasto Recreación (€)',
                        data: combinedData.map(d => d.recValue),
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgb(54, 162, 235)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Temperatura (°C)',
                        data: combinedData.map(d => d.temp),
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 1,
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
                        position: 'left',
                        title: { display: true, text: 'Gasto en Recreación' }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        min: 0,
                        max: 45,
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: 'Temperatura Media' }
                    }
                }
            }
        });
    }

    onMount(loadData);
</script>

<div style="padding: 20px; font-family: sans-serif; max-width: 1000px; margin: auto;">
    <h2 style="text-align: center;">Dashboard: Recreación vs Clima (Sólo Barras)</h2>
    
    <div style="height: 450px; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); position: relative;">
        {#if loading}
            <div style="text-align: center; padding-top: 200px;">
                <strong>Cargando datos...</strong>
            </div>
        {/if}
        <canvas bind:this={canvas}></canvas>
    </div>

    <table style="width: 100%; margin-top: 30px; border-collapse: collapse;">
        <thead>
            <tr style="background: #333; color: white; text-align: center;">
                <th style="padding: 12px;">Año</th>
                <th>Gasto Recreación</th>
                <th>Temperatura</th>
            </tr>
        </thead>
        <tbody>
            {#each combinedData as d}
                <tr style="border-bottom: 1px solid #eee; text-align: center;">
                    <td style="padding: 10px; font-weight: bold;">{d.year}</td>
                    <td style="color: #2980b9;">{d.recValue.toLocaleString()} €</td>
                    <td style="color: #c0392b;">{d.temp ? d.temp.toFixed(1) + ' °C' : 'N/D'}</td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>