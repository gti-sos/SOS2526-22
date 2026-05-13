<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';

    let canvas = $state();
    let chartInstance = null;
    let stats = $state([]);

    async function load() {
        try {
            // 1. Cargamos datos iniciales en tu API por si acaso
            await fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts/loadInitialData");

            // 2. Llamada a tus dos APIs originales: Agricultura y Adobe
            const [resAgri, resAdobe] = await Promise.all([
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts"),
                fetch("https://api.apis.guru/v2/specs/adobe.com/aem/3.7.1-pre.0/openapi.json")
            ]);

            const agriData = await resAgri.json();
            const adobeData = await resAdobe.json();

            // Calculamos la complejidad de Adobe (número de rutas/endpoints)
            const adobeComplexity = Object.keys(adobeData.paths || {}).length;

            // 3. Procesamiento y Limpieza (para evitar el error de "String")
            stats = agriData.map((a) => {
                // Convertimos la temperatura a número. Si es "N/D" o texto, usamos 0 para que la gráfica no falle.
                const tempNum = parseFloat(a.average_temperature_c);
                
                return {
                    label: `${a.country || "País"} (${a.year || ""})`,
                    temp: isNaN(tempNum) ? 0 : tempNum, 
                    adobeValue: adobeComplexity / 10, // Valor escalado para la comparativa
                    originalTemp: a.average_temperature_c // Guardamos el original para la tabla
                };
            });

        } catch (e) {
            console.error("Error cargando APIs:", e);
            stats = [{ label: "Error de carga", temp: 0, adobeValue: 0, originalTemp: "Error" }];
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
                        label: 'Temperatura Media (°C)',
                        data: stats.map(s => s.temp),
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderWidth: 1
                    },
                    {
                        label: 'Complejidad Adobe (Escalada)',
                        data: stats.map(s => s.adobeValue),
                        backgroundColor: 'rgba(54, 162, 235, 0.4)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: { beginAtZero: true }
                },
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    onMount(load);
</script>

<div style="padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <h2 style="text-align: center; color: #333;">Integración Polar: Clima vs API Adobe</h2>

    <div style="height: 500px; background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <canvas bind:this={canvas}></canvas>
    </div>

    <table style="width: 100%; margin-top: 30px; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        <thead>
            <tr style="background: #2d3748; color: white;">
                <th style="padding: 15px;">Localización</th>
                <th>Temp. API (Original)</th>
                <th>Complejidad Adobe</th>
            </tr>
        </thead>
        <tbody>
            {#each stats as s}
                <tr style="border-bottom: 1px solid #edf2f7; text-align: center;">
                    <td style="padding: 12px;">{s.label}</td>
                    <td style="color: #e53e3e; font-weight: bold;">{s.originalTemp}</td>
                    <td style="color: #3182ce;">{s.adobeValue.toFixed(1)} pts</td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>