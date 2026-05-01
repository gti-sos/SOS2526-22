<script>
    import { onMount } from 'svelte';
    import ApexCharts from 'apexcharts';

    let loading = $state(true);
    let error = $state(null);
    let chart = null;

    onMount(async () => {
        try {
            // 1. Obtener tus datos de carbon_tetrachloride por año (suma mundial, excluyendo world/asia)
            const resOzone = await fetch('/api/v1/ozone-depleting-substance-consumptions');
            const ozoneData = await resOzone.json();
            const ozono = Array.isArray(ozoneData) ? ozoneData : (ozoneData.data || []);
            
            const carbonPorAnio = {};
            ozono.forEach(item => {
                if (item.country === 'world' || item.country === 'asia') return;
                const year = item.year;
                const valor = Math.abs(Number(item.carbon_tetrachloride) || 0);
                carbonPorAnio[year] = (carbonPorAnio[year] || 0) + valor;
            });
            
            // 2. Obtener datos de OpenAQ a través del proxy (PM2.5 en China)
            const resOpenAQ = await fetch('/api/proxy/openaq?country=CN&parameter=pm25&limit=1000');
            if (!resOpenAQ.ok) throw new Error('Error al obtener datos de OpenAQ');
            const pm25Data = await resOpenAQ.json(); // array de { year, pm25 }
            
            // 3. Alinear años (unión de años con datos)
            const yearsSet = new Set();
            Object.keys(carbonPorAnio).forEach(y => yearsSet.add(parseInt(y)));
            pm25Data.forEach(d => yearsSet.add(d.year));
            const years = Array.from(yearsSet).sort((a, b) => a - b);
            
            const carbonValues = years.map(y => carbonPorAnio[y] || 0);
            const pm25Values = years.map(y => {
                const found = pm25Data.find(d => d.year === y);
                return found ? found.pm25 : 0;
            });
            
            // 4. Configurar gráfico de barras dobles con ApexCharts
            const options = {
                chart: {
                    type: 'bar',
                    height: 550,
                    toolbar: { show: false }
                },
                title: {
                    text: 'Relación: Tetracloruro de Carbono vs PM2.5 en China',
                    align: 'center',
                    style: { fontSize: '18px', color: '#2085d8' }
                },
                subtitle: {
                    text: 'Fuentes: API propia (CCl₄) y OpenAQ (PM2.5) con autenticación + proxy',
                    align: 'center',
                    style: { fontSize: '12px', color: '#666' }
                },
                xaxis: {
                    categories: years,
                    title: { text: 'Año' },
                    labels: { rotate: -45 }
                },
                yaxis: [
                    {
                        title: { text: 'Consumo de CCl₄ (toneladas)' },
                        labels: { formatter: (val) => val.toLocaleString() }
                    },
                    {
                        opposite: true,
                        title: { text: 'PM2.5 (µg/m³)' },
                        labels: { formatter: (val) => val.toFixed(1) }
                    }
                ],
                series: [
                    {
                        name: 'Tetracloruro de carbono (CCl₄)',
                        type: 'bar',
                        data: carbonValues,
                        color: '#1e88e5'
                    },
                    {
                        name: 'PM2.5 (OpenAQ)',
                        type: 'bar',
                        data: pm25Values,
                        color: '#fb8c00'
                    }
                ],
                plotOptions: {
                    bar: {
                        borderRadius: 6,
                        columnWidth: '60%',
                        horizontal: false
                    }
                },
                dataLabels: { enabled: false },
                tooltip: {
                    shared: true,
                    y: {
                        formatter: (val, { seriesIndex }) => {
                            if (seriesIndex === 0) return val.toLocaleString() + ' toneladas';
                            return val.toFixed(1) + ' µg/m³';
                        }
                    }
                },
                legend: { position: 'bottom' },
                grid: { borderColor: '#e0e0e0' }
            };
            
            const container = document.getElementById('chart-container');
            if (container) {
                chart = new ApexCharts(container, options);
                chart.render();
            }
            
            loading = false;
        } catch (err) {
            console.error(err);
            error = err.message;
            loading = false;
        }
    });
</script>

<svelte:head>
    <title>Integración OpenAQ vs Ozono</title>
</svelte:head>

<div class="container">
    <h1>🏭 Tetracloruro de Carbono vs Contaminación PM2.5</h1>
    <p class="subtitle">Comparativa anual en China (datos de tu API y OpenAQ)</p>
    
    <div class="info-box">
        <p><strong>🌐 API externa:</strong> OpenAQ (autenticación con API key + proxy propio)</p>
        <p><strong>🌍 API propia:</strong> Ozone Depleting Substance Consumptions (campo <code>carbon_tetrachloride</code>)</p>
        <p><strong>📊 Tipo de gráfico:</strong> Barras dobles (ApexCharts) – no es "line"</p>
        <p><strong>🔐 Proxy:</strong> <code>/api/proxy/openaq</code> (oculta API key y maneja CORS)</p>
    </div>
    
    <div id="chart-container" style="height: 550px; width: 100%;"></div>
    
    {#if loading}
        <div class="loading">Cargando datos y gráfico...</div>
    {:else if error}
        <div class="error">❌ Error: {error}</div>
    {/if}
    
    <div class="info">
        <h3>📖 Interpretación</h3>
        <ul>
            <li><strong>Tetracloruro de carbono (CCl₄)</strong>: consumo mundial (suma de valores absolutos) de esta sustancia, extraído de tu API.</li>
            <li><strong>PM2.5</strong>: concentración media anual de partículas finas en China (datos OpenAQ).</li>
            <li>El gráfico permite explorar si existe correlación entre la evolución del consumo de CCl₄ y la calidad del aire (contaminación por partículas).</li>
        </ul>
        <p><strong>Combinación única:</strong> tipo <code>bar</code> + biblioteca <code>ApexCharts</code> (no usado por Celia ni por ti anteriormente).</p>
    </div>
    
    <a href="/integrations/ozone-depleting-substance-consumptions" class="btn-back">← Volver a integraciones</a>
</div>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    h1 { color: #2085d8; text-align: center; }
    .subtitle { text-align: center; color: #666; margin-bottom: 1.5rem; }
    .info-box {
        background: #f0f9ff;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        font-size: 0.85rem;
        border-left: 4px solid #2085d8;
    }
    .loading, .error { text-align: center; padding: 2rem; }
    .error { color: #e53935; background: #fee2e2; border-radius: 12px; }
    .info { margin-top: 2rem; padding: 1rem; background: #f0f9ff; border-radius: 12px; }
    .btn-back {
        display: inline-block;
        margin-top: 1.5rem;
        background: #2085d8;
        color: white;
        padding: 0.6rem 1.2rem;
        border-radius: 6px;
        text-decoration: none;
    }
</style>