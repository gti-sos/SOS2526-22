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

            const stats = {};
            launches.forEach(l => {
                const year = new Date(l.date_utc).getFullYear();
                if (!stats[year]) stats[year] = { lanzamientos: 0, temp: 0 };
                stats[year].lanzamientos += 1;
            });

            agriculture.forEach(a => {
                if (!stats[a.year]) stats[a.year] = { lanzamientos: 0, temp: a.average_temperature_c };
                else stats[a.year].temp = a.average_temperature_c;
            });

            const labels = Object.keys(stats).sort();

            if (chartInstance) chartInstance.destroy();
            chartInstance = new Chart(canvas, {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Lanzamientos SpaceX',
                            data: labels.map(y => stats[y].lanzamientos),
                            backgroundColor: 'rgba(231, 76, 60, 0.2)',
                            borderColor: '#e74c3c'
                        },
                        {
                            label: 'Temp. Media (°C)',
                            data: labels.map(y => stats[y].temp),
                            backgroundColor: 'rgba(46, 204, 113, 0.2)',
                            borderColor: '#2ecc71'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    elements: { line: { borderWidth: 3 } }
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
        max-width: 600px; /* Los radares quedan mejor en un cuadrado */
        margin: auto;
        background: #fff;
    }
</style>