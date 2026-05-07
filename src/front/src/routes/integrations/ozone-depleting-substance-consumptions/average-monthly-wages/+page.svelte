<script>
// @ts-nocheck

    import { onMount } from 'svelte';

    let loading = $state(true);
    let error = $state(null);
    let container = $state(null);
    let chartData = $state(null);
    let rendered = $state(false);

    // @ts-ignore
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
        // @ts-ignore
        if (replacements[n]) return replacements[n];
        return n.replace(/[\s_]+/g, '-');
    }

    // @ts-ignore
    function transformSize(rawHcfc) {
        return Math.pow(rawHcfc, 0.35);
    }

    async function fetchData() {
        try {
            loading = true;
            error = null;

            console.log('📡 Cargando HCFC...');
            const resOzone = await fetch('/api/v1/ozone-depleting-substance-consumptions/loadInitialData');
            if (!resOzone.ok) throw new Error(`HTTP ${resOzone.status} - Ozono`);
            const ozone = await resOzone.json();
            const hcfcByCountry = {};
            // @ts-ignore
            ozone.forEach(item => {
                let c = item.country;
                if (c === 'world' || c === 'asia') return;
                c = normalizeCountry(c);
                const value = Math.abs(item.hcfc || 0);
                // @ts-ignore
                hcfcByCountry[c] = (hcfcByCountry[c] || 0) + value;
            });
            console.log('✅ HCFC por país:', hcfcByCountry);

            console.log('📡 Cargando salarios...');
            const resWages = await fetch('https://sos2526-24.onrender.com/api/v1/average-monthly-wages/');
            if (!resWages.ok) throw new Error(`HTTP ${resWages.status} - Wages`);
            const wages = await resWages.json();
            const wagesArray = Array.isArray(wages) ? wages : (wages.data || []);

            const wagesByCountry = {};
            // @ts-ignore
            wagesArray.forEach(item => {
                let c = item.country;
                if (!c) return;
                c = normalizeCountry(c);
                // Guardamos el registro con el año más reciente (aunque no mostremos el año)
                // @ts-ignore
                if (!wagesByCountry[c] || wagesByCountry[c].year < item.year) {
                    // @ts-ignore
                    wagesByCountry[c] = { ...item, country: c };
                }
            });
            console.log('✅ Salarios por país:', Object.keys(wagesByCountry).length);

            const allCountries = new Set([...Object.keys(hcfcByCountry), ...Object.keys(wagesByCountry)]);
            console.log('🌍 Total países únicos:', allCountries.size);

            const nodes = [];
            const MIN_RAW_HCFC = 20;

            for (const countryKey of allCountries) {
                // @ts-ignore
                const hcfc = hcfcByCountry[countryKey] || 0;
                // @ts-ignore
                const wageData = wagesByCountry[countryKey];
                const salary = wageData ? wageData.avg_monthly_usd : 0;
                const currency = wageData ? wageData.currency : 'N/A';
                const hasSalary = salary > 0;
                const hasHcfc = hcfc > 0;

                let size;
                if (hasHcfc) {
                    size = transformSize(hcfc);
                } else {
                    size = transformSize(MIN_RAW_HCFC);
                }

                const label = countryKey.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
                nodes.push({
                    name: label,
                    country: label,
                    hcfc,
                    salary,
                    currency,
                    hasSalary,
                    hasHcfc,
                    size
                });
            }

            nodes.sort((a,b) => b.size - a.size);
            console.log('📊 Datos transformados (primeros 5):', nodes.slice(0,5).map(n => ({ name: n.name, size: n.size, hcfc: n.hcfc })));
            // @ts-ignore
            chartData = nodes;
            loading = false;
        } catch (err) {
            console.error('❌ Error:', err);
            // @ts-ignore
            error = err.message;
            loading = false;
        }
    }

    // @ts-ignore
    async function renderCirclePacking(data) {
        if (!container) return;
        // @ts-ignore
        let width = container.clientWidth;
        if (width === 0) {
            setTimeout(() => renderCirclePacking(data), 100);
            return;
        }
        const height = 600;
        console.log(`🎨 Renderizando Circle Packing con ${data.length} países, ancho=${width}`);

        const d3 = await import('d3');
        const existingSvg = d3.select(container).select('svg');
        if (!existingSvg.empty()) existingSvg.remove();
        
        const rootData = {
            name: 'root',
            // @ts-ignore
            children: data.map(d => ({ ...d, value: d.size }))
        };

        const pack = d3.pack().size([width, height]).padding(5);
        // @ts-ignore
        const root = pack(d3.hierarchy(rootData).sum(d => d.value).sort((a,b) => b.value - a.value));

        // @ts-ignore
        const getSalaryColor = (salary) => {
            if (salary > 5000) return '#e63946';
            if (salary > 2000) return '#f4a261';
            return '#264653';
        };

        const svg = d3.select(container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('background', '#fafafa');

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

        const nodesGroup = svg.selectAll('g')
            .data(root.descendants().slice(1))
            .join('g')
            .attr('transform', d => `translate(${d.x},${d.y})`);

        nodesGroup.append('circle')
            .attr('r', d => d.r)
            .attr('fill', d => {
                if (d.data.hasSalary) {
                    return getSalaryColor(d.data.salary);   // rojo, naranja o azul oscuro
                }
                if (d.data.hasHcfc) {
                    return '#3a6ea5';   // azul medio para solo HCFC
                }
                return '#f5f5f5';       // gris muy claro: !hasSalary && !hasHcfc
            })
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this).attr('opacity', 0.8);
                const salaryText = d.data.hasSalary ? `$${d.data.salary.toLocaleString()} USD/mes` : 'Sin dato';
                tooltip.style('opacity', 1)
                    .html(`
                        <b>${d.data.name}</b><br>
                        💰 Salario: ${salaryText}<br>
                        💱 Moneda: ${d.data.currency}<br>
                        🌿 HCFC: ${d.data.hasHcfc ? `${d.data.hcfc.toLocaleString()} ton` : 'Sin dato'}
                    `)
                    .style('left', (event.pageX + 12) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mousemove', function(event) {
                tooltip.style('left', (event.pageX + 12) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 1);
                tooltip.style('opacity', 0);
            });

        nodesGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', '#333')
            .style('font-size', d => `${Math.min(14, d.r / 3.5)}px`)
            .style('font-weight', 'bold')
            .text(d => d.r > 24 ? d.data.name : '');

        rendered = true;
        console.log('✅ Circle Packing renderizado sin años');
    }

    $effect(() => {
        if (!loading && chartData && container && !rendered) {
            renderCirclePacking(chartData);
        }
    });

    onMount(() => {
        fetchData();
    });
