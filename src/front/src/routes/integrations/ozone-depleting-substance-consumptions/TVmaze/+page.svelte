<script>
    import { onMount } from 'svelte';
    import * as echarts from 'echarts';

    let loading = $state(true);
    let error = $state(null);
    let chartContainer = $state(null);
    let chart = null;
    let tableData = $state([]);
    let franquiciaSummary = $state([]);
    let heatData = $state([]);
    let years = $state([]);
    let showsByFranquicia = $state(new Map());

    const sustanciaToFranquicia = {
        'hcfc': 'Batman',
        'methyl_bromide': 'Superman',
        'carbon_tetrachloride': 'Spiderman',
        'halon': 'Ironman',
        'cfc': 'Thor',
        'methyl_chloroform': 'Hulk'
    };

    const franquicias = Object.values(sustanciaToFranquicia);
    const franquiciaToSearchTerm = {
        'Batman': 'batman',
        'Superman': 'superman',
        'Spiderman': 'spiderman',
        'Ironman': 'ironman',
        'Thor': 'thor',
        'Hulk': 'hulk'
    };

    // Transformación logarítmica para escalar los datos
    function transformLog(value) {
        return Math.log10(value + 1);
    }

    async function fetchHCFCData() {
        console.log('📡 Obteniendo datos de HCFC...');
        const res = await fetch('https://sos2526-22.onrender.com/api/v1/ozone-depleting-substance-consumptions/loadInitialData');
        if (!res.ok) throw new Error(`HCFC API error: ${res.status}`);
        const data = await res.json();
        
        const bySubstanceAndYear = new Map();
        const allYearsSet = new Set();
        
        data.forEach(item => {
            if (item.country === 'world' || item.country === 'asia') return;
            
            const year = item.year;
            allYearsSet.add(year);
            
            const substances = {
                'hcfc': Math.abs(item.hcfc || 0),
                'methyl_bromide': Math.abs(item.methyl_bromide || 0),
                'carbon_tetrachloride': Math.abs(item.carbon_tetrachloride || 0),
                'halon': Math.abs(item.halon || 0),
                'cfc': Math.abs(item.cfc || 0),
                'methyl_chloroform': Math.abs(item.methyl_chloroform || 0)
            };
            
            for (const [substance, value] of Object.entries(substances)) {
                if (value > 0) {
                    const key = `${substance}|${year}`;
                    bySubstanceAndYear.set(key, (bySubstanceAndYear.get(key) || 0) + value);
                }
            }
        });
        
        const allYears = Array.from(allYearsSet).sort((a, b) => a - b);
        console.log(`✅ Años disponibles: ${allYears.length} años`, allYears);
        
        return { bySubstanceAndYear, allYears };
    }

    async function fetchShowsByFranquicia(franquicia, searchTerm) {
        console.log(`🔍 Buscando ${franquicia} (${searchTerm})...`);
        const url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(searchTerm)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`TVmaze error: ${res.status}`);
        const data = await res.json();
        
        const uniqueShows = new Set();
        data.forEach(item => {
            if (item.show && item.show.id) {
                uniqueShows.add(item.show.id);
            }
        });
        
        console.log(`   ${franquicia}: ${uniqueShows.size} shows encontrados`);
        return uniqueShows.size;
    }

    async function loadData() {
        try {
            loading = true;
            error = null;

            const { bySubstanceAndYear, allYears } = await fetchHCFCData();
            
            const showsTemp = new Map();
            for (const [franquicia, searchTerm] of Object.entries(franquiciaToSearchTerm)) {
                const count = await fetchShowsByFranquicia(franquicia, searchTerm);
                showsTemp.set(franquicia, count);
            }
            showsByFranquicia = showsTemp;
            
            const yearsArray = allYears;
            years = yearsArray;
            console.log(`📅 Años a mostrar: ${years.length} años`, years);
            
            if (years.length === 0) {
                throw new Error('No se encontraron datos de HCFC');
            }
            
            // Preparar datos para heatmap con ESCALA LOGARÍTMICA
            const heatDataTemp = [];
            const tableItems = [];
            
            for (let i = 0; i < franquicias.length; i++) {
                const franquicia = franquicias[i];
                const sustancia = Object.keys(sustanciaToFranquicia).find(
                    key => sustanciaToFranquicia[key] === franquicia
                );
                const showsCount = showsTemp.get(franquicia) || 0;
                
                for (let j = 0; j < years.length; j++) {
                    const year = years[j];
                    const key = `${sustancia}|${year}`;
                    const consumoRaw = bySubstanceAndYear.get(key) || 0;
                    // Aplicamos transformación logarítmica para escalar
                    const consumoLog = transformLog(consumoRaw);
                    
                    heatDataTemp.push([i, j, consumoLog, consumoRaw]); // guardamos también el raw para tooltip y label
                    
                    tableItems.push({
                        franquicia,
                        sustancia,
                        year,
                        consumo: consumoRaw,
                        shows: showsCount
                    });
                }
            }
            
            // Usamos los valores logarítmicos para el color, pero guardamos los raw
            heatData = heatDataTemp.map(([i, j, logVal, rawVal]) => [i, j, logVal, rawVal]);
            console.log(`📊 Heatmap data points: ${heatData.length} (log transform applied)`);
            
            // Calcular resumen para la tabla (usando valores raw)
            const summary = [];
            for (const [sustancia, franquicia] of Object.entries(sustanciaToFranquicia)) {
                const items = tableItems.filter(t => t.franquicia === franquicia);
                const totalConsumo = items.reduce((sum, t) => sum + t.consumo, 0);
                const shows = items[0]?.shows || 0;
                summary.push({ sustancia, franquicia, totalConsumo, shows });
            }
            franquiciaSummary = summary;
            tableData = tableItems;
            
        } catch (err) {
            console.error('❌ Error:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    function drawChart() {
        if (!chartContainer) {
            console.log('⏳ Esperando contenedor...');
            return;
        }
        
        if (heatData.length === 0 || years.length === 0) {
            console.log('⏳ Sin datos aún...');
            return;
        }
        
        console.log('🎨 Dibujando heatmap con escala logarítmica...');
        
        if (chart) chart.dispose();
        chart = echarts.init(chartContainer);
        
        // El máximo ahora es el valor logarítmico máximo
        const maxLogVal = Math.max(...heatData.map(d => d[2]), 0.1);
        console.log(`🎨 Escala log: max = ${maxLogVal}`);
        
        chart.setOption({
            xAxis: {
                type: 'category',
                data: franquicias,
                name: 'Franquicia / Sustancia',
                axisLabel: { rotate: 45, interval: 0, fontSize: 11 }
            },
            yAxis: {
                type: 'category',
                data: years,
                name: 'Año',
                axisLabel: { fontSize: 11 }
            },
            visualMap: {
                min: 0,
                max: maxLogVal,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: 10,
                inRange: {
                    color: ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494', '#c03b2b']
                },
                outOfRange: { color: '#f0f0f0' },
                text: ['Alto consumo (log)', 'Bajo consumo (log)'],
                textStyle: { color: '#333' }
            },
            series: [{
                name: 'Consumo (toneladas)',
                type: 'heatmap',
                data: heatData.map(d => [d[0], d[1], d[2]]), // pasamos solo i,j,logVal para el color
                label: {
                    show: true,
                    formatter: (params) => {
                        // Buscar el valor raw correspondiente
                        const rawValue = heatData.find(d => d[0] === params.data[0] && d[1] === params.data[1])?.[3] || 0;
                        if (rawValue === 0) return '—';
                        if (rawValue > 1000000) return `${(rawValue / 1000000).toFixed(1)}M`;
                        if (rawValue > 1000) return `${(rawValue / 1000).toFixed(0)}k`;
                        return rawValue.toString();
                    },
                    fontSize: 9,
                    color: '#333'
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0,0,0,0.5)'
                    }
                },
                itemStyle: {
                    borderColor: '#fff',
                    borderWidth: 1
                }
            }],
            backgroundColor: '#ffffff',
            grid: {
                containLabel: true,
                top: 60,
                bottom: 60,
                left: 80,
                right: 20
            }
        });
        
        console.log('🎉 Heatmap renderizado correctamente con escala logarítmica');
        setTimeout(() => chart?.resize(), 100);
    }

    $effect(() => {
        if (chartContainer && heatData.length > 0 && years.length > 0) {
            console.log('✅ Contenedor y datos listos, dibujando...');
            drawChart();
        }
    });

    onMount(() => {
        loadData();
    });
