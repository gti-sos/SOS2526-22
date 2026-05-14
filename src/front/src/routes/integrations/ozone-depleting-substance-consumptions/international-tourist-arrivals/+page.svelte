<script>
    import { onMount, tick } from 'svelte';
    // @ts-ignore
    import * as d3 from 'd3';

    const GRAPH_TYPE = 'area';

    let loading = $state(true);
    let error = $state(null);
    let container = $state(null);
    // @ts-ignore
    let tableData = $state([]);

    // @ts-ignore
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    async function fetchTouristData() {
        console.log(' fetchTouristData: iniciando');
        const dataUrl = 'https://sos2526-25.onrender.com/api/v2/international-tourist-arrivals';
        let res = await fetch(dataUrl);
        let data = null;
        if (res.ok) {
            data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                console.log(` Turismo: ${data.length} registros obtenidos directamente`);
                return data;
            } else if (data && data.data && data.data.length > 0) {
                console.log(`Turismo: ${data.data.length} registros (envoltura.data)`);
                return data.data;
            }
        }
        console.log('No se encontraron datos de turismo en el primer intento. Inicializando...');
        const initUrl = dataUrl + '/loadInitialData';
        let initRes = await fetch(initUrl, { method: 'POST' });
        console.log(`   POST /loadInitialData → ${initRes.status}`);
        if (!initRes.ok && initRes.status !== 409) {
            initRes = await fetch(initUrl, { method: 'GET' });
            console.log(`   GET /loadInitialData → ${initRes.status}`);
        }
        if (!initRes.ok && initRes.status !== 409) {
            throw new Error(`Error inicialización: ${initRes.status}`);
        }
        await wait(1000);
        res = await fetch(dataUrl);
        if (!res.ok) throw new Error(`Error tras inicialización: ${res.status}`);
        data = await res.json();
        const finalData = Array.isArray(data) ? data : (data.data || []);
        if (!finalData.length) throw new Error('No hay datos de turismo después de inicializar');
        console.log(` Turismo: ${finalData.length} registros obtenidos tras inicialización`);
        return finalData;
    }

    async function fetchData() {
        console.log(' fetchData: inicio');
        try {
            loading = true;
            error = null;

            console.log(' Solicitando HCFC...');
            const resOzone = await fetch('/api/v1/ozone-depleting-substance-consumptions/loadInitialData');
            if (!resOzone.ok) throw new Error(`HTTP ${resOzone.status} - Ozono`);
            const ozone = await resOzone.json();
            const hcfcByYear = {};
            // @ts-ignore
            ozone.forEach(item => {
                if (item.country === 'world' || item.country === 'asia') return;
                const year = item.year;
                const value = Math.abs(item.hcfc || 0);
                // @ts-ignore
                hcfcByYear[year] = (hcfcByYear[year] || 0) + value;
            });
            console.log(`   HCFC: ${Object.keys(hcfcByYear).length} años con datos`, hcfcByYear);

            console.log('Solicitando turismo...');
            const touristArray = await fetchTouristData();
            const touristByYear = {};
            // @ts-ignore
            touristArray.forEach(item => {
                const year = item.year;
                const total = (item.air_arrival || 0) + (item.water_arrival || 0) + (item.land_arrival || 0);
                // @ts-ignore
                touristByYear[year] = (touristByYear[year] || 0) + total;
            });
            console.log(`   Turismo: ${Object.keys(touristByYear).length} años con datos`, touristByYear);

            // Unión de años
            const allYearsSet = new Set([...Object.keys(hcfcByYear), ...Object.keys(touristByYear)]);
            const allYears = Array.from(allYearsSet).map(Number).sort((a,b) => a-b);
            console.log(`Años combinados: ${allYears.length}`, allYears);
            
            // Transformación logarítmica
            const dataForAreas = allYears.map(year => {
                // @ts-ignore
                const hcfc = hcfcByYear[year] || 0;
                // @ts-ignore
                const tourist = touristByYear[year] || 0;
                const logHcfc = Math.log10(hcfc + 1);
                const logTourist = Math.log10(tourist + 1);
                return { year, hcfc: logHcfc, tourist: logTourist, rawHcfc: hcfc, rawTourist: tourist };
            });
            console.log(`Datos transformados (log):`, dataForAreas.slice(0,3));

            // Tabla
            tableData = dataForAreas.map(d => ({
                year: d.year,
                hcfc: d.rawHcfc,
                tourists: d.rawTourist,
                hasHcfc: d.rawHcfc > 0,
                hasTourist: d.rawTourist > 0
            }));
            console.log(`📋 Tabla generada con ${tableData.length} filas`);

            if (!container) throw new Error('Contenedor no disponible');
            console.log(' Llamando a renderStackedArea');
            await renderStackedArea(dataForAreas);
            console.log('fetchData completado exitosamente');
            loading = false;
        } catch (err) {
            console.error(' fetchData error:', err);
            // @ts-ignore
            error = err.message;
            loading = false;
        }
    }

    // @ts-ignore
    async function renderStackedArea(data) {
        console.log('renderStackedArea: inicio');
        // @ts-ignore
        const width = container.clientWidth || 900;
        const height = 500;
        const margin = { top: 40, right: 30, bottom: 50, left: 70 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        console.log(`   Dimensiones: ancho=${width}, alto=${height}, área interior=${innerWidth}x${innerHeight}`);

        const existingSvg = d3.select(container).select('svg');
        if (!existingSvg.empty()) existingSvg.remove();
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('data-graph-type', GRAPH_TYPE)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Escalas
        const xScale = d3.scaleLinear()
            // @ts-ignore
            .domain(d3.extent(data, d => d.year))
            .range([0, innerWidth])
            .nice();
        // @ts-ignore
        const yMax = d3.max(data, d => Math.max(d.hcfc, d.tourist));
        const yScale = d3.scaleLinear()
            .domain([0, yMax * 1.05])
            .range([innerHeight, 0]);
        console.log(`   Escalas: x = [${xScale.domain()}], y = [0, ${yMax}]`);

        // Generador de área
        // @ts-ignore
        const areaGenerator = (key) => d3.area()
            // @ts-ignore
            .x(d => xScale(d.year))
            .y0(innerHeight)
            // @ts-ignore
            .y1(d => yScale(d[key]))
            .curve(d3.curveMonotoneX);

        const colors = { hcfc: '#2085d8', tourist: '#f59e0b' };

        // Área HCFC
        svg.append('path')
            .datum(data)
            .attr('fill', colors.hcfc)
            .attr('fill-opacity', 0.6)
            .attr('stroke', colors.hcfc)
            .attr('stroke-width', 1)
            .attr('d', areaGenerator('hcfc'));
        console.log('   Área HCFC dibujada');

        // Área Turismo
        svg.append('path')
            .datum(data)
            .attr('fill', colors.tourist)
            .attr('fill-opacity', 0.6)
            .attr('stroke', colors.tourist)
            .attr('stroke-width', 1)
            .attr('d', areaGenerator('tourist'));
        console.log('   Área Turismo dibujada');

        // Ejes
        const xAxis = d3.axisBottom(xScale).tickFormat(d3.format('d'));
        // @ts-ignore
        const yAxis = d3.axisLeft(yScale).tickFormat(d => d.toFixed(1));
        svg.append('g').attr('transform', `translate(0, ${innerHeight})`).call(xAxis)
            .append('text').attr('x', innerWidth / 2).attr('y', 35).attr('fill', '#333').attr('text-anchor', 'middle').text('Año');
        svg.append('g').call(yAxis)
            .append('text').attr('transform', 'rotate(-90)').attr('x', -innerHeight / 2).attr('y', -45).attr('fill', '#333').attr('text-anchor', 'middle').text(' ');
        console.log('   Ejes añadidos');

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background', 'white')
            .style('border', '1px solid #ddd')
            .style('border-radius', '6px')
            .style('padding', '8px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('box-shadow', '0 2px 6px rgba(0,0,0,0.1)');

        // Círculos interactivos HCFC
        svg.selectAll('.dot-hcfc')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.year))
            .attr('cy', d => yScale(d.hcfc))
            .attr('r', 5)
            .attr('fill', colors.hcfc)
            .attr('stroke', 'white')
            .attr('stroke-width', 1.5)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                tooltip.transition().duration(200).style('opacity', 0.9);
                tooltip.html(`<strong>${d.year}</strong><br/>HCFC: ${d.rawHcfc.toLocaleString()} ton`)
                    .style('left', (event.pageX + 12) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => tooltip.transition().duration(500).style('opacity', 0));
        console.log('   Círculos HCFC añadidos');

        // Círculos Turismo
        svg.selectAll('.dot-tourist')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.year))
            .attr('cy', d => yScale(d.tourist))
            .attr('r', 5)
            .attr('fill', colors.tourist)
            .attr('stroke', 'white')
            .attr('stroke-width', 1.5)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                tooltip.transition().duration(200).style('opacity', 0.9);
                tooltip.html(`<strong>${d.year}</strong><br/>Turistas: ${d.rawTourist.toLocaleString()}`)
                    .style('left', (event.pageX + 12) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => tooltip.transition().duration(500).style('opacity', 0));
        console.log('   Círculos Turismo añadidos');

        // Leyenda
        const legend = svg.append('g').attr('transform', `translate(${innerWidth - 120}, 10)`);
        legend.append('rect').attr('width', 12).attr('height', 12).attr('fill', colors.hcfc).attr('opacity', 0.6);
        legend.append('text').attr('x', 18).attr('y', 10).text('HCFC').style('font-size', '12px');
        legend.append('rect').attr('width', 12).attr('height', 12).attr('y', 20).attr('fill', colors.tourist).attr('opacity', 0.6);
        legend.append('text').attr('x', 18).attr('y', 30).text('Turismo').style('font-size', '12px');
        console.log('   Leyenda añadida');

        console.log('🏁 renderStackedArea finalizado correctamente');
    }

    onMount(async () => {
        console.log(' Componente montado, esperando contenedor');
        await tick();
        await wait(50);
        console.log(`   container = ${container ? 'disponible' : 'null'}`);
        if (container) {
            fetchData();
        } else {
            console.error(' Contenedor no encontrado');
        }
    });
