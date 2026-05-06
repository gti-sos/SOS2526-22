<script>
    // @ts-nocheck
    import { onMount, tick } from 'svelte';

    let loading = true;
    let error = null;

    onMount(async () => {
        await fetchData();
    });

    async function fetchData() {
        try {
            loading = true;

            console.log('Cargando datos de ozono...');
            const resOzone = await fetch('/api/v1/ozone-depleting-substance-consumptions');
            if (!resOzone.ok) throw new Error(`HTTP ${resOzone.status} - Ozono`);
            const ozone = await resOzone.json();

            const hcfcByCountry = {};
            ozone.forEach(item => {
                const c = item.country;
                if (c === 'world' || c === 'asia') return;
                hcfcByCountry[c] = (hcfcByCountry[c] || 0) + Math.abs(item.hcfc || 0);
            });

            console.log('Cargando datos de salarios...');
            const resWages = await fetch('https://sos2526-24.onrender.com/api/v1/average-monthly-wages/');
            if (!resWages.ok) throw new Error(`HTTP ${resWages.status} - Wages`);
            const wages = await resWages.json();
            const wagesArray = Array.isArray(wages) ? wages : (wages.data || []);

            const wagesByCountry = {};
            wagesArray.forEach(item => {
                const c = item.country;
                if (!wagesByCountry[c] || wagesByCountry[c].year < item.year) {
                    wagesByCountry[c] = { ...item };
                }
            });

            const combined = Object.entries(wagesByCountry).map(([country, wage]) => {
                const normalizedCountry = country === 'usa' ? 'united-states' : country;
                const hcfc = hcfcByCountry[normalizedCountry] || 0;
                return {
                    country,
                    label: country.charAt(0).toUpperCase() + country.slice(1),
                    year: wage.year,
                    avg_monthly_usd: wage.avg_monthly_usd,
                    currency: wage.currency,
                    hcfc,
                    hasOzone: hcfc > 0
                };
            }).filter(d => d.avg_monthly_usd > 0);

            console.log('Datos combinados:', combined);

            loading = false;
            await tick();
            await new Promise(r => setTimeout(r, 150));
            renderTreemap(combined);

        } catch (e) {
            console.error('Error:', e);
            error = e.message;
            loading = false;
        }
    }




    async function renderTreemap(data) {
        console.log('Iniciando renderTreemap...');
        const d3 = await import('d3');
        console.log('D3 importado');


        const container = document.getElementById('treemap-container');
        console.log('Contenedor:', container);
        console.log('Ancho:', container?.clientWidth);


        if (!container) {
            console.error('Contenedor no encontrado');
            return;
        }

        const width = 900;
        const height = 520;

        container.innerHTML = '';


        const svg = d3.select('#treemap-container')
            .append('svg')
            .attr('width', '100%')
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // Tooltip creado ANTES de los event handlers
        const tooltip = d3.select('body').append('div')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background', 'white')
            .style('border', '1px solid #ddd')
            .style('border-radius', '8px')
            .style('padding', '10px 14px')
            .style('font-family', 'Segoe UI, sans-serif')
            .style('font-size', '13px')
            .style('pointer-events', 'none')
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.1)')
            .style('z-index', '9999');

        const root = d3.hierarchy({ children: data })
            .sum(d => d.avg_monthly_usd)
            .sort((a, b) => b.value - a.value);

        d3.treemap()
            .size([width, height])
            .padding(3)
            .round(true)(root);

        const maxHcfc = Math.max(...data.map(d => d.hcfc));
        const colorScale = d3.scaleSequential()
            .domain([0, maxHcfc > 0 ? maxHcfc : 1])
            .interpolator(d3.interpolateBlues);

        const cell = svg.selectAll('g')
            .data(root.leaves())
            .join('g')
            .attr('transform', d => `translate(${d.x0},${d.y0})`);

        cell.append('rect')
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .attr('fill', d => d.data.hcfc > 0 ? colorScale(d.data.hcfc) : '#e0e0e0')
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this).attr('opacity', 0.8);
                tooltip
                    .style('opacity', 1)
                    .html(`
                        <b>${d.data.label}</b> (${d.data.year})<br>
                        💰 Salario medio: <b>$${d.data.avg_monthly_usd.toLocaleString()} USD/mes</b><br>
                        💱 Moneda: ${d.data.currency}<br>
                        🌿 HCFC: <b>${d.data.hcfc > 0 ? d.data.hcfc.toLocaleString() + ' ton' : 'Sin dato'}</b>
                    `)
                    .style('left', (event.pageX + 12) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mousemove', function(event) {
                tooltip
                    .style('left', (event.pageX + 12) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 1);
                tooltip.style('opacity', 0);
            });

        cell.append('text')
            .attr('x', d => (d.x1 - d.x0) / 2)
            .attr('y', d => (d.y1 - d.y0) / 2 - 8)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', d => d.data.hcfc > 500000 ? 'white' : '#333')
            .attr('font-size', d => Math.min((d.x1 - d.x0) / 7, 14) + 'px')
            .attr('font-weight', 'bold')
            .attr('font-family', 'Segoe UI, sans-serif')
            .text(d => d.x1 - d.x0 > 60 ? d.data.label : '')
            .style('pointer-events', 'none');

        cell.append('text')
            .attr('x', d => (d.x1 - d.x0) / 2)
            .attr('y', d => (d.y1 - d.y0) / 2 + 10)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', d => d.data.hcfc > 500000 ? 'white' : '#555')
            .attr('font-size', d => Math.min((d.x1 - d.x0) / 9, 11) + 'px')
            .attr('font-family', 'Segoe UI, sans-serif')
            .text(d => d.x1 - d.x0 > 80 ? `$${d.data.avg_monthly_usd.toLocaleString()}` : '')
            .style('pointer-events', 'none');

        console.log('Treemap D3 renderizado correctamente');
    }
