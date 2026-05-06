<script>
    import { onMount } from 'svelte';
    import * as echarts from 'echarts';

    let loading = $state(true);
    let error = $state(null);
    let chart = null;
    let container = $state(null);

    const RISK_FACTOR = 'air_pollution';
    const FACTOR_NAME = 'Contaminación del aire (muertes)';

    function normalizeCountryName(name) {
        return name.toLowerCase().replace(/[\s_]+/g, '-');
    }

    async function loadDataAndRender() {
        try {
            // 1. Datos HCFC (API propia)
            const resOzone = await fetch('/api/v1/ozone-depleting-substance-consumptions');
            if (!resOzone.ok) throw new Error(`HTTP ${resOzone.status} - Ozono`);
            const ozoneData = await resOzone.json();
            const hcfcByCountry = {};
            ozoneData.forEach(item => {
                const country = item.country;
                if (country === 'world' || country === 'asia') return;
                const value = Math.abs(item.hcfc || 0);
                hcfcByCountry[country] = (hcfcByCountry[country] || 0) + value;
            });

            // 2. Datos riesgos (compañero grupo 10)
            const resRisk = await fetch('https://sos2526-10.onrender.com/api/v2/deaths-by-risk-factors');
            if (!resRisk.ok) throw new Error(`HTTP ${resRisk.status} - Risk factors`);
            const riskData = await resRisk.json();
            const riskArray = Array.isArray(riskData) ? riskData : (riskData.data || []);

            const riskByCountry = {};
            riskArray.forEach(item => {
                const entity = item.entity;
                if (!entity || entity === 'World') return;
                const year = item.year;
                const normalized = normalizeCountryName(entity);
                if (!riskByCountry[normalized] || riskByCountry[normalized].year < year) {
                    riskByCountry[normalized] = {
                        year: year,
                        [RISK_FACTOR]: Number(item[RISK_FACTOR]) || 0
                    };
                }
            });

            // 3. Combinar países con ambas métricas positivas
            const countries = [];
            const hcfcValues = [];
            const riskValues = [];
            for (const country of Object.keys(hcfcByCountry)) {
                const hcfc = hcfcByCountry[country];
                const risk = riskByCountry[country]?.[RISK_FACTOR] || 0;
                if (hcfc > 0 && risk > 0) {
                    countries.push(country.charAt(0).toUpperCase() + country.slice(1));
                    hcfcValues.push(hcfc);
                    riskValues.push(risk);
                }
            }
            if (countries.length === 0) throw new Error('No hay países con datos en ambas APIs');

            // 4. Top 10 por HCFC
            const combined = countries.map((c, i) => ({ country: c, hcfc: hcfcValues[i], risk: riskValues[i] }));
            combined.sort((a, b) => b.hcfc - a.hcfc);
            const top10 = combined.slice(0, 10);
            const topCountries = top10.map(item => item.country);
            const topHcfc = top10.map(item => item.hcfc);
            const topRisk = top10.map(item => item.risk);

            // 5. Calcular ranking (1 = mayor valor, 10 = menor)
            const rankHcfc = [...topHcfc].sort((a,b) => b - a);
            const rankRisk = [...topRisk].sort((a,b) => b - a);
            const hcfcRank = topHcfc.map(v => rankHcfc.indexOf(v) + 1);
            const riskRank = topRisk.map(v => rankRisk.indexOf(v) + 1);
            const maxRank = 10;
            const hcfcBar = hcfcRank.map(r => (maxRank + 1 - r) / maxRank * 100);
            const riskBar = riskRank.map(r => (maxRank + 1 - r) / maxRank * 100);

            if (!container) throw new Error('Contenedor no disponible');
            chart = echarts.init(container);
            chart.setOption({

                tooltip: {
                    trigger: 'item',
                    formatter: (params) => {
                        const idx = params.dataIndex;
                        const country = topCountries[idx];
                        const hcfc = topHcfc[idx];
                        const risk = topRisk[idx];
                        return `<b>${country}</b><br/>
                                <strong>Ranking HCFC:</strong> ${hcfcRank[idx]} (${hcfc.toLocaleString()} toneladas)<br/>
                                <strong>Ranking ${FACTOR_NAME}:</strong> ${riskRank[idx]} (${risk.toLocaleString()} muertes)`;
                    }
                },
                legend: {
                    data: ['Ranking HCFC', `Ranking ${FACTOR_NAME}`],
                    orient: 'vertical',
                    left: 'left',
                    top: 'center'
                },
                polar: {
                    radius: [0, '70%'],
                    center: ['50%', '50%']
                },
                angleAxis: {
                    type: 'category',
                    data: topCountries,
                    axisLabel: { rotate: 45, fontSize: 10 }
                },
                radiusAxis: {
                    name: 'Posición relativa (mayor = mejor ranking)',
                    min: 0,
                    max: 100,
                    axisLabel: { formatter: '{value}%' }
                },
                series: [
                    {
                        name: 'Ranking HCFC',
                        type: 'bar',
                        data: hcfcBar,
                        coordinateSystem: 'polar',
                        barCategoryGap: '20%',
                        itemStyle: { color: '#2085d8', borderRadius: [4,4,0,0] },
                        label: { show: true, position: 'outside', formatter: (p) => `${p.value.toFixed(0)}%`, fontSize: 9 }
                    },
                    {
                        name: `Ranking ${FACTOR_NAME}`,
                        type: 'bar',
                        data: riskBar,
                        coordinateSystem: 'polar',
                        barCategoryGap: '20%',
                        itemStyle: { color: '#fb8c00', borderRadius: [4,4,0,0] },
                        label: { show: true, position: 'outside', formatter: (p) => `${p.value.toFixed(0)}%`, fontSize: 9 }
                    }
                ]
            });

            window.addEventListener('resize', () => chart.resize());
            loading = false;
        } catch (err) {
            console.error(err);
            error = err.message;
            loading = false;
        }
    }

    $effect(() => {
        if (container) loadDataAndRender();
    });
