<script>
    // @ts-nocheck
    import { onMount, tick } from 'svelte';
    import Highcharts from 'highcharts';

    let loading = $state(true);
    let error = $state(null);
    let combinedData = $state([]);

    const countryToLanguage = {
        'china':          'Python',
        'japan':          'JavaScript',
        'united-states':  'TypeScript',
        'mexico':         'PHP',
        'bangladesh':     'Java',
        'costa-rica':     'Ruby',
        'singapore':      'Go'
    };

    const COUNTRY_LABELS = {
        'china':          'China',
        'japan':          'Japón',
        'united-states':  'EE.UU.',
        'mexico':         'México',
        'bangladesh':     'Bangladesh',
        'costa-rica':     'Costa Rica',
        'singapore':      'Singapur'
    };

    onMount(() => {
        fetchData();
    });

    async function fetchData() {
        try {
            loading = true;

            console.log('Cargando datos de ozono...');
            const resOzone = await fetch('/api/v1/ozone-depleting-substance-consumptions/loadInitialData');
            if (!resOzone.ok) throw new Error(`HTTP ${resOzone.status} - Ozono`);
            const ozoneData = await resOzone.json();
            const ozoneValidos = ozoneData.filter(d => countryToLanguage[d.country]);
            console.log('Datos ozono válidos:', ozoneValidos.length);

            console.log('Cargando datos de GitHub...');
            const reposMap = {};
            for (const country of Object.keys(countryToLanguage)) {
                const language = countryToLanguage[country];
                if (reposMap[language] !== undefined) continue;
                try {
                    const res = await fetch(`/api/proxy/github?language=${language.toLowerCase()}`);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();
                    reposMap[language] = data.total_count || 0;
                    console.log(`${language}: ${reposMap[language]} repos`);
                } catch (e) {
                    console.error(`Error con ${language}:`, e);
                    reposMap[language] = 0;
                }
                await new Promise(r => setTimeout(r, 800));
            }

            // Sumar HCFC por país
            const sumByCountry = {};
            ozoneValidos.forEach(oz => {
                const country = oz.country;
                const value = Math.abs(oz.hcfc || 0);
                if (!sumByCountry[country]) sumByCountry[country] = 0;
                sumByCountry[country] += value;
            });

            combinedData = Object.entries(sumByCountry).map(([country, totalHCFC]) => ({
                key: country,
                label: COUNTRY_LABELS[country],
                language: countryToLanguage[country],
                totalHCFC: totalHCFC,
                repos: reposMap[countryToLanguage[country]] || 0
            }));

            console.log('Datos combinados:', $state.snapshot(combinedData));

            loading = false;
            await tick();
            setTimeout(() => crearGraficoRadar(), 300);
        } catch (e) {
            console.error('Error:', e);
            error = e.message;
            loading = false;
        }
    }

    async function crearGraficoRadar() {
    console.log('Creando gráfico radar con Highcharts...');
    let container = document.getElementById('radar-chart');
    let attempts = 0;
    while (!container && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        container = document.getElementById('radar-chart');
        attempts++;
    }
    if (!container) {
        console.error('Contenedor #radar-chart no encontrado después de varios intentos');
        return;
    }

    // Ordenar países por nombre para que los ejes sean legibles
    const sortedCountries = [...combinedData].sort((a, b) => a.label.localeCompare(b.label));
    const categories = sortedCountries.map(c => `${c.label} (${c.language})`);

    // Obtener valores
    const hcfcValues = sortedCountries.map(c => c.totalHCFC);
    const reposValues = sortedCountries.map(c => c.repos);

    // Normalizar a porcentaje (0-100%)
    const maxHCFC = Math.max(...hcfcValues);
    const maxRepos = Math.max(...reposValues);
    const hcfcPercent = hcfcValues.map(v => (v / maxHCFC) * 100);
    const reposPercent = reposValues.map(v => (v / maxRepos) * 100);

    Highcharts.chart('radar-chart', {
        chart: { polar: true, type: 'line', height: 550 },
        accessibility: { enabled: false },   // Elimina la advertencia
        title: { text: 'Comparativa de HCFC y repositorios GitHub por país', style: { fontSize: '18px', color: '#2085d8' } },
        subtitle: { text: 'Radar normalizado (0-100%) – cada país es un eje', style: { fontSize: '12px', color: '#666' } },
        xAxis: { categories: categories, tickmarkPlacement: 'on', lineWidth: 0 },
        yAxis: { gridLineInterpolation: 'polygon', min: 0, max: 100, tickInterval: 20, labels: { format: '{value}%' } },
        tooltip: {
            shared: true,
            pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y:.1f}%</b><br/>'
        },
        plotOptions: {
            series: {
                dataLabels: { enabled: true, format: '{point.y:.0f}%', style: { fontSize: '10px' } },
                marker: { enabled: true, radius: 4 }
            }
        },
        series: [{
            name: 'Consumo HCFC',
            data: hcfcPercent,
            color: '#2085d8',
            pointPlacement: 'on'
        }, {
            name: 'Repositorios GitHub',
            data: reposPercent,
            color: '#f59e0b',
            pointPlacement: 'on'
        }],
        credits: { enabled: false }
    });
    console.log('Gráfico radar creado');
    }
