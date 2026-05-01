<script>
    // @ts-nocheck
    import { onMount, tick } from 'svelte';
    import { browser } from '$app/environment';
    import Plotly from 'plotly.js-dist';  

    // svelte-ignore non_reactive_update
        let error = null;
    let loading = $state(true);
    let chartCreated = false;

    // Función de transformación logarítmica que maneja negativos y cero
    function transformY(y) {
        if (y === 0) return 0;
        const absVal = Math.abs(y);
        const logVal = Math.log10(1 + absVal);
        return y > 0 ? logVal : -logVal;
    }

    onMount(async () => {
        console.log('=== INICIO CARGA DE DATOS ===');
        
        // Pequeño retraso para asegurar DOM
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Verificar que estamos en el navegador
        if (!browser) {
            console.log('No estamos en el navegador, saltando...');
            return;
        }
        
        try {
            // 1. Obtener datos de tu API (ozono - HCFC)
            console.log('📡 Cargando datos de Elena (HCFC)...');
            const resElena = await fetch('/api/v2/ozone-depleting-substance-consumptions');
            if (!resElena.ok) throw new Error(`HTTP ${resElena.status} - Elena`);
            const elenaData = await resElena.json();
            const ozonoData = Array.isArray(elenaData) ? elenaData : [];
            console.log('   Datos Elena:', ozonoData.length);

            // Agrupar HCFC por país
            const hcfcPorPais = {};
            const aniosHCFCporPais = {};
            
            ozonoData.forEach(item => {
                const country = item.country;
                if (country === 'world' || country === 'asia') return;
                const year = item.year;
                let valor = Number(item.hcfc) || 0;
                
                if (!hcfcPorPais[country]) {
                    hcfcPorPais[country] = 0;
                    aniosHCFCporPais[country] = [];
                }
                hcfcPorPais[country] += valor;
                aniosHCFCporPais[country].push(year);
            });
            
            console.log(`   HCFC - valores: ${Object.values(hcfcPorPais).map(v => v.toFixed(0)).join(', ')}`);

            // 2. Obtener datos de Military Stats
            console.log('📡 Cargando Military Stats (grupo 13)...');
            let militaryPorPais = {};
            let aniosMilitaryPorPais = {};
            
            try {
                const resMilitary = await fetch('https://sos2526-13.onrender.com/api/v2/military-stats');
                if (resMilitary.ok) {
                    const militaryData = await resMilitary.json();
                    const militaryStats = Array.isArray(militaryData) ? militaryData : (militaryData.data || []);
                    console.log('   Military Stats:', militaryStats.length);
                    
                    militaryStats.forEach(item => {
                        const country = item.country;
                        const year = item.year;
                        
                        if (!militaryPorPais[country]) {
                            militaryPorPais[country] = {
                                milex_total: 0,
                                milex_gdp: 0,
                                milex_per_capita: 0,
                                count: 0
                            };
                            aniosMilitaryPorPais[country] = [];
                        }
                        
                        militaryPorPais[country].milex_total += item.milex_total || 0;
                        militaryPorPais[country].milex_gdp += item.milex_gdp || 0;
                        militaryPorPais[country].milex_per_capita += item.milex_per_capita || 0;
                        militaryPorPais[country].count++;
                        aniosMilitaryPorPais[country].push(year);
                    });
                    
                    for (const country in militaryPorPais) {
                        const count = militaryPorPais[country].count;
                        militaryPorPais[country].milex_gdp_avg = militaryPorPais[country].milex_gdp / count;
                        militaryPorPais[country].milex_per_capita_avg = militaryPorPais[country].milex_per_capita / count;
                    }
                }
            } catch (e) {
                console.warn('Military API error:', e.message);
            }

            // 3. Preparar puntos
            const puntos = [];
            
            for (const [pais, hcfcTotal] of Object.entries(hcfcPorPais)) {
                const mil = militaryPorPais[pais];
                const aniosHCFC = aniosHCFCporPais[pais] || [];
                const aniosMil = aniosMilitaryPorPais[pais] || [];
                
                const x = mil ? mil.milex_per_capita_avg : 0;
                const yOriginal = hcfcTotal;
                const yTransformed = transformY(yOriginal);
                const size = mil ? Math.max(Math.abs(mil.milex_total) / 1000, 8) : 8;
                const allYears = [...new Set([...aniosHCFC, ...aniosMil])].sort((a,b) => a-b);
                
                puntos.push({
                    country: pais.charAt(0).toUpperCase() + pais.slice(1),
                    x: x,
                    y: yTransformed,
                    yOriginal: yOriginal,
                    size: Math.min(size, 50),
                    gastoTotal: mil ? mil.milex_total : 0,
                    perCapita: x,
                    pibPorcentaje: mil ? mil.milex_gdp_avg : 0,
                    anios: allYears.join(', '),
                    aniosHCFC: aniosHCFC.sort((a,b)=>a-b).join(', '),
                    aniosMil: aniosMil.sort((a,b)=>a-b).join(', '),
                    tieneMilitary: !!mil,
                    origen: mil ? 'Ambas APIs' : 'Solo Ozono'
                });
            }
            
            for (const [pais, mil] of Object.entries(militaryPorPais)) {
                if (!hcfcPorPais[pais]) {
                    const aniosMil = aniosMilitaryPorPais[pais] || [];
                    
                    puntos.push({
                        country: pais.charAt(0).toUpperCase() + pais.slice(1),
                        x: mil.milex_per_capita_avg,
                        y: transformY(0),
                        yOriginal: 0,
                        size: Math.min(Math.max(mil.milex_total / 1000, 8), 50),
                        gastoTotal: mil.milex_total,
                        perCapita: mil.milex_per_capita_avg,
                        pibPorcentaje: mil.milex_gdp_avg,
                        anios: aniosMil.sort((a,b)=>a-b).join(', '),
                        aniosHCFC: 'Sin datos',
                        aniosMil: aniosMil.sort((a,b)=>a-b).join(', '),
                        tieneMilitary: true,
                        origen: 'Solo Military'
                    });
                }
            }
            
            console.log(`📊 Puntos totales: ${puntos.length}`);
            
            // Ticks personalizados
            const tickValues = [-1000000, -100000, -10000, -1000, -100, -10, 0, 10, 100, 1000, 10000, 100000, 1000000];
            const tickTransformed = tickValues.map(v => transformY(v));
            const tickText = tickValues.map(v => {
                if (v === 0) return '0';
                if (v >= 1000000) return (v/1000000).toFixed(0) + 'M';
                if (v >= 1000) return (v/1000).toFixed(0) + 'k';
                if (v <= -1000000) return (v/1000000).toFixed(0) + 'M';
                if (v <= -1000) return (v/1000).toFixed(0) + 'k';
                return v.toString();
            });

            await tick();
            
            // ESPERAR A QUE EL CONTENEDOR EXISTA
            let chartContainer = document.getElementById('scatter-chart');
            let attempts = 0;
            while (!chartContainer && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                chartContainer = document.getElementById('scatter-chart');
                attempts++;
                console.log(`Esperando contenedor... intento ${attempts}`);
            }
            
            if (!chartContainer) {
                throw new Error('Contenedor #scatter-chart no encontrado después de 10 intentos');
            }
            
            // Limpiar contenedor
            while (chartContainer.firstChild) {
                chartContainer.removeChild(chartContainer.firstChild);
            }
            
            // ✅ Plotly ya está importado, no necesitas importarlo de nuevo
            if (!chartCreated) {
                console.log('✅ Usando Plotly (importado globalmente)');
                
                const trace = {
                    x: puntos.map(p => p.x),
                    y: puntos.map(p => p.y),
                    mode: 'markers',
                    marker: {
                        size: puntos.map(p => p.size),
                        color: puntos.map(p => {
                            if (p.origen === 'Ambas APIs') return '#2085d8';
                            if (p.origen === 'Solo Ozono') return '#10b981';
                            return '#f59e0b';
                        }),
                        opacity: 0.8,
                        line: { width: 1, color: 'white' },
                        sizeref: 2,
                        sizemin: 6,
                        sizemode: 'area'
                    },
                    text: puntos.map(p => {
                        if (p.origen === 'Solo Military') {
                            return `<b>${p.country}</b><br>
                                    📌 Solo Military<br>
                                    📅 Años: ${p.anios}<br>
                                    Gasto per cápita: ${p.perCapita.toFixed(2)} USD<br>
                                    Gasto total: ${p.gastoTotal.toLocaleString()} M USD<br>
                                    % PIB defensa: ${p.pibPorcentaje.toFixed(2)}%`;
                        } else if (p.origen === 'Solo Ozono') {
                            return `<b>${p.country}</b><br>
                                    📌 Solo Ozono<br>
                                    📅 Años: ${p.aniosHCFC}<br>
                                    Consumo HCFC: ${p.yOriginal.toLocaleString()} toneladas`;
                        } else {
                            return `<b>${p.country}</b><br>
                                    📌 Ambas APIs<br>
                                    📅 Años HCFC: ${p.aniosHCFC}<br>
                                    📅 Años Military: ${p.aniosMil}<br>
                                    Consumo HCFC: ${p.yOriginal.toLocaleString()} toneladas<br>
                                    Gasto per cápita: ${p.perCapita.toFixed(2)} USD<br>
                                    Gasto total: ${p.gastoTotal.toLocaleString()} M USD<br>
                                    % PIB defensa: ${p.pibPorcentaje.toFixed(2)}%`;
                        }
                    }),
                    hoverinfo: 'text',
                    type: 'scatter'
                };

                const layout = {
                    xaxis: {
                        title: { text: 'Gasto militar per cápita (USD)', font: { size: 12 } },
                        zeroline: false,
                        gridcolor: '#e0e0e0'
                    },
                    yaxis: {
                        title: { text: 'Consumo de HCFC (toneladas) - escala logarítmica', font: { size: 12 } },
                        type: 'linear',
                        zeroline: true,
                        gridcolor: '#e0e0e0',
                        tickmode: 'array',
                        tickvals: tickTransformed,
                        ticktext: tickText,
                        tickangle: 0
                    },
                    plot_bgcolor: '#ffffff',
                    paper_bgcolor: '#ffffff',
                    height: 550,
                    margin: { t: 30, l: 100, r: 40, b: 60 }
                };

                const config = {
                    responsive: true,
                    displayModeBar: false,
                    staticPlot: false
                };

                // ✅ Usar Plotly directamente (ya importado)
                await Plotly.newPlot('scatter-chart', [trace], layout, config);
                chartCreated = true;
                console.log('✅ Gráfico creado con Plotly');
            }
            
            loading = false;

        } catch (err) {
            console.error('ERROR:', err);
            error = err.message;
            loading = false;
        }
    });
