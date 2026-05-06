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

    async function fetchHCFCData() {
        console.log('📡 Obteniendo datos de HCFC...');
        const res = await fetch('https://sos2526-22.onrender.com/api/v1/ozone-depleting-substance-consumptions');
        if (!res.ok) throw new Error(`HCFC API error: ${res.status}`);
        const data = await res.json();
        
        const bySubstanceAndYear = new Map();
        const allYearsSet = new Set();
        
        data.forEach(item => {
            // Excluir world y asia
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
        console.log(`✅ Sustancias por año: ${bySubstanceAndYear.size} entradas`);
        
        // Debug por sustancia
        for (const substance of Object.keys(sustanciaToFranquicia)) {
            const yearsWithData = [];
            for (const year of allYears) {
                const key = `${substance}|${year}`;
                if (bySubstanceAndYear.get(key) > 0) {
                    yearsWithData.push(year);
                }
            }
            if (yearsWithData.length > 0) {
                console.log(`   📍 ${substance}: años ${yearsWithData.join(', ')}`);
            }
        }
        
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

            // Obtener datos de HCFC
            const { bySubstanceAndYear, allYears } = await fetchHCFCData();
            
            // Obtener shows de TVmaze
            const showsTemp = new Map();
            for (const [franquicia, searchTerm] of Object.entries(franquiciaToSearchTerm)) {
                const count = await fetchShowsByFranquicia(franquicia, searchTerm);
                showsTemp.set(franquicia, count);
            }
            showsByFranquicia = showsTemp;
            
            // Usar los años reales de tu API
            const yearsArray = allYears;
            years = yearsArray;
            console.log(`📅 Años a mostrar: ${years.length} años`, years);
            
            if (years.length === 0) {
                throw new Error('No se encontraron datos de HCFC');
            }
            
            // Preparar datos para heatmap
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
                    const consumo = bySubstanceAndYear.get(key) || 0;
                    
                    heatDataTemp.push([i, j, consumo]);
                    
                    tableItems.push({
                        franquicia,
                        sustancia,
                        year,
                        consumo,
                        shows: showsCount
                    });
                }
            }
            
            heatData = heatDataTemp;
            console.log(`📊 Heatmap data points: ${heatData.length} (${franquicias.length} franquicias x ${years.length} años)`);
            console.log(`🔥 Ejemplo de datos:`, heatData.slice(0, 5));
            
            // Calcular resumen para la tabla
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
        
        console.log('🎨 Dibujando heatmap...');
        
        if (chart) chart.dispose();
        chart = echarts.init(chartContainer);
        
        const maxConsumo = Math.max(...heatData.map(d => d[2]), 1000);
        console.log(`🎨 Escala: max consumo = ${maxConsumo}`);
        
        chart.setOption({
            title: {
                text: '🎬 Consumo de sustancias vs Franquicias cinematográficas',
                subtext: 'Heatmap de consumo (toneladas) por sustancia/franquicia y año',
                left: 'center'
            },
            tooltip: {
                trigger: 'item',
                formatter: (params) => {
                    const franquicia = franquicias[params.data[0]];
                    const year = years[params.data[1]];
                    const consumo = params.data[2];
                    const shows = showsByFranquicia.get(franquicia);
                    if (consumo === 0) {
                        return `<strong>${franquicia}</strong><br/>Año: ${year}<br/>Sin datos de consumo<br/>Shows: ${shows}`;
                    }
                    return `<strong>${franquicia}</strong><br/>Año: ${year}<br/>Consumo: ${consumo.toLocaleString()} toneladas<br/>Shows: ${shows}`;
                }
            },
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
                max: maxConsumo,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: 10,
                inRange: {
                    color: ['#f0f0f0', '#ffcccc', '#ff9999', '#ff6666', '#ff3333', '#cc0000']
                },
                outOfRange: { color: '#f0f0f0' },
                text: ['Alto consumo', 'Bajo consumo'],
                textStyle: { color: '#333' }
            },
            series: [{
                name: 'Consumo (toneladas)',
                type: 'heatmap',
                data: heatData,
                label: {
                    show: true,
                    formatter: (params) => {
                        const consumo = params.data[2];
                        if (consumo === 0) return '—';
                        if (consumo > 1000000) return `${(consumo / 1000000).toFixed(1)}M`;
                        if (consumo > 1000) return `${(consumo / 1000).toFixed(0)}k`;
                        return consumo.toString();
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
        
        console.log('🎉 Heatmap renderizado correctamente');
        setTimeout(() => chart?.resize(), 100);
    }

    // $effect para dibujar cuando el contenedor esté listo
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

<div class="heatmap-container">
    <h2>🎬 Franquicias vs 🌍 Consumo de sustancias</h2>
    <p class="desc">Cada sustancia está asociada a una franquicia. El color rojo indica mayor consumo. El número en cada celda es el consumo en toneladas (k = miles, M = millones).</p>
    
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
        <p class="note">* Datos de HCFC de la API propia (excluyendo world/asia). Series de TVmaze (búsqueda directa por nombre de franquicia).</p>
    {/if}
</div>

<style>
    .heatmap-container {
        max-width: 1100px;
        margin: 2rem auto;
        padding: 1.5rem;
        background: #ffffff;
        border-radius: 24px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        font-family: system-ui, sans-serif;
    }
    h2 {
        text-align: center;
        margin-bottom: 0.25rem;
        font-size: 1.3rem;
    }
    .desc {
        text-align: center;
        color: #555;
        font-size: 0.85rem;
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