</script>

<svelte:head>
    <title>Integración 3 - GitHub & Ozono (Radar)</title>
</svelte:head>

<div class="container">
    <h1>🐙 Repositorios GitHub vs  Consumo de HCFC por País</h1>
    <p class="subtitle">Datos de <strong>API propia</strong> (consumo total de HCFC por país) y <strong>GitHub API</strong> (repositorios por lenguaje de programación asociado)</p>
    

    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Ozone Depleting Substance Consumptions — <code>/api/v1/ozone-depleting-substance-consumptions</code></p>
        <p><strong>API 2 (GitHub, con proxy):</strong> GitHub Search API — <code>/api/proxy/github?language=python</code></p>
        <p><strong>Integración:</strong> A cada país de la API de ozono se le asocia un lenguaje de programación. Se obtiene el consumo total de HCFC del país  y el número de repositorios GitHub en ese lenguaje. Ambos valores se normalizan a 0-100% para compararlos visualmente en el radar.</p>   </div>

    {#if loading}
        <div class="loading-box">
            <div class="spinner"></div>
            <p>Cargando datos de ambas APIs...</p>
            <p class="loading-note">Consultando GitHub para cada lenguaje de programación...</p>
        </div>
    {:else if error}
        <div class="error-box">❌ Error: {error}</div>
    {:else}
        <div class="chart-card">
            <div id="radar-chart" style="width:100%; height:550px;"></div>
        </div>

        <div class="table-container">
            <h3>📋 Datos integrados por país (agregados)</h3>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>País</th>
                            <th>Lenguaje asociado</th>
                            <th>HCFC total (ton)</th>
                            <th>Repositorios GitHub</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each combinedData as d (d.key)}
                            <tr>
                                <td>{d.label}</td>
                                <td><code>{d.language}</code></td>
                                <td>{d.totalHCFC.toLocaleString()}</td>
                                <td>{d.repos.toLocaleString()}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="info">
            <h3>📖 Sobre esta integración</h3>
            <ul>
                <li><strong>Biblioteca:</strong> Highcharts | <strong>Tipo:</strong> Bubble Chart Radar (polar)</li>
                <li><strong>Normalización:</strong> Ambos conjuntos de datos están normalizados a porcentaje (0-100%) respecto a su valor máximo para permitir comparación visual.</li>
                <li><strong>Interpretación:</strong> Cada eje representa un país. El polígono azul muestra el consumo de HCFC, el naranja los repositorios GitHub. La forma y solapamiento indican si ambos factores están correlacionados.</li>
            </ul>
        </div>
    {/if}
</div>

<style>
    .container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #333;
    }

    h1 { color: #2085d8; text-align: center; margin-bottom: 0.5rem; font-size: 1.8rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 1.5rem; }

    .info-api {
        background: #f0f9ff;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        font-size: 0.85rem;
        border-left: 4px solid #2085d8;
    }

    .info-api p { margin: 0.3rem 0; }
    .info-api code { background: #e2e8f0; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.8rem; }

    .loading-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 60px 0;
        color: #888;
        gap: 12px;
    }

    .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #2085d8;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .loading-note { font-size: 0.8rem; color: #aaa; }

    .error-box {
        background: #fee2e2;
        color: #dc2626;
        padding: 16px;
        border-radius: 8px;
        text-align: center;
    }

    .chart-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.07);
        margin-bottom: 2rem;
        border: 1px solid #f0f0f0;
    }

    .table-container { margin-top: 1rem; border-top: 1px solid #e2e8f0; padding-top: 1rem; }
    .table-container h3 { color: #2085d8; margin-bottom: 1rem; }
    .table-wrapper { overflow-x: auto; }

    table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }

    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e2e8f0; }

    th {
        background: #f8fafc;
        font-weight: 600;
        color: #2085d8;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    tr:hover { background: #f0f9ff; }

    code {
        background: #f0f0f0;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.82rem;
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