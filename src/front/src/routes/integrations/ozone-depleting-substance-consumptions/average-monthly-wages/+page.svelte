<script>
    import { onMount } from 'svelte';

    let loading = $state(true);
    let error = $state(null);
    let container = $state(null);
    let chartData = $state(null);
    let rendered = $state(false);

    // Normalización de nombres de países para que coincidan entre APIs
    function normalizeCountry(name) {
        if (!name) return '';
        let n = name.toLowerCase().trim();
        const replacements = {
            'usa': 'united-states',
            'us': 'united-states',
            'united states': 'united-states',
            'uk': 'united-kingdom',
            'united kingdom': 'united-kingdom',
            'uae': 'united-arab-emirates',
            'south korea': 'korea-south',
            'russia': 'russian-federation',
            'tanzania': 'united-republic-of-tanzania'
        };
        if (replacements[n]) return replacements[n];
        return n.replace(/[\s_]+/g, '-');
    }

    async function fetchData() {
        try {
            loading = true;
            error = null;

            // 1. Cargar HCFC (API propia)
            console.log('Cargando datos de ozono...');
            const resOzone = await fetch('/api/v1/ozone-depleting-substance-consumptions');
            if (!resOzone.ok) throw new Error(`HTTP ${resOzone.status} - Ozono`);
            const ozone = await resOzone.json();

            const hcfcByCountry = {};
            ozone.forEach(item => {
                let c = item.country;
                if (c === 'world' || c === 'asia') return;
                c = normalizeCountry(c);
                const value = Math.abs(item.hcfc || 0);
                hcfcByCountry[c] = (hcfcByCountry[c] || 0) + value;
            });
            console.log('HCFC por país:', hcfcByCountry);

            // 2. Cargar salarios (API grupo 24)
            console.log('Cargando datos de salarios...');
            const resWages = await fetch('https://sos2526-24.onrender.com/api/v1/average-monthly-wages/');
            if (!resWages.ok) throw new Error(`HTTP ${resWages.status} - Wages`);
            const wages = await resWages.json();
            const wagesArray = Array.isArray(wages) ? wages : (wages.data || []);

            const wagesByCountry = {};
            wagesArray.forEach(item => {
                let c = item.country;
                if (!c) return;
                c = normalizeCountry(c);
                if (!wagesByCountry[c] || wagesByCountry[c].year < item.year) {
                    wagesByCountry[c] = { ...item, country: c };
                }
            });
            console.log('Salarios por país:', Object.keys(wagesByCountry).length);

            // 3. Unir todos los países (los que aparecen en cualquiera de las dos APIs)
            const allCountries = new Set([...Object.keys(hcfcByCountry), ...Object.keys(wagesByCountry)]);
            console.log('Total países únicos:', allCountries.size);

            const points = [];
            for (const country of allCountries) {
                const hcfc = hcfcByCountry[country] || 0;
                const wageData = wagesByCountry[country];
                const salary = wageData ? wageData.avg_monthly_usd : 0;
                const currency = wageData ? wageData.currency : 'N/A';
                const year = wageData ? wageData.year : 'Sin dato';
                const label = country.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
                points.push({
                    country: label,
                    hcfc,
                    salary,
                    currency,
                    year,
                    hasSalary: salary > 0,
                    hasHcfc: hcfc > 0
                });
            }
            // Ordenamos para que las burbujas grandes no tapen del todo
            points.sort((a,b) => b.hcfc - a.hcfc);
            console.log('Datos finales:', points);
            chartData = points;
            loading = false;
        } catch (err) {
            console.error(err);
            error = err.message;
            loading = false;
        }
    }

    async function renderBubbleChart(data) {
        if (!container) return;
        let width = container.clientWidth;
        if (width === 0) {
            setTimeout(() => renderBubbleChart(data), 100);
            return;
        }
        const height = 520;
        const margin = { top: 40, right: 30, bottom: 60, left: 80 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const d3 = await import('d3');
        container.innerHTML = '';

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Escalas
        const maxSalary = Math.max(...data.map(d => d.salary), 1);
        const maxHcfc = Math.max(...data.map(d => d.hcfc), 1);

        const xScale = d3.scaleLinear()
            .domain([0, maxSalary * 1.05])
            .range([0, innerWidth])
            .nice();

        const yScale = d3.scaleLinear()
            .domain([0, maxHcfc * 1.05])
            .range([innerHeight, 0])
            .nice();

        // Escala para el radio (tamaño de burbuja) -> basado en HCFC, con un mínimo de 5px
        const rScale = d3.scaleSqrt()
            .domain([0, maxHcfc])
            .range([5, 45]);

        // Escala de color: rojo (salario alto) a azul (salario bajo), gris si no hay salario
        const colorScale = d3.scaleSequentialLog()
            .domain([1, maxSalary])
            .interpolator(d3.interpolateRdYlBu);

        // Ejes
        svg.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(8).tickFormat(d => d === 0 ? '0' : `$${d.toLocaleString()}`));

        svg.append('g')
            .call(d3.axisLeft(yScale).ticks(8).tickFormat(d => d.toLocaleString()));

        // Etiquetas de ejes
        svg.append('text')
            .attr('x', innerWidth/2)
            .attr('y', innerHeight + 40)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#555')
            .text('Salario mensual medio (USD) →');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight/2)
            .attr('y', -55)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#555')
            .text('↑ Consumo de HCFC (toneladas)');

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background', 'white')
            .style('border', '1px solid #ccc')
            .style('border-radius', '8px')
            .style('padding', '8px 12px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('box-shadow', '0 2px 6px rgba(0,0,0,0.1)')
            .style('z-index', '1000');

        // Dibujar burbujas
        svg.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.salary))
            .attr('cy', d => yScale(d.hcfc))
            .attr('r', d => d.hcfc > 0 ? rScale(d.hcfc) : 6)
            .attr('fill', d => {
                if (d.hasSalary) return colorScale(d.salary);
                return '#cccccc'; // gris si no tiene salario
            })
            .attr('stroke', 'white')
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.8)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this).attr('opacity', 1).attr('stroke', '#333');
                tooltip.transition().duration(200).style('opacity', 0.95);
                tooltip.html(`
                    <strong>${d.country}</strong><br>
                    💰 Salario: ${d.hasSalary ? `$${d.salary.toLocaleString()} USD/mes` : 'Sin dato'}<br>
                    💱 Moneda: ${d.currency}<br>
                    🌿 HCFC: ${d.hasHcfc ? `${d.hcfc.toLocaleString()} ton` : 'Sin dato'}<br>
                    📅 Año: ${d.year}
                `)
                .style('left', (event.pageX + 12) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mousemove', function(event) {
                tooltip.style('left', (event.pageX + 12) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 0.8).attr('stroke', 'white');
                tooltip.transition().duration(300).style('opacity', 0);
            });

        // Etiquetas de países más relevantes (opcional)
        svg.selectAll('text.label')
            .data(data.filter(d => d.hcfc > 5000 || d.salary > 5000))
            .enter()
            .append('text')
            .attr('x', d => xScale(d.salary) + (d.hcfc > 0 ? rScale(d.hcfc) : 8))
            .attr('y', d => yScale(d.hcfc) - 8)
            .attr('font-size', '9px')
            .attr('fill', '#333')
            .text(d => d.country)
            .attr('pointer-events', 'none');

        rendered = true;
        console.log('Bubble chart renderizado correctamente');
    }

    $effect(() => {
        if (!loading && chartData && container && !rendered) {
            renderBubbleChart(chartData);
        }
    });

    onMount(() => {
        fetchData();
    });