</script>

<svelte:head>
    <title>Integración 5 - Salarios & Ozono</title>
</svelte:head>

<div class="container">
    <h1>💰 Salario Mensual Medio vs Consumo de HCFC</h1>
    <p class="subtitle">Datos de <strong>API propia</strong> (consumo de HCFC por país) y <strong>SOS2526-24</strong> (salario mensual medio por país)</p>

    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Ozone Depleting Substance Consumptions — <code>/api/v1/ozone-depleting-substance-consumptions</code></p>
        <p><strong>API 2 (compañero SOS grupo 24):</strong> Average Monthly Wages — <code>https://sos2526-24.onrender.com/api/v1/average-monthly-wages/</code></p>
        <p><strong>Integración:</strong> El tamaño de cada rectángulo representa el salario mensual medio en USD. El color azul indica el consumo de HCFC — más oscuro significa mayor consumo. Los países sin dato de HCFC aparecen en gris.</p>
    </div>

    {#if loading}
        <div class="loading-box">
            <div class="spinner"></div>
            <p>Cargando datos de ambas APIs...</p>
        </div>
    {:else if error}
        <div class="error-box">❌ Error: {error}</div>
    {/if}

    <!-- Contenedor siempre en el DOM -->
    <div style="display: {loading || error ? 'none' : 'block'}">
        <div class="legend">
            <div class="legend-item">
                <div class="legend-gradient"></div>
                <span>Menor HCFC</span>
                <span style="margin-left:1rem">Mayor HCFC</span>
            </div>
            <div class="legend-item" style="margin-top:0.3rem">
                <span class="legend-box" style="background:#e0e0e0"></span>
                <span>Sin dato de HCFC</span>
            </div>
        </div>

        <div class="chart-card">
            <div id="treemap-container" style="width:100%; height:520px;"></div>
        </div>

        <div class="info">
            <h3>📖 Sobre esta integración</h3>
            <ul>
                <li><strong>Biblioteca:</strong> D3.js | <strong>Tipo:</strong> Treemap</li>
                <li><strong>Tamaño del rectángulo:</strong> Salario mensual medio en USD — API SOS2526-24</li>
                <li><strong>Color (azul):</strong> Consumo total de HCFC (toneladas) — API propia. Más oscuro = más consumo</li>
                <li><strong>Gris:</strong> Países sin dato de HCFC en la API propia</li>
                <li><strong>Tooltip:</strong> Al pasar el ratón muestra país, año, salario, moneda y HCFC</li>
            </ul>
        </div>
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

    .error-box {
        background: #fee2e2;
        color: #dc2626;
        padding: 16px;
        border-radius: 8px;
        text-align: center;
    }

    .legend {
        margin-bottom: 1rem;
        font-size: 0.82rem;
        color: #555;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .legend-gradient {
        width: 120px;
        height: 14px;
        border-radius: 4px;
        background: linear-gradient(to right, #deebf7, #08519c);
        border: 1px solid #ddd;
    }

    .legend-box {
        width: 16px;
        height: 16px;
        border-radius: 3px;
        display: inline-block;
        border: 1px solid #ccc;
    }

    .chart-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.07);
        margin-bottom: 2rem;
        border: 1px solid #f0f0f0;
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