</script>

<div class="container">
    <h1>🎬 Franquicias cinematográficas vs Consumo de Sustancias de Ozono</h1>
    <p class="subtitle">Datos de <strong>API propia</strong> (consumo de sustancias por año) y <strong>TVMaze API</strong> (número de shows por franquicia)</p>

    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Ozone Depleting Substance Consumptions — <code>/api/v1/ozone-depleting-substance-consumptions</code></p>
        <p><strong>API 2 (externa):</strong> TVMaze Search API — <code>https://api.tvmaze.com/search/shows?q=batman</code></p>
        <p><strong>Integración:</strong> A cada sustancia de la API de ozono se le asocia una franquicia cinematográfica. El heatmap muestra el consumo de cada sustancia por año. El número de shows encontrados en TVMaze para cada franquicia aparece en la tabla.</p>
    </div>
    
    {#if loading}
        <div class="status">📡 Cargando datos de HCFC y buscando series en TVmaze...</div>
    {:else if error}
        <div class="status error">❌ Error: {error}</div>
    {:else}
        <div bind:this={chartContainer} class="heatmap-chart"></div>
        
        <table class="data-table">
            <thead>
                <tr>
                    <th>Sustancia</th>
                    <th>Franquicia</th>
                    <th>Shows encontrados</th>
                    <th>Consumo total (toneladas)</th>
                </tr>
            </thead>
            <tbody>
                {#each franquiciaSummary as item}
                    <tr>
                        <td><strong>{item.sustancia.replace('_', ' ').toUpperCase()}</strong></td>
                        <td>{item.franquicia}</td>
                        <td>{item.shows}</td>
                        <td>{item.totalConsumo.toLocaleString()}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
        <p class="note">* Datos de HCFC de la API propia (excluyendo world/asia). Series de TVmaze (búsqueda directa por nombre de franquicia). La escala de colores usa log10(consumo+1) para equilibrar visualmente.</p>
    {/if}
</div>

<style>
    .container {
        max-width: 1100px;
        margin: 2rem auto;
        padding: 1.5rem;
        background: #ffffff;
        border-radius: 24px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        font-family: system-ui, sans-serif;
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
   
    .status {
        background: #f5f5f5;
        padding: 2rem;
        text-align: center;
        border-radius: 16px;
        font-size: 1.1rem;
    }
    .status.error {
        background: #ffe6e6;
        color: #c00;
    }
    .heatmap-chart {
        width: 100%;
        height: 550px;
        margin-bottom: 1.5rem;
        background: #fafafa;
        border-radius: 8px;
    }
    .data-table {
        width: 100%;
        border-collapse: collapse;
        background: #fefefe;
        border-radius: 16px;
        overflow: hidden;
        font-size: 0.85rem;
    }
    .data-table th, .data-table td {
        padding: 10px;
        text-align: center;
        border-bottom: 1px solid #eaeaea;
    }
    .data-table th {
        background-color: #f8f9fa;
        font-weight: 600;
    }
    .note {
        font-size: 0.7rem;
        color: #888;
        text-align: center;
        margin-top: 1rem;
    }
</style>