</script>

<svelte:head>
    <title>Integración 5 - Salarios vs HCFC (Circle Packing)</title>
</svelte:head>

<div class="container">
    <h1>⭕ Circle Packing: Salario vs Consumo de HCFC</h1>
    <p class="subtitle">Datos de <strong>API propia</strong> (consumo de HCFC por país) y <strong>SOS2526-24</strong> (salario mensual medio por país)</p>

    <div class="info-api">
        <p><strong>API propia:</strong> Consumo de HCFC — <code>/api/v1/ozone-depleting-substance-consumptions</code></p>
        <p><strong>API grupo 24:</strong> Salario mensual medio — <code>https://sos2526-24.onrender.com/api/v1/average-monthly-wages/</code></p>
        <p><strong>Integración:</strong> Cada círculo representa un país. El tamaño indica el consumo de HCFC y el color indica el salario mensual medio en USD. Los valores de HCFC se comprimen con potencia 0.35 para que los países pequeños sean visibles.</p>   

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
            <div><span class="legend-color salary-high"></span> Salario &gt; $5000</div>
            <div><span class="legend-color salary-mid"></span> Salario $2000–5000</div>
            <div><span class="legend-color salary-low"></span> Salario &lt; $2000</div>
            <div><span class="legend-color hcfc-only"></span> Solo HCFC (sin salario)</div>
            <div><span class="legend-color no-data"></span> Sin salario ni HCFC (raro)</div>
            <div>Tamaño = consumo HCFC</div>
            <div>📌 Países sin HCFC tienen tamaño equivalente a 20 toneladas (inferior a Bangladesh)</div>
        </div>

        <div class="chart-card">
            <div bind:this={container} style="width:100%; height:600px; background:#fafafa;"></div>
        </div>

        <div class="info">
            <h3>Sobre esta integración</h3>
           <ul>
                <li><strong>Biblioteca:</strong> D3.js | <strong>Tipo:</strong> Circle Packing</li>
                <li><strong>Tamaño del círculo:</strong> Consumo de HCFC (toneladas) </li>
                <li><strong>Color:</strong> Salario mensual medio en USD.</li>
                <li><strong>Azul:</strong> Países con HCFC pero sin dato de salario.</li>
                <li><strong>Gris muy claro:</strong> Países sin salario ni HCFC (caso muy raro)</li>
                <li><strong>Tooltip:</strong> Muestra salario, moneda, HCFC y año.</li>
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
        margin-bottom: 1rem;
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
    .legend-color {
        display: inline-block;
        width: 20px;
        height: 12px;
        margin-right: 0.3rem;
        border-radius: 2px;
        vertical-align: middle;
    }
    .no-data {
        background-color: #f5f5f5;
        border: 1px solid #ccc;
    }
    .salary-high { background-color: #e63946; }
    .salary-mid  { background-color: #f4a261; }
    .salary-low  { background-color: #264653; }
    .hcfc-only   { background-color: #3a6ea5; }
    .chart-card {
        background: white;
        border-radius: 12px;
        padding: 1rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        margin-bottom: 1rem;
        min-height: 620px;
    }
    .info {
        background: #f0f9ff;
        padding: 1rem;
        border-radius: 12px;
        margin-top: 1rem;
    }
    .info h3 { color: #2085d8; margin-top: 0; }
</style>