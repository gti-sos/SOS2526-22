<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let stats = [];
    let errorMsg = "";

    async function loadChart() {
        if (!browser) return;

        try {
            // 1. Fetch de datos
            const res = await fetch('/api/v2/global-agriculture-climate-impacts');
            if (res.ok) {
                stats = await res.json();
                console.log("Datos recibidos de la API:", stats);

                if (stats.length > 0) {
                    // 2. Importación dinámica de Highcharts
                    const Highcharts = (await import('highcharts')).default;
                    const AccessibilityModule = (await import('highcharts/modules/accessibility')).default;
                    
                    // CORRECCIÓN CLAVE: Registro seguro del módulo
                    if (typeof AccessibilityModule === 'function') {
                        AccessibilityModule(Highcharts);
                    }

                    // 3. Creación de la gráfica
                    Highcharts.chart('chart-container', {
                        chart: { 
                            type: 'area' // REQUISITO: Diferente a 'line'
                        },
                        title: { text: 'Análisis de Impacto Agrícola Individual' },
                        accessibility: { 
                            enabled: true // REQUISITO: Accesibilidad activada
                        },
                        xAxis: {
                            categories: stats.map(d => `${d.country} (${d.year})`),
                            title: { text: 'País (Año)' }
                        },
                        yAxis: { title: { text: 'Valores Registrados' } },
                        series: [
                            {
                                name: 'Temperatura Media (ºC)',
                                data: stats.map(d => d.average_temperature_c || d.temp || 0),
                                color: '#e74c3c'
                            },
                            {
                                name: 'Precipitación Total (mm)',
                                data: stats.map(d => d.total_precipitation_mm || d.prec || 0),
                                color: '#3498db'
                            }
                        ]
                    });
                } else {
                    errorMsg = "Base de datos vacía. Pulsa 'Cargar datos iniciales' en el Panel Agricultura.";
                }
            } else {
                errorMsg = "Error al conectar con la API: " + res.status;
            }
        } catch (e) {
            errorMsg = "Error crítico al generar la gráfica: " + e.message;
            console.error("Error detallado:", e);
        }
    }

    onMount(loadChart);
</script>

<main>
    <div class="title-section">
        <h1>Visualización Individual de Agricultura</h1>
    </div>

    {#if errorMsg}
        <div class="error-msg">{errorMsg}</div>
    {:else if stats.length === 0}
        <p class="loading-text">Preparando visualización...</p>
    {/if}

    <div id="chart-container"></div>
    
    <div class="actions">
        <a href="/" class="back-link">← Volver al Inicio</a>
    </div>
</main>

<style>
    main { text-align: center; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    h1 { color: #2c3e50; margin-bottom: 10px; }
    
    #chart-container {
        width: 100%;
        max-width: 850px;
        height: 500px;
        margin: 20px auto;
        border: 1px solid #e1e1e1;
        border-radius: 12px;
        background: #ffffff;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    }

    .error-msg {
        color: #c0392b;
        background: #fdf2f2;
        padding: 15px;
        border-radius: 8px;
        display: inline-block;
        margin: 10px;
        border: 1px solid #fadbd8;
    }

    .loading-text { color: #7f8c8d; font-style: italic; }
    .actions { margin-top: 30px; }
    .back-link { color: #2980b9; text-decoration: none; font-weight: bold; font-size: 1.1em; }
    .back-link:hover { text-decoration: underline; }
</style>