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
            // Usamos allSettled para que si una API cae, la otra no bloquee todo
            const results = await Promise.allSettled([
                fetch("https://sos2526-13.onrender.com/api/v1/exportations-stats").then(r => r.json()),
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts").then(r => r.json())
            ]);

            const dataExp = results[0].status === 'fulfilled' ? results[0].value : [];
            const dataAgri = results[1].status === 'fulfilled' ? results[1].value : [];

            const merger = {};

            // 1. Procesar Clima (Línea)
            dataAgri.forEach(item => {
                const y = parseInt(item.year);
                if (isNaN(y)) return;
                if (!merger[y]) merger[y] = { year: y, temp: null, exports: 0 };
                // Limpieza de datos: manejar "N/D" o valores no numéricos
                const val = parseFloat(item.average_temperature_c);
                merger[y].temp = isNaN(val) ? null : val;
            });

            // 2. Procesar Exportaciones (Barras)
            dataExp.forEach(item => {
                const y = parseInt(item.year_of_order || item.year);
                if (isNaN(y)) return;
                if (!merger[y]) merger[y] = { year: y, temp: null, exports: 0 };
                const val = parseFloat(item.tiv_total_order || 0);
                merger[y].exports += isNaN(val) ? 0 : val;
            });

            combinedData = Object.values(merger).sort((a, b) => a.year - b.year);

            loading = false;
            await tick(); // Esperar a que Svelte cree el canvas en el DOM
            renderChart();
        } catch (e) {
            console.error("Error crítico en la carga:", e);
            loading = false;
        }
    }

    function renderChart() {
        if (!canvas || combinedData.length === 0) return;
        if (chartInstance) chartInstance.destroy();

        const ctx = canvas.getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: combinedData.map(d => d.year),
                datasets: [
                    {
                        label: 'Exportaciones (TIV)',
                        data: combinedData.map(d => d.exports),
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderRadius: 5,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Temperatura (°C)',
                        data: combinedData.map(d => d.temp),
                        type: 'line',
                        borderColor: '#FF0000',
                        backgroundColor: '#FF0000',
                        borderWidth: 3,
                        pointRadius: 4,
                        tension: 0.3,
                        spanGaps: true, // Une puntos aunque falten años intermedios
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
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'TIV (Exportaciones)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 0,
                        max: 45, // Ajustado para que la curva de temperatura sea visible
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: 'Promedio Temp °C' }
                    }
                }
            }
        });
    }

    onMount(loadData);
</script>

<div style="padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 1000px; margin: auto;">
    <h2 style="text-align: center; color: #333;">Dashboard Integrado: Clima y Comercio</h2>
    
    <div style="height: 450px; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); position: relative;">
        {#if loading}
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                <strong>Sincronizando APIs...</strong>
            </div>
        {/if}
        <canvas bind:this={canvas}></canvas>
    </div>

    <div style="margin-top: 30px; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <thead>
                <tr style="background: #1a252f; color: white;">
                    <th style="padding: 12px;">Año</th>
                    <th>Exportaciones (TIV)</th>
                    <th>Temperatura</th>
                </tr>
            </thead>
            <tbody>
                {#each combinedData as d}
                    <tr style="border-bottom: 1px solid #f2f2f2; text-align: center;">
                        <td style="padding: 10px; font-weight: bold; background: #f9f9f9;">{d.year}</td>
                        <td style="color: #2980b9;">{d.exports > 0 ? d.exports.toLocaleString() : '0'}</td>
                        <td style="color: #c0392b; font-weight: bold;">
                            {d.temp !== null ? d.temp.toFixed(1) + ' °C' : 'N/D'}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>

<style>
    canvas { width: 100% !important; height: 100% !important; }
</style>