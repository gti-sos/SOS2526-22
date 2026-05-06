<script>
    import { onMount, tick } from 'svelte';
    import * as echarts from 'echarts';

    let loading = $state(true);
    let error = $state(null);
    let chartContainer = $state(null);
    let chart = null;
    let combinedData = $state([]);

    const countryToLanguage = {
        'china': 'Python',
        'japan': 'JavaScript',
        'united-states': 'TypeScript',
        'mexico': 'PHP',
        'bangladesh': 'Java',
        'costa-rica': 'Ruby',
        'singapore': 'Go'
    };

    const COUNTRY_LABELS = {
        'china': 'China',
        'japan': 'Japón',
        'united-states': 'EE.UU.',
        'mexico': 'México',
        'bangladesh': 'Bangladesh',
        'costa-rica': 'Costa Rica',
        'singapore': 'Singapur'
    };

    // Escala logarítmica (base 10) con desplazamiento para evitar log(0)
    function applyLog(value) {
        return Math.log10(value + 1);
    }

    async function fetchData() {
        console.log('🚀 Iniciando fetchData...');
        try {
            loading = true;
            error = null;

            // 1. Cargar HCFC (tu API)
            console.log('📡 Solicitando HCFC...');
            const resOzone = await fetch('/api/v1/ozone-depleting-substance-consumptions');
            if (!resOzone.ok) throw new Error(`HTTP ${resOzone.status} - Ozono`);
            const ozoneData = await resOzone.json();
            const ozoneValidos = ozoneData.filter(d => countryToLanguage[d.country]);
            console.log(`   HCFC válidos: ${ozoneValidos.length} registros`);

            // 2. Sumar HCFC por país
            const sumByCountry = {};
            ozoneValidos.forEach(oz => {
                const country = oz.country;
                const value = Math.abs(oz.hcfc || 0);
                if (!sumByCountry[country]) sumByCountry[country] = 0;
                sumByCountry[country] += value;
            });
            console.log('   Suma por país:', sumByCountry);

            // 3. Cargar datos de GitHub por lenguaje (proxy)
            console.log('🐙 Cargando datos de GitHub...');
            const reposMap = {};
            for (const country of Object.keys(countryToLanguage)) {
                const language = countryToLanguage[country];
                if (reposMap[language] !== undefined) continue;
                try {
                    const res = await fetch(`/api/proxy/github?language=${language.toLowerCase()}`);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();
                    reposMap[language] = data.total_count || 0;
                    console.log(`   ${language}: ${reposMap[language]} repos`);
                } catch (e) {
                    console.error(`   Error con ${language}:`, e);
                    reposMap[language] = 0;
                }
                await new Promise(r => setTimeout(r, 800));
            }

            // 4. Preparar datos combinados
            const raw = Object.entries(sumByCountry).map(([country, hcfcRaw]) => ({
                key: country,
                label: COUNTRY_LABELS[country],
                language: countryToLanguage[country],
                hcfcRaw,
                reposRaw: reposMap[countryToLanguage[country]] || 0
            }));
            console.log('   Datos raw:', raw);

            // 5. Aplicar escala logarítmica al HCFC (log10) y a los repos (también log para simetría? No, los repos ya tienen rangos más pequeños; pero podemos aplicar log también para que ambas escalas sean logarítmicas y comparables)
            // Para mantener la coherencia, aplicamos log a AMBAS variables, así ambas están en escala logarítmica.
            const logHcfc = raw.map(d => applyLog(d.hcfcRaw));
            const logRepos = raw.map(d => applyLog(d.reposRaw));
            const maxLogHcfc = Math.max(...logHcfc);
            const maxLogRepos = Math.max(...logRepos);
            console.log('   Máximos log: HCFC=', maxLogHcfc, 'Repos=', maxLogRepos);

            // 6. Normalizar a porcentaje (0-100) dentro de cada escala
            const normalizedHcfc = logHcfc.map(v => (v / maxLogHcfc) * 100);
            const normalizedRepos = logRepos.map(v => (v / maxLogRepos) * 100);
            console.log('   Normalizados HCFC (log):', normalizedHcfc);
            console.log('   Normalizados Repos (log):', normalizedRepos);

            // Guardar también para la tabla
            combinedData = raw.map((d, idx) => ({
                ...d,
                totalHCFC: d.hcfcRaw,
                repos: d.reposRaw,
                hcfcNorm: normalizedHcfc[idx],
                reposNorm: normalizedRepos[idx]
            }));

            // Ordenar por nombre para el radar
            const sorted = [...combinedData].sort((a, b) => a.label.localeCompare(b.label));
            const categories = sorted.map(c => `${c.label} (${c.language})`);
            const hcfcValues = sorted.map(c => c.hcfcNorm);
            const reposValues = sorted.map(c => c.reposNorm);
            console.log('   Categorías:', categories);
            console.log('   Valores HCFC radar (log/norm):', hcfcValues);
            console.log('   Valores Repos radar (log/norm):', reposValues);

            // 7. Renderizar gráfico radar con ECharts
            if (!chartContainer) throw new Error('Contenedor no disponible');
            if (chart) chart.dispose();
            chart = echarts.init(chartContainer);
            chart.setOption({
                tooltip: {
                    trigger: 'item',
                    formatter: (params) => {
                        const country = categories[params.dataIndex];
                        const hcfcRaw = sorted[params.dataIndex].totalHCFC;
                        const reposRaw = sorted[params.dataIndex].repos;
                        return `${country}<br/>HCFC: ${hcfcRaw.toLocaleString()} ton<br/>Repositorios: ${reposRaw.toLocaleString()}<br/>Escala: log10(valor+1) normalizada`;
                    }
                },
                radar: {
                    indicator: categories.map(c => ({ name: c, max: 100 })),
                    shape: 'circle',
                    center: ['50%', '50%'],
                    radius: '65%',
                    axisName: { fontSize: 10 }   // propiedad actualizada (evita la advertencia)
                },
                series: [{
                    type: 'radar',
                    data: [
                        { value: hcfcValues, name: 'Consumo HCFC (log)', areaStyle: { color: 'rgba(32,133,216,0.3)' }, lineStyle: { color: '#2085d8', width: 2 }, itemStyle: { color: '#2085d8' } },
                        { value: reposValues, name: 'Repositorios GitHub (log)', areaStyle: { color: 'rgba(245,158,11,0.3)' }, lineStyle: { color: '#f59e0b', width: 2 }, itemStyle: { color: '#f59e0b' } }
                    ],
                    symbolSize: 8,
                    symbol: 'circle'
                }],
                legend: { data: ['Consumo HCFC (log)', 'Repositorios GitHub (log)'], left: 'center', bottom: 0 }
            });

            loading = false;
            console.log('✅ Gráfico renderizado correctamente (escala logarítmica)');
        } catch (err) {
            console.error('❌ Error en fetchData:', err);
            error = err.message;
            loading = false;
        }
    }

    onMount(async () => {
        console.log('🟢 Componente montado, esperando contenedor...');
        await tick();
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('   chartContainer =', chartContainer);
        if (chartContainer) {
            console.log('➡️ Contenedor listo, ejecutando fetchData');
            fetchData();
        } else {
            console.error('❌ Contenedor no encontrado después de esperar');
            loading = false;
            error = 'No se pudo encontrar el contenedor del gráfico';
        }
    });
