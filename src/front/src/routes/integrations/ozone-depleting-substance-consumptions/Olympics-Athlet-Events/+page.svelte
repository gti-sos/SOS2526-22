<script>
    // @ts-nocheck
    import { onMount, tick } from 'svelte';
    import 'highcharts/modules/accessibility.js';

    // svelte-ignore non_reactive_update
    let error = null;
    let loading = $state(true);  // ✅ Estado de carga añadido

    onMount(async () => {
        console.log('1. Iniciando carga de datos...');
        
        try {
            // 1. Obtener datos de ozono (API propia)
            console.log('2. Cargando datos de Elena (methyl_bromide)...');
            const resElena = await fetch('/api/v1/ozone-depleting-substance-consumptions/loadInitialData');
            if (!resElena.ok) throw new Error(`HTTP ${resElena.status} - Elena`);
            const elenaData = await resElena.json();
            const ozonoData = Array.isArray(elenaData) ? elenaData : [];

            // Agrupar methyl_bromide por año (excluyendo world y asia)
            const methylPorAnio = {};
            ozonoData.forEach(item => {
                const country = item.country;
                if (country === 'world' || country === 'asia') return;
                const year = item.year;
                if (!methylPorAnio[year]) methylPorAnio[year] = 0;
                methylPorAnio[year] += Math.abs(Number(item.methyl_bromide) || 0);
            });
            console.log('Methyl Bromide por año:', methylPorAnio);

            // 2. Obtener datos de Olympics (API compañero)
            const resOlympics = await fetch('https://sos2526-30.onrender.com/api/v1/olympics-athlete-events/loadInitialData');
            if (!resOlympics.ok) throw new Error(`HTTP ${resOlympics.status} - Olympics`);
            const olympicsJson = await resOlympics.json();
            const athletes = Array.isArray(olympicsJson) ? olympicsJson : (olympicsJson.data || []);

            // Contar atletas por año
            const atletasPorAnio = {};
            athletes.forEach(ath => {
                const year = ath.year;
                if (year) {
                    atletasPorAnio[year] = (atletasPorAnio[year] || 0) + 1;
                }
            });
            console.log('Atletas por año:', atletasPorAnio);

            // 3. Crear array de años ordenados
            // eslint-disable-next-line svelte/prefer-svelte-reactivity
            const yearsSet = new Set();
            Object.keys(methylPorAnio).forEach(y => yearsSet.add(parseInt(y)));
            Object.keys(atletasPorAnio).forEach(y => yearsSet.add(parseInt(y)));
            const years = Array.from(yearsSet).sort((a, b) => a - b);
            console.log('Años:', years);

            const methylValues  = years.map(y => methylPorAnio[y]  || 0);
            const atletasValues = years.map(y => atletasPorAnio[y] || 0);

            await tick();
            await new Promise(resolve => setTimeout(resolve, 200));

            // 4. Importar c3 y d3
            const c3Module = await import('c3');
            const d3Module = await import('d3');
            await import('c3/c3.css');

            const c3 = c3Module.default || c3Module;
            const d3 = d3Module.default || d3Module;

            // 5. Generar gráfico
            c3.generate({
                bindto: '#chart',
                data: {
                    columns: [
                        ['Consumo Methyl Bromide (toneladas)', ...methylValues],
                        ['Atletas Olímpicos', ...atletasValues]
                    ],
                    type: 'bar',
                    colors: {
                        'Consumo Methyl Bromide (toneladas)': '#2085d8',
                        'Atletas Olímpicos': '#fb8c00'
                    }
                },
                axis: {
                    x: {
                        type: 'category',
                        categories: years.map(y => y.toString()),
                        label: { text: 'Año', position: 'outer-center' },
                        tick: {
                            rotate: 45,
                            multiline: false,
                            culling: false
                        }
                    },
                    y: {
                        label: { text: 'Valor (escala logarítmica)', position: 'outer-middle' },
                        type: 'log',
                        tick: {
                            format: v => {
                                if (v === 0) return '0';
                                if (v < 1) return v.toFixed(1);
                                return d3.format(',.0f')(v);
                            },
                            values: [1, 10, 100, 1000, 10000, 100000, 1000000]
                        }
                    }
                },
                tooltip: {
                    grouped: true,
                    contents: (d) => {
                        const idx = d[0].index;
                        const year = years[idx];
                        
                        // Países con atletas en ese año
                        const paisesAtletas = athletes
                            .filter(a => a.year === year)
                            .map(a => a.team);
                        const paisesUnicos = [...new Set(paisesAtletas)].join(', ') || 'Sin datos';

                        // País con methyl bromide en ese año
                        const ozItem = ozonoData.find(o => o.year === year && o.country !== 'world' && o.country !== 'asia');
                        const paisOzono = ozItem ? ozItem.country : 'Sin datos';

                        const methyl = methylValues[idx];
                        const atletas = atletasValues[idx];

                        return `
                            <div style="background:white;padding:10px 14px;border-radius:8px;border:1px solid #ddd;font-family:'Segoe UI',sans-serif;font-size:13px;">
                                <b style="color:#333">${year}</b>
                                <hr style="margin:6px 0;border-color:#f0f0f0">
                                <div>🌍 <b>Consumo Methyl Bromide:</b> ${methyl.toLocaleString()} toneladas</div>
                                <div style="color:#666;font-size:12px;margin-left:18px">País: ${paisOzono}</div>
                                <div style="margin-top:6px">🏅 <b>Atletas Olímpicos:</b> ${atletas} atletas</div>
                                <div style="color:#666;font-size:12px;margin-left:18px">Países: ${paisesUnicos}</div>
                            </div>
                        `;
                    }
                },
                legend: {
                    position: 'bottom'
                },
                size: { height: 550 },
                grid: { y: { show: true } }
            });

            console.log('Gráfico generado correctamente');
            
            // ✅ Ocultar loading después de que el gráfico esté listo
            loading = false;

        } catch (err) {
            console.error('ERROR:', err);
            error = err.message;
            loading = false;  // ✅ Ocultar loading también en caso de error
        }
    });