</script>

<svelte:head>
    <title>Integración - Riesgos vs Ozono</title>
</svelte:head>

<div class="container">
    <h1>📊 Gráfico radial: Consumo de HCFC vs Contaminación del aire</h1>
    <p class="subtitle">Datos de <strong>API propia</strong> (consumo total de HCFC por país) y <strong>SOS2526-10</strong> (muertes por contaminación del aire)</p>

    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Ozone Depleting Substance Consumptions — <code>/api/v1/ozone-depleting-substance-consumptions</code></p>
        <p><strong>API 2 (compañero SOS grupo 10):</strong> Deaths by risk factors — <code>https://sos2526-10.onrender.com/api/v2/deaths-by-risk-factors</code></p>
        <p><strong>Integración:</strong> Comparativa entre el ranking de consumo de HCFC y el ranking de muertes por contaminación del aire
            .</p>
    </div>

    <div class="chart-card" style="position: relative;">
        <div bind:this={container} id="radial-bar-chart" style="width:100%; height:600px;"></div>
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
            <li><strong>Biblioteca:</strong> ECharts | <strong>Tipo:</strong> Radial bar (barras polares)</li>
            <li><strong>Ejes:</strong> Eje angular (circular) = países ; Eje radial = posición relativa (0-100%)</li>
            <li><strong>🔵 Azul:</strong> Ranking de consumo de HCFC (toneladas) </li>
            <li><strong>🟠 Naranja:</strong> Ranking de muertes por contaminación del aire </li>
            <li><strong>Escala:</strong> Ranking normalizado a porcentaje (1º puesto = 100%, 10º puesto = 0%)</li>
            <li><strong>Tooltip:</strong> Muestra el ranking y el valor real original (toneladas/muertes)</li>
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
        min-height: 650px;
    }

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