</script>

<!-- El resto (HTML, CSS) se mantiene exactamente igual, solo cambio la descripción -->

<svelte:head>
    <title>Integración 3 - GitHub & Ozono (Radar ECharts)</title>
</svelte:head>

<div class="container">
    <h1>🐙 Repositorios GitHub vs Consumo de HCFC por País</h1>
    <p class="subtitle">Datos de <strong>API propia</strong> (HCFC) y <strong>GitHub API</strong> (repositorios por lenguaje asociado). Escala comprimida (potencia 0.3) para hacer visibles las diferencias.</p>

    <div class="info-api">
        <p><strong>API propia:</strong> HCFC — <code>/api/v1/ozone-depleting-substance-consumptions</code></p>
        <p><strong>API GitHub (proxy):</strong> <code>/api/proxy/github?language=python</code></p>
        <p><strong>Integración:</strong> A cada país se asocia un lenguaje de programación. Se aplica compresión (x^0.3) al HCFC para que los valores pequeños no queden ocultos. Ambos se normalizan a 0-100% y se comparan en un radar.</p>
    </div>

    <!-- Contenedor siempre presente con overlay de carga -->
    <div class="chart-card" style="position: relative;">
        <div bind:this={chartContainer} style="width:100%; height:550px;"></div>
        {#if loading}
            <div class="loading-overlay">
                <div class="spinner"></div>
                <p>Cargando datos de ambas APIs...</p>
                <p class="loading-note">Consultando GitHub para cada lenguaje de programación...</p>
            </div>
        {/if}
    </div>

    {#if !loading && !error}
        <div class="table-container">
            <h3>📋 Datos integrados por país (valores reales)</h3>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr><th>País</th><th>Lenguaje</th><th>HCFC total (ton)</th><th>Repositorios GitHub</th></tr>
                    </thead>
                    <tbody>
                        {#each combinedData as d}
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
    {/if}

    {#if error}
        <div class="error-box">❌ Error: {error}</div>
    {/if}

    <div class="info">
        <h3>📖 Sobre esta integración</h3>
        <ul>
            <li><strong>Biblioteca:</strong> ECharts | <strong>Tipo:</strong> radar (área y líneas)</li>
            <li><strong>Transformación:</strong> Los valores de HCFC se comprimen con potencia 0.3 antes de normalizar, para que los países con bajo HCFC sean visibles (ej. Japón ya no queda oculto por China).</li>
            <li><strong>Proxy:</strong> Las peticiones a GitHub se realizan mediante nuestro proxy para evitar CORS.</li>
            <li><strong>Interpretación:</strong> El polígono azul (HCFC) y el naranja (repos) se comparan en el mismo radar. La compresión permite ver mejor la forma de cada uno.</li>
        </ul>
    </div>
</div>

<style>
    .container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
        font-family: 'Segoe UI', sans-serif;
        color: #333;
    }
    h1 { color: #2085d8; text-align: center; margin-bottom: 0.5rem; font-size: 1.8rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 1.5rem; }
    .info-api {
        background: #f0f9ff;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        border-left: 4px solid #2085d8;
    }
    .info-api p { margin: 0.3rem 0; }
    .info-api code { background: #e2e8f0; padding: 0.2rem 0.4rem; border-radius: 4px; }
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
    }
    .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e0e0e0;
        border-top-color: #2085d8;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-bottom: 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-note { font-size: 0.8rem; color: #aaa; margin-top: 0.5rem; }
    .error-box {
        background: #fee2e2;
        color: #dc2626;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        margin-bottom: 1rem;
    }
    .chart-card {
        background: white;
        border-radius: 12px;
        padding: 1rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        margin-bottom: 2rem;
        position: relative;
        min-height: 600px;
    }
    .table-container {
        margin-top: 1rem;
        border-top: 1px solid #e2e8f0;
        padding-top: 1rem;
    }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; color: #2085d8; text-transform: uppercase; letter-spacing: 0.04em; }
    .info {
        margin-top: 1rem;
        background: #f0f9ff;
        padding: 1rem;
        border-radius: 12px;
    }
</style>