</script>

<svelte:head>
    <title>Integración - HCFC vs Turismo (Área)</title>
</svelte:head>

<div class="container">
        <h1>📈 Evolución mundial: Consumo de HCFC vs Llegadas turísticas</h1>
        <p class="subtitle">Datos de <strong>API propia</strong> (consumo de HCFC por año) y <strong>SOS2526-25</strong> (llegadas turísticas internacionales por año)</p>

    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Ozone Depleting Substance Consumptions — <code>/api/v1/ozone-depleting-substance-consumptions</code></p>
        <p><strong>API 2 (compañero SOS grupo 25):</strong> International Tourist Arrivals — <code>https://sos2526-25.onrender.com/api/v2/international-tourist-arrivals</code></p>
        <p><strong>Integración:</strong> Para cada año disponible se suma el HCFC total y las llegadas turísticas totales por vía aérea, marítima y terrestre. Ambas series se normalizan con log10(x+1) para poder compararlas en el mismo eje Y.</p>

    </div>

    <div class="chart-card" style="position: relative;">
        <div bind:this={container} style="width:100%; height:500px;"></div>
        {#if loading}
            <div class="loading-overlay">
                <div class="spinner"></div>
                <p>Cargando datos e inicializando APIs...</p>
            </div>
        {/if}
    </div>

    {#if !loading && !error}
        <div class="table-container">
            <h3>Datos por año (mundial)</h3>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr><th>Año</th><th>HCFC total (ton)</th><th>Llegadas turísticas totales</th></tr>
                    </thead>
                    <tbody>
                        {#each tableData as d (d.year)}
                            <tr>
                                <td>{d.year}</td>
                                <td class={!d.hasHcfc ? 'missing' : ''}>{d.hasHcfc ? d.hcfc.toLocaleString() : 'Sin dato'}</td>
                                <td class={!d.hasTourist ? 'missing' : ''}>{d.hasTourist ? d.tourists.toLocaleString() : 'Sin dato'}</td>
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
            <li><strong>Biblioteca:</strong> D3.js | <strong>Tipo:</strong> <code>area</code></li>
            <li><strong>Eje X:</strong> Años</li>
            <li><strong>Eje Y:</strong> log10(Valor + 1) para comparar magnitudes</li>
            <li><strong>Tooltip:</strong> Al pasar el ratón sobre un punto muestra el año, el HCFC real en toneladas y las llegadas turísticas reales (sin transformación logarítmica)</li>
        </ul>
    </div>
</div>

<style>
    :root {
        --primary: #2085d8;
        --accent: #00897b;
        --text: #333;
        --bg-light: #f8fafc;
        --border: #e2e8f0;
    }
    .container {
        max-width: 1300px;
        margin: 0 auto;
        padding: 2rem;
        font-family: 'Segoe UI', sans-serif;
        color: var(--text);
    }
    
    h1 { color: #2085d8; text-align: center; margin-bottom: 0.5rem; font-size: 1.8rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 1rem; }


    .info-api {
        background: #f0f9ff;
        padding: 1rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        border-left: 4px solid var(--primary);
    }
    .info-api p {
        margin: 0.5rem 0;
    }
    .info-api code {
        background: #e2e8f0;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
    }
    .chart-card {
        background: white;
        border-radius: 16px;
        padding: 1rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        position: relative;
        min-height: 560px;
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
        border-radius: 16px;
        z-index: 10;
    }
    .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e0e0e0;
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-bottom: 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-box {
        background: #fee2e2;
        color: #dc2626;
        padding: 1rem;
        border-radius: 12px;
        margin: 1rem 0;
    }
    .table-container {
        margin: 2rem 0;
    }
    .table-wrapper {
        overflow-x: auto;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: white;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }
    th, td {
        padding: 0.75rem 1rem;
        text-align: center;
        border-bottom: 1px solid var(--border);
    }
    th {
        background: #2d3748;
        color: white;
        font-weight: 500;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
    }
    tr:hover {
        background: var(--bg-light);
    }
    .missing {
        color: #a0aec0;
        font-style: italic;
    }
    .info {
        background: #f0f9ff;
        padding: 1rem 1.5rem;
        border-radius: 16px;
        margin-top: 1.5rem;
    }
    .info h3 {
        color: var(--primary);
        margin-top: 0;
    }
</style>