</script>

<svelte:head>
    <title>Integración 5 - Salarios vs HCFC (Bubble Chart)</title>
</svelte:head>

<div class="container">
    <h1>💸 Relación: Salario Mensual vs Consumo de HCFC</h1>
    <p class="subtitle">Cada burbuja es un país. <strong>Eje X = Salario</strong> (USD/mes). <strong>Eje Y = HCFC</strong> (toneladas). Tamaño y color azul/rojo indican las métricas.</p>

    <div class="info-api">
        <p><strong>API propia:</strong> Consumo de HCFC (ton/año) — <code>/api/v1/ozone-depleting-substance-consumptions</code></p>
        <p><strong>API grupo 24:</strong> Salario mensual medio — <code>https://sos2526-24.onrender.com/api/v1/average-monthly-wages/</code></p>
        <p><strong>Interpretación:</strong> Países arriba → mucho HCFC. Países a la derecha → salario alto. Burbujas grandes y rojas = alto HCFC y salario alto? El color rojo indica salario alto, azul salario bajo; el tamaño indica cantidad de HCFC (mayor tamaño = más HCFC). Países sin salario aparecen en X=0 (color gris), países sin HCFC aparecen en Y=0 (tamaño mínimo).</p>
    </div>

    {#if loading}
        <div class="loading-box">
            <div class="spinner"></div>
            <p>Cargando datos de ambas APIs...</p>
        </div>
    {:else if error}
        <div class="error-box">❌ Error: {error}</div>
    {:else}
        <div class="legend">
            <div><span style="background:#d73027; display:inline-block; width:20px; height:12px;"></span> Salario alto (rojo)</div>
            <div><span style="background:#4575b4; display:inline-block; width:20px; height:12px;"></span> Salario bajo (azul)</div>
            <div><span style="background:#cccccc; display:inline-block; width:20px; height:12px;"></span> Sin dato de salario</div>
            <div>◉ Tamaño de burbuja: mayor tamaño = mayor consumo de HCFC</div>
        </div>

        <div class="chart-card">
            <div bind:this={container} style="width:100%; height:520px; background:#ffffff;"></div>
        </div>

        <div class="info">
            <h3>📖 Sobre esta integración</h3>
            <ul>
                <li><strong>Biblioteca:</strong> D3.js | <strong>Tipo:</strong> Bubble chart (gráfico de burbujas)</li>
                <li><strong>Eje X:</strong> Salario mensual medio en USD (0 si no hay dato).</li>
                <li><strong>Eje Y:</strong> Consumo de HCFC en toneladas (0 si no hay dato).</li>
                <li><strong>Tamaño y color:</strong> Tamaño proporcional a HCFC. Color rojo/azul según salario (gris si no hay salario).</li>
                <li><strong>Visibilidad:</strong> Todos los países aparecen. Los que solo tienen HCFC están en X=0 (borde izquierdo), los que solo tienen salario están en Y=0 (borde inferior).</li>
                <li><strong>Tooltip interactivo:</strong> Pasa el ratón sobre cualquier burbuja para ver detalles completos.</li>
            </ul>
        </div>
    {/if}
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
        font-size: 1.8rem;
        margin-bottom: 0.5rem;
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
        margin-bottom: 1rem;
        font-size: 0.85rem;
        border-left: 4px solid #2085d8;
    }
    .info-api p { margin: 0.3rem 0; }
    .info-api code { background: #e2e8f0; padding: 0.2rem 0.4rem; border-radius: 4px; }
    .loading-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 60px 0;
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
        margin: 1rem 0;
        display: flex;
        gap: 1.5rem;
        flex-wrap: wrap;
        font-size: 0.8rem;
        background: #f8f9fa;
        padding: 0.5rem 1rem;
        border-radius: 8px;
    }
    .chart-card {
        background: white;
        border-radius: 12px;
        padding: 1rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        margin-bottom: 1rem;
    }
    .info {
        background: #f0f9ff;
        padding: 1rem;
        border-radius: 12px;
    }
    .info h3 { color: #2085d8; margin-top: 0; }
</style>