</script>

<svelte:head>
    <title>Integración 1 - Olympics & Ozono</title>
</svelte:head>

<div class="container">
    <h1>🏅 Consumo Methyl Bromide vs Atletas Olímpicos</h1>
    <p class="subtitle">Datos de <strong>API propia</strong> (consumo de Methyl Bromide por año) y <strong>SOS2526-30</strong> (atletas olímpicos por año)</p>

    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Ozone Depleting Substance Consumptions — <code>/api/v1/ozone-depleting-substance-consumptions/loadInitialData</code></p>
        <p><strong>API 2 (compañero SOS):</strong> Olympics Athlete Events — <code>https://sos2526-30.onrender.com/api/v1/olympics-athlete-events/loadInitialData</code></p>
        <p><strong>Integración:</strong> Comparativa por año entre el consumo de Methyl Bromide (toneladas) y el número de atletas olímpicos, mostrando al pasar el ratón el país de origen de cada dato.</p>
    </div>

    <div class="chart-card" style="position: relative;">
        <div id="chart" style="width: 100%; min-height: 550px;"></div>
        
        {#if loading}
            <div class="loading-overlay">
                <div class="spinner"></div>
                <p>Cargando datos y generando gráfico...</p>
            </div>
        {/if}
    </div>

    {#if error}
        <div class="error-box">❌ Error: {error}</div>
    {/if}

    <div class="info">
        <h3>Sobre esta integración</h3>
        <ul>
            <li><strong>Tipo de gráfico:</strong> Bar (barras agrupadas) con <strong>c3.js + d3.js</strong></li>
            <li><strong>Eje X:</strong> Año</li>
            <li><strong>Eje Y:</strong> Valor en escala logarítmica</li>
            <li><strong>Azul:</strong> Consumo total de Methyl Bromide (toneladas) por año — API de ozono</li>
            <li><strong>Naranja:</strong> Número de atletas olímpicos por año — API Olympics</li>
        </ul>
    </div>
</div>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #333;
    }

    h1 {
        color: #2085d8;
        text-align: center;
        margin-bottom: 0.5rem;
        font-size: 1.8rem;
    }

    .subtitle {
        text-align: center;
        color: #666;
        margin-bottom: 1.5rem;
    }

    .info-api {
        background: #f0f9ff;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        font-size: 0.85rem;
        border-left: 4px solid #2085d8;
    }

    .info-api p { margin: 0.3rem 0; }

    .info-api code {
        background: #e2e8f0;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        font-size: 0.8rem;
    }

    .chart-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.07);
        margin-bottom: 2rem;
        border: 1px solid #f0f0f0;
        position: relative;
        min-height: 590px;
    }

    /* ✅ Estilos para el overlay de carga */
    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border-radius: 12px;
        z-index: 10;
        backdrop-filter: blur(4px);
    }

    .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #e0e0e0;
        border-top-color: #2085d8;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .loading-overlay p {
        margin: 0.25rem 0;
        color: #555;
        font-size: 1rem;
    }

    .loading-note {
        font-size: 0.8rem;
        color: #999;
    }

    .error-box {
        background: #fee2e2;
        color: #dc2626;
        padding: 16px;
        border-radius: 8px;
        text-align: center;
        margin-bottom: 1rem;
    }

    .info {
        margin-top: 1rem;
        padding: 1rem;
        background: #f0f9ff;
        border-radius: 12px;
        border: 1px solid #bae6fd;
    }

    .info h3 { color: #2085d8; margin-top: 0; }
    .info ul { margin: 0; padding-left: 1.5rem; }
    .info li { margin: 0.5rem 0; color: #333; }
</style>