</script>

<svelte:head>
    <title>Integración 2 - Military Stats & Ozono</title>
</svelte:head>

<div class="container">
    <h1>🎯 Gasto Militar vs Consumo de HCFC</h1>
    <p class="subtitle">Datos de <strong>API propia</strong> (Consumo de HCFC por país) y <strong>SOS2526-13</strong> (Gasto militar per cápita por país)</p>

    <div class="legend">
        <div class="legend-item"><span style="background: #2085d8;"></span> Ambas APIs</div>
        <div class="legend-item"><span style="background: #10b981;"></span> Solo Ozono (sin datos militares)</div>
        <div class="legend-item"><span style="background: #f59e0b;"></span> Solo Military (sin HCFC)</div>
    </div>

    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Ozone Depleting Substance Consumptions — <code>/api/v1/ozone-depleting-substance-consumptions</code></p>
        <p><strong>API 2 (compañero SOS grupo 13):</strong> Military Stats — <code>https://sos2526-13.onrender.com/api/v1/military-stats</code></p>
    </div>

    <div class="chart-card">
        <div id="scatter-chart" style="width: 100%; min-height: 550px;"></div>
        
        {#if loading}
            <div class="loading-overlay">
                <div class="spinner"></div>
                <p>Cargando datos...</p>
            </div>
        {/if}
    </div>

    {#if error}
        <div class="error-box">❌ Error: {error}</div>
    {/if}

    <div class="info">
        <h3>Sobre esta integración</h3>
        <ul>
            <li><strong>Biblioteca:</strong> Plotly.js | <strong>Tipo:</strong> Bubble Chart (gráfico de burbujas)</li>
            <li><strong>🔵 Azul:</strong> Países con datos en ambas APIs</li>
            <li><strong>🟢 Verde:</strong> Países solo en API Ozono (sin datos militares)</li>
            <li><strong>🟠 Naranja:</strong> Países solo en API Military (sin HCFC)</li>
            <li><strong>Eje X:</strong> Gasto militar per cápita (USD)</li>
            <li><strong>Eje Y:</strong> Consumo de HCFC (toneladas) - Escala logarítmica</li>
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
    h1 { color: #2085d8; text-align: center; margin-bottom: 0.5rem; font-size: 1.8rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 1rem; }
    
    .legend {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }
    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
    }
    
    .legend-item span {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: inline-block;
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
    .info-api code { background: #e2e8f0; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.8rem; }
    
    .chart-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.07);
        margin-bottom: 2rem;
        border: 1px solid #f0f0f0;
        position: relative;
        min-height: 550px;
    }
    
    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 12px;
        z-index: 10;
    }
    
    .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #e0e0e0;
        border-top-color: #2085d8;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .error-box { background: #fee2e2; color: #dc2626; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 1rem; }
    .info { margin-top: 1rem; padding: 1rem; background: #f0f9ff; border-radius: 12px; border: 1px solid #bae6fd; }
    .info h3 { color: #2085d8; margin-top: 0; }
    .info ul { margin: 0; padding-left: 1.5rem; }
    .info li { margin: 0.5rem 0; }
</style>