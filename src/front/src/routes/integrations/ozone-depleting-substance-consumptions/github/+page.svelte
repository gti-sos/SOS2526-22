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

    // Valores de fallback (datos reales obtenidos previamente vía proxy)
    const fallbackRepos = {
        'Python': 28915715,
        'JavaScript': 43988933,
        'TypeScript': 15283823,
        'PHP': 6117522,
        'Java': 20792007,
        'Ruby': 2955404,
        'Go': 2305789
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

            // 3. Cargar datos de GitHub por lenguaje (solo proxy, sin fallback)
            console.log('🐙 Cargando datos de GitHub vía proxy...');
            const reposMap = {};

            for (const country of Object.keys(countryToLanguage)) {
                const language = countryToLanguage[country];
                if (reposMap[language] !== undefined) continue;
                
                let success = false;
                let retries = 3;  // aumentado a 3 reintentos
                let lastError = null;
                
                while (retries >= 0 && !success) {
                    try {
                        const res = await fetch(`/api/proxy/github?language=${language.toLowerCase()}`);
                        if (res.ok) {
                            const data = await res.json();
                            reposMap[language] = data.total_count || 0;
                            console.log(`   ✅ ${language}: ${reposMap[language].toLocaleString()} repos (proxy)`);
                            success = true;
                        } else {
                            throw new Error(`HTTP ${res.status}`);
                        }
                    } catch (e) {
                        lastError = e;
                        console.warn(`   ⚠️ Error con ${language} (intento ${4-retries}/4):`, e.message);
                        retries--;
                        if (retries < 0) {
                            throw new Error(`No se pudo obtener datos de GitHub para ${language} después de 4 intentos. Proxy no disponible.`);
                        } else {
                            await new Promise(r => setTimeout(r, 2000)); // espera 2 segundos
                        }
                    }
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

            // 5. Escala logarítmica
            const logHcfc = raw.map(d => applyLog(d.hcfcRaw));
            const logRepos = raw.map(d => applyLog(d.reposRaw));
            const maxLogHcfc = Math.max(...logHcfc);
            const maxLogRepos = Math.max(...logRepos);
            console.log('   Máximos log: HCFC=', maxLogHcfc, 'Repos=', maxLogRepos);

            // 6. Normalizar a 0-100
            const normalizedHcfc = logHcfc.map(v => (v / maxLogHcfc) * 100);
            const normalizedRepos = logRepos.map(v => (v / maxLogRepos) * 100);
            console.log('   Normalizados HCFC:', normalizedHcfc);
            console.log('   Normalizados Repos:', normalizedRepos);

            combinedData = raw.map((d, idx) => ({
                ...d,
                totalHCFC: d.hcfcRaw,
                repos: d.reposRaw,
                hcfcNorm: normalizedHcfc[idx],
                reposNorm: normalizedRepos[idx]
            }));

            // 7. Ordenar para el radar
            const sorted = [...combinedData].sort((a, b) => a.label.localeCompare(b.label));
            const categories = sorted.map(c => `${c.label} (${c.language})`);
            const hcfcValues = sorted.map(c => c.hcfcNorm);
            const reposValues = sorted.map(c => c.reposNorm);
            console.log('   Categorías:', categories);
            console.log('   Valores HCFC radar:', hcfcValues);
            console.log('   Valores Repos radar:', reposValues);

            // 8. Renderizar gráfico radar con ECharts
            if (!chartContainer) throw new Error('Contenedor no disponible');
            if (chart) chart.dispose();
            chart = echarts.init(chartContainer);
            chart.setOption({
                radar: {
                    indicator: categories.map(c => ({ name: c, max: 100 })),
                    shape: 'circle',
                    center: ['50%', '50%'],
                    radius: '65%',
                    axisName: { fontSize: 10 }
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
            console.log('✅ Gráfico renderizado correctamente (escala logarítmica con proxy)');
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

<svelte:head>
    <title>Integración 3 - GitHub & Ozono (Radar ECharts con Proxy)</title>
</svelte:head>

<div class="container">
    <h1>🐙 Repositorios GitHub vs Consumo de HCFC por País</h1>
    <p class="subtitle">Datos de <strong>API propia</strong> (consumo de HCFC por país) y <strong>GitHub Search API</strong> (repositorios por lenguaje de programación asociado al país) a través de <strong>proxy propio</strong>.</p>

    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Ozone Depleting Substance Consumptions — <code>/api/v1/ozone-depleting-substance-consumptions</code></p>
        <p><strong>API 2 (GitHub, con proxy):</strong> GitHub Search API — <code>/api/proxy/github?language=python</code></p>
        <p><strong>Integración:</strong> A cada país de la API de ozono se le asocia un lenguaje de programación. Se obtiene el HCFC total del país y el número de repositorios GitHub en ese lenguaje. Ambos valores se normalizan con escala logarítmica a 0-100% para compararlos en el radar.</p>
    </div>

    <!-- Contenedor siempre presente con overlay de carga -->
    <div class="chart-card" style="position: relative;">
        <div bind:this={chartContainer} style="width:100%; height:550px;"></div>
        {#if loading}
            <div class="loading-overlay">
                <div class="spinner"></div>
                <p>Cargando datos de ambas APIs...</p>
                <p class="loading-note">Consultando GitHub a través de proxy propio...</p>
            </div>
        {/if}
    </div>

    {#if !loading && !error}
        <div class="table-container">
            <h3>Datos integrados por país (valores reales)</h3>
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
        <h3>Sobre esta integración</h3>
        <ul>
            <li><strong>Biblioteca:</strong> ECharts | <strong>Tipo:</strong> radar (área y líneas)</li>
            <li><strong>Proxy:</strong> Las peticiones a GitHub se realizan mediante proxy para evitar CORS.</li>
            <li><strong>🔵 Polígono azul:</strong> Consumo de HCFC normalizado</li>
            <li><strong>🟠 Polígono naranja:</strong> Repositorios GitHub normalizados</li>
            <li><strong>Cada eje:</strong> Un país con su lenguaje de programación asociado</li>
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