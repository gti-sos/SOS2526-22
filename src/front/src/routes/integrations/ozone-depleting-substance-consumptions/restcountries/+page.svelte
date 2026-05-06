<script>
    import { onMount } from 'svelte';
    import * as echarts from 'echarts';
    
    let loading = $state(true);
    let error = $state(null);
    let chart = $state(null);
    let sankeyData = $state({ nodes: [], links: [] });
    let countryDetails = $state([]);
    
    onMount(async () => {
        await fetchData();
    });
    
    async function fetchData() {
        try {
            loading = true;
            
            // 1. Obtener datos de Ozone
            const ozoneRes = await fetch('https://sos2526-22.onrender.com/api/v1/ozone-depleting-substance-consumptions');
            const ozoneData = await ozoneRes.json();
            
            // 2. Agrupar HCFC por país
            const countryHCFC = {};
            ozoneData.forEach(item => {
                const country = item.country;
                const hcfc = item.hcfc || 0;
                if (country && country !== 'world' && country !== 'asia' && hcfc > 0) {
                    countryHCFC[country] = (countryHCFC[country] || 0) + hcfc;
                }
            });
            
            // 3. Top 8 países
            const topCountries = Object.entries(countryHCFC)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([country, value]) => ({ country, hcfc: value }));
            
            // 4. Obtener datos de REST Countries
            const countriesData = [];
            
            for (const item of topCountries) {
                const { country, hcfc } = item;
                let population = 0;
                let area = 0;
                let gini = 0;
                
                try {
                    let countryName = country;
                    if (country === 'United States') countryName = 'usa';
                    if (country === 'United Kingdom') countryName = 'uk';
                    
                    const restRes = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`);
                    if (restRes.ok) {
                        const restData = await restRes.json();
                        const data = restData[0];
                        population = data?.population || 0;
                        area = data?.area || 0;
                        gini = data?.gini ? Object.values(data.gini)[0] : 0;
                    }
                } catch (e) {
                    console.log(`Error con ${country}:`, e);
                }
                
                countriesData.push({
                    name: country,
                    hcfc: hcfc,
                    population: population,
                    area: area,
                    gini: gini,
                    hcfcPerCapita: population > 0 ? (hcfc / population) * 1000 : 0,
                    populationGroup: population > 100000000 ? '> 100M' : population > 50000000 ? '50M-100M' : '10M-50M',
                    hcfcGroup: hcfc > 10000 ? 'Alto (>10000 t)' : hcfc > 1000 ? 'Medio (1000-10000 t)' : 'Bajo (<1000 t)'
                });
                
                await new Promise(r => setTimeout(r, 200));
            }
            
            countryDetails = countriesData;
            
            // 5. Preparar datos para Sankey
            const nodes = [];
            const links = [];
            
            // Nodo raíz
            nodes.push({ name: 'Consumo HCFC Mundial', itemStyle: { color: '#1e3a8a' } });
            
            // Nodos de países (con su consumo)
            countriesData.forEach(c => {
                nodes.push({ 
                    name: c.name, 
                    itemStyle: { color: c.hcfc > 10000 ? '#dc2626' : c.hcfc > 1000 ? '#f97316' : '#10b981' },
                    value: c.hcfc
                });
            });
            
            // Nodos de categorías de población
            const popCategories = ['> 100M', '50M-100M', '10M-50M'];
            popCategories.forEach(cat => {
                nodes.push({ name: `Población: ${cat}`, itemStyle: { color: '#8b5cf6' } });
            });
            
            // Links: Mundo -> País
            countriesData.forEach(c => {
                links.push({
                    source: 'Consumo HCFC Mundial',
                    target: c.name,
                    value: c.hcfc
                });
            });
            
            // Links: País -> Categoría de población
            countriesData.forEach(c => {
                links.push({
                    source: c.name,
                    target: `Población: ${c.populationGroup}`,
                    value: c.hcfc
                });
            });
            
            sankeyData = { nodes, links };
            
            console.log('Sankey Data:', sankeyData);
            
            setTimeout(() => {
                createSankeyChart();
            }, 200);
            
            loading = false;
            
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) overlay.style.display = 'none';
            
        } catch (e) {
            console.error('Error:', e);
            error = e.message;
            loading = false;
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) overlay.style.display = 'none';
        }
    }
    
    function createSankeyChart() {
        const container = document.getElementById('sankey-container');
        if (!container || sankeyData.nodes.length === 0) return;
        
        if (chart) {
            chart.dispose();
        }
        
        chart = echarts.init(container);
        
        const option = {
            title: {
                text: 'Flujo: Consumo HCFC y Población por País',
                subtext: 'Grosor = Consumo (t) | Color rojo = alto consumo | Morado = categoría población',
                left: 'center',
                top: 5,
                textStyle: { fontSize: 16, color: '#0369a1', fontFamily: 'Arial, sans-serif' },
                subtextStyle: { fontSize: 12, color: '#666', fontFamily: 'Arial, sans-serif' }
            },
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove',
                formatter: function(params) {
                    if (params.dataType === 'node') {
                        const country = countryDetails.find(c => c.name === params.name);
                        if (country) {
                            return `<b>${country.name}</b><br/>
                                    💨 HCFC: ${country.hcfc.toLocaleString()} t<br/>
                                    👥 Población: ${country.population.toLocaleString()}<br/>
                                    🗺️ Área: ${country.area.toLocaleString()} km²<br/>
                                    📊 GINI: ${country.gini}<br/>
                                    📈 Per cápita: ${country.hcfcPerCapita.toFixed(2)} kg`;
                        }
                        return `<b>${params.name}</b><br/>Valor: ${params.value?.toLocaleString() || 0}`;
                    } else {
                        return `<b>${params.data.source} → ${params.data.target}</b><br/>Consumo: ${params.data.value.toLocaleString()} t`;
                    }
                }
            },
            series: [{
                type: 'sankey',
                layout: 'none',
                emphasis: { focus: 'adjacency' },
                data: sankeyData.nodes,
                links: sankeyData.links,
                nodeWidth: 40,
                nodeGap: 25,
                draggable: true,
                lineStyle: {
                    color: 'gradient',
                    curveness: 0.5,
                    opacity: 0.6
                },
                label: {
                    fontSize: 11,
                    fontFamily: 'Arial, sans-serif',
                    position: 'right',
                    formatter: function(params) {
                        const country = countryDetails.find(c => c.name === params.name);
                        if (country) {
                            return `${params.name}\n${country.hcfc.toLocaleString()} t`;
                        }
                        return params.name;
                    }
                },
                itemStyle: {
                    borderWidth: 1,
                    borderColor: '#fff'
                },
                // Nivel de detalle: cuanto más alto, más se ven los valores
                nodeAlign: 'justify'
            }]
        };
        
        chart.setOption(option);
        window.addEventListener('resize', () => chart?.resize());
    }
</script>

<div class="integration-container">
    <h1>Consumo HCFC vs Datos Demográficos</h1>
    <p class="subtitle">Sankey Chart: Flujo de consumo por país y categoría de población</p>
    
    <div class="info-api">
        <p><strong>API 1:</strong> Ozone Depleting Substance - Consumo HCFC (Grupo 22)</p>
        <p><strong>API 2:</strong> REST Countries - Población, Área y GINI</p>
        <p><strong>Widget:</strong> Sankey con <strong>ECharts</strong></p>
        <p><strong>Interpretación:</strong> El grosor de las líneas representa el consumo de HCFC | Los nodos muestran país y consumo | El color rojo indica alto consumo</p>
    </div>
    
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Cargando datos...</p>
    </div>
    
    {#if error}
        <div class="error">Error: {error}</div>
    {:else if !loading}
        <div id="sankey-container" style="height: 600px; width: 100%; margin-bottom: 2rem;"></div>
        
        <div class="table-container">
            <h3>Datos completos por país</h3>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>País</th>
                            <th>HCFC (t)</th>
                            <th>Población</th>
                            <th>Área (km²)</th>
                            <th>GINI</th>
                            <th>HCFC per cápita (kg)</th>
                            <th>Categoría población</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each countryDetails as item}
                            <tr>
                                <td><strong>{item.name}</strong></td>
                                <td>{item.hcfc.toLocaleString()}</td>
                                <td>{item.population.toLocaleString()}</td>
                                <td>{item.area.toLocaleString()}</td>
                                <td>{item.gini}</td>
                                <td>{item.hcfcPerCapita.toFixed(2)}</td>
                                <td>{item.populationGroup}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="info">
            <h3>Interpretación</h3>
            <ul>
                <li><strong>Sankey Diagram:</strong> Flujo desde consumo mundial → países → categorías de población</li>
                <li><strong>Grosor de línea:</strong> Volumen de consumo de HCFC en toneladas</li>
                <li><strong>Color de países:</strong> Rojo = alto consumo, Naranja = medio, Verde = bajo</li>
                <li><strong>Node detail:</strong> Cada país muestra su nombre y consumo en la etiqueta</li>
                <li><strong>Tooltip:</strong> Al pasar el ratón muestra población, área, GINI y consumo per cápita</li>
            </ul>
        </div>
    {/if}
</div>

<style>
    .integration-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        position: relative;
        min-height: 600px;
    }
    
    h1 { color: #0369a1; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 1rem; }
    
    .info-api {
        background: #f0f9ff;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        font-size: 0.85rem;
        border-left: 4px solid #0284c7;
    }
    
    .loading-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border-radius: 16px;
        z-index: 100;
    }
    
    .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #0284c7;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .error {
        text-align: center;
        padding: 2rem;
        color: #dc2626;
        background: #fee2e2;
        border-radius: 8px;
    }
    
    .table-container {
        margin-top: 2rem;
        border-top: 1px solid #e2e8f0;
        padding-top: 1rem;
        overflow-x: auto;
    }
    
    .table-container h3 { color: #0369a1; margin-bottom: 1rem; }
    .table-wrapper { overflow-x: auto; }
    
    .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8rem;
    }
    
    th, td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
    }
    
    th {
        background: #f8fafc;
        font-weight: 600;
        color: #0369a1;
        position: sticky;
        top: 0;
    }
    
    tr:hover { background: #f0f9ff; }
    
    .info {
        margin-top: 2rem;
        padding: 1rem;
        background: #f0f9ff;
        border-radius: 12px;
        border: 1px solid #bae6fd;
    }
    
    .info h3 { color: #0369a1; margin-top: 0; }
    .info ul { margin: 0; padding-left: 1.5rem; }
    .info li { margin: 0.5rem 0; color: #333; }
</style>