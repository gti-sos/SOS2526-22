<script>
    import { onMount } from 'svelte';
    import * as echarts from 'echarts';

    let loading = $state(true);
    let error = $state(null);
    let chartContainer = $state(null);
    // @ts-ignore
    let chart = null;
    // @ts-ignore
    let tableData = $state([]);

    // Función de escala logarítmica
    // @ts-ignore
    function logScale(value) {
        return Math.log10(value + 1);
    }

    async function fetchHCFCData() {
        console.log('📡 Obteniendo datos de HCFC...');
        const res = await fetch('https://sos2526-22.onrender.com/api/v1/ozone-depleting-substance-consumptions/loadInitialData');
        if (!res.ok) throw new Error(`HCFC API error: ${res.status}`);
        const data = await res.json();
        
        // eslint-disable-next-line svelte/prefer-svelte-reactivity
        const byYear = new Map();
        // @ts-ignore
        data.forEach(item => {
            if (item.country === 'world' || item.country === 'asia') return;
            const year = item.year;
            const hcfc = Math.abs(item.hcfc || 0);
            byYear.set(year, (byYear.get(year) || 0) + hcfc);
        });
        
        console.log('✅ HCFC por año (valores originales):', Array.from(byYear.entries()));
        return byYear;
    }

    async function fetchBatmanData() {
        console.log('🦇 Buscando Batman en TVmaze...');
        const url = 'https://api.tvmaze.com/search/shows?q=batman';
        const res = await fetch(url);
        if (!res.ok) throw new Error(`TVmaze error: ${res.status}`);
        const data = await res.json();
        
        // Primeros 10 resultados
        const top10 = data.slice(0, 10);
        // @ts-ignore
        console.log('Top 10 resultados:', top10.map(t => ({ name: t.show.name, weight: t.show.weight, year: t.show.premiered?.split('-')[0] })));
        
        // Agrupar weight por año de estreno
        // eslint-disable-next-line svelte/prefer-svelte-reactivity
        const byYear = new Map();
        // @ts-ignore
        top10.forEach(item => {
            const show = item.show;
            const premiered = show?.premiered;
            const weight = show?.weight || 0;
            
            if (premiered) {
                const year = parseInt(premiered.split('-')[0]);
                if (!isNaN(year)) {
                    const existing = byYear.get(year) || { 
                        totalWeight: 0, 
                        count: 0, 
                        shows: [],
                        maxWeight: 0 
                    };
                    existing.totalWeight += weight;
                    existing.count++;
                    existing.shows.push(`${show.name} (weight: ${weight})`);
                    if (weight > existing.maxWeight) existing.maxWeight = weight;
                    byYear.set(year, existing);
                }
            }
        });
        
        console.log('Weight por año:', Array.from(byYear.entries()).map(([y, d]) => ({ year: y, totalWeight: d.totalWeight, count: d.count })));
        return byYear;
    }

    async function loadData() {
        try {
            loading = true;
            error = null;

            const [hcfcByYear, batmanByYear] = await Promise.all([
                fetchHCFCData(),
                fetchBatmanData()
            ]);
            
            // eslint-disable-next-line svelte/prefer-svelte-reactivity
            const allYearsSet = new Set();
            for (const year of hcfcByYear.keys()) allYearsSet.add(year);
            for (const year of batmanByYear.keys()) allYearsSet.add(year);
            
            const years = Array.from(allYearsSet).sort((a, b) => a - b);
            
            // @ts-ignore
            const hcfcOriginal = [];
            const hcfcScaled = [];      // ← Escala logarítmica
            const batmanWeightValues = [];
            // @ts-ignore
            const batmanDetails = [];
            
            for (const year of years) {
                const hcfc = hcfcByYear.get(year) || 0;
                const batmanData = batmanByYear.get(year);
                const batmanWeight = batmanData ? batmanData.totalWeight : 0;
                
                hcfcOriginal.push(hcfc);
                hcfcScaled.push(logScale(hcfc));      // ← Aplicamos log10(valor + 1)
                batmanWeightValues.push(batmanWeight);
                batmanDetails.push(batmanData ? batmanData.shows : []);
                
                tableData.push({
                    year,
                    hcfc: hcfc.toLocaleString(),
                    hcfcLog: logScale(hcfc).toFixed(2),
                    batmanWeight,
                    batmanCount: batmanData ? batmanData.count : 0,
                    batmanShows: batmanData ? batmanData.shows.join('; ') : 'Sin datos'
                });
            }
            
            console.log('Valores escalados (log10):', hcfcScaled);
            console.log('Valores Batman weight:', batmanWeightValues);
            
            if (chartContainer) {
                // @ts-ignore
                if (chart) chart.dispose();
                chart = echarts.init(chartContainer);
                
                chart.setOption({
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        // @ts-ignore
                        formatter: (params) => {
                            const idx = params[0].dataIndex;
                            const year = years[idx];
                            let result = `<strong>Año ${year}</strong><br/>`;
                            // @ts-ignore
                            params.forEach(p => {
                                const value = p.value;
                                if (p.seriesName.includes('HCFC')) {
                                    // @ts-ignore
                                    const originalValue = hcfcOriginal[idx];
                                    result += `${p.marker} Consumo HCFC: ${originalValue.toLocaleString()} toneladas<br/>`;
                                    result += `<span style="margin-left:20px">📊 log10(${originalValue.toLocaleString()}+1) = ${value.toFixed(2)}</span><br/>`;
                                } else {
                                    result += `${p.marker} Weight Batman (acumulado): ${value}<br/>`;
                                    // @ts-ignore
                                    const shows = batmanDetails[idx];
                                    if (shows.length > 0) {
                                        result += `<span style="margin-left:20px">📺 ${shows.join('<br/>  ')}</span><br/>`;
                                    }
                                }
                            });
                            return result;
                        }
                    },
                    legend: {
                        data: ['log10(HCFC + 1)', 'Weight Batman (acumulado)'],
                        left: 'left',
                        top: 40
                    },
                    grid: {
                        containLabel: true,
                        left: '8%',
                        right: '8%',
                        top: '18%',
                        bottom: '8%'
                    },
                    yAxis: {
                        type: 'category',
                        data: years,
                        name: 'Año',
                        nameLocation: 'middle',
                        nameGap: 50,
                        axisLabel: { fontSize: 11 }
                    },
                    // DOS ESCALAS INDEPENDIENTES (ahora ambas en rangos similares)
                    xAxis: [
                        {
                            type: 'value',
                            name: 'log10(HCFC + 1)',
                            nameLocation: 'middle',
                            nameGap: 35,
                            position: 'bottom',
                            // @ts-ignore
                            axisLabel: { formatter: (v) => v.toFixed(1) },
                            min: 0,
                            max: Math.max(...hcfcScaled, 6)
                        },
                        {
                            type: 'value',
                            name: 'Weight Batman (acumulado)',
                            nameLocation: 'middle',
                            nameGap: 35,
                            position: 'top',
                            // @ts-ignore
                            axisLabel: { formatter: (v) => v.toFixed(0) },
                            splitLine: { show: false },
                            min: 0,
                            max: Math.max(...batmanWeightValues, 100)
                        }
                    ],
                    series: [
                        {
                            name: 'log10(HCFC + 1)',
                            type: 'bar',
                            data: hcfcScaled,
                            itemStyle: { color: '#2085d8', borderRadius: [0, 4, 4, 0] },
                            xAxisIndex: 0,
                            barWidth: '35%',
                            label: {
                                show: true,
                                position: 'right',
                                // @ts-ignore
                                formatter: (p) => p.value.toFixed(2),
                                fontSize: 9
                            }
                        },
                        {
                            name: 'Weight Batman (acumulado)',
                            type: 'bar',
                            data: batmanWeightValues,
                            itemStyle: { color: '#f59e0b', borderRadius: [0, 4, 4, 0] },
                            xAxisIndex: 1,
                            barWidth: '35%',
                            label: {
                                show: true,
                                position: 'right',
                                // @ts-ignore
                                formatter: (p) => p.value.toFixed(0),
                                fontSize: 9
                            }
                        }
                    ]
                });
            }
            
            console.log('🎉 Gráfico con escala logarítmica renderizado correctamente');
            
        } catch (err) {
            console.error('❌ Error:', err);
            // @ts-ignore
            error = err.message;
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadData();
    });
