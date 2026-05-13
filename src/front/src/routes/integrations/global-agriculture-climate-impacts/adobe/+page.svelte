<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';

    let canvas = $state();
    let chartInstance = null;
    let stats = $state([]);

    async function load() {
        try {
            await fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts/loadInitialData");

            const [res1, res2] = await Promise.all([
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts"),
                fetch("https://api.apis.guru/v2/specs/adobe.com/aem/3.7.1-pre.0/openapi.json")
            ]);

            const agri = await res1.json();
            const adobeData = await res2.json();

            // Obtenemos todas las rutas
            const allPaths = Object.keys(adobeData.paths || {});
            
            // SALTAMOS los primeros 10 que son iguales y cogemos rutas variadas
            const variedPaths = allPaths.slice(15, 25);

            stats = agri.slice(0, 10).map((a, i) => {
                const t = parseFloat(a.average_temperature_c);
                
                // USAMOS EL NOMBRE DE LA RUTA (URL)
                // Es un dato real del endpoint y varía en cada iteración
                const pathName = variedPaths[i] || allPaths[i];
                
                // Métrica: Longitud de la URL del endpoint
                // Esto garantiza valores distintos (ej: /system/health vale 14, /api/assets/dest/copy vale 19)
                const adobeMetric = pathName.length;

                return {
                    label: `${a.country} (${a.year})`,
                    temp: isNaN(t) ? 0 : t,
                    adobeVal: adobeMetric, 
                    originalTemp: a.average_temperature_c,
                    pathName: pathName
                };
            });
        } catch (e) {
            console.error("Error cargando datos:", e);
        }

        await tick();
        render();
    }

    function render() {
        if (!canvas) return;
        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(canvas, {
            type: 'polarArea', 
            data: {
                labels: stats.map(s => s.label),
                datasets: [
                    {
                        label: 'Temperatura Clima (°C)',
                        data: stats.map(s => s.temp),
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderWidth: 1
                    },
                    {
                        label: 'Longitud Endpoint Adobe',
                        data: stats.map(s => s.adobeVal),
                        backgroundColor: 'rgba(54, 162, 235, 0.4)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    onMount(load);
</script>

<div style="padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <h2 style="text-align: center; color: #333;">Integración Real: Clima vs Estructura Adobe</h2>

    <div style="height: 500px; background: white; border-radius: 15px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <canvas bind:this={canvas}></canvas>
    </div>

    <table style="width: 100%; margin-top: 30px; border-collapse: collapse; background: white;">
        <thead>
            <tr style="background: #2d3748; color: white; text-align: left;">
                <th style="padding: 12px;">País / Año</th>
                <th style="padding: 12px;">Temp. (°C)</th>
                <th style="padding: 12px;">Ruta Adobe (Dato Fuente)</th>
                <th style="padding: 12px;">Valor Gráfica</th>
            </tr>
        </thead>
        <tbody>
            {#each stats as s}
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">{s.label}</td>
                    <td style="color: #e53e3e; font-weight: bold;">{s.originalTemp}</td>
                    <td style="font-family: monospace; font-size: 0.8rem; color: #4a5568;">{s.pathName}</td>
                    <td style="color: #3182ce; font-weight: bold;">{s.adobeVal}</td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>