</script>

<div class="container">
    <h1>🦇 Series de Batman vs 🌍 Consumo de HCFC</h1>
    <p class="subtitle">Datos de <strong>API propia</strong> (consumo de HCFC por país) y <strong>TVmaze API</strong> (repositorios de series de Batman por año).</p>


    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Ozone Depleting Substance Consumptions — <code>/api/v1/ozone-depleting-substance-consumptions</code></p>
        <p><strong>API 2 (externa):</strong> TVmaze — <code>https://api.tvmaze.com/search/shows?q=batman</code></p>
        <p><strong>Integración:</strong> Comparativa por año del consumo de HCFC (escala logarítmica) vs el weight acumulado de los primeros 10 resultados de series de Batman.</p>
    </div>

    <div class="chart-card" style="position: relative;">
        <div bind:this={chartContainer} id="batman-chart" style="width:100%; height:600px;"></div>
        {#if loading}
            <div class="loading-overlay">
                <div class="spinner"></div>
                <p>Cargando datos de HCFC y Batman...</p>
            </div>
        {/if}
    </div>

    {#if error}
        <div class="error-box">❌ Error: {error}</div>
    {/if}

    <div class="info">
        <h3>Sobre esta integración</h3>
        <ul>
            <li><strong>Biblioteca:</strong> ECharts | <strong>Tipo:</strong> Horizontal Bar</li>
            <li><strong>Eje Y:</strong> Año </li>
            <li><strong>🔵 Azul:</strong> Consumo HCFC</li>
            <li><strong>🟠 Naranja:</strong> Weight acumulado de las series de Batman</li>
            <li><strong>Tooltip:</strong> Muestra el valor original de HCFC y el valor logarítmico</li>
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