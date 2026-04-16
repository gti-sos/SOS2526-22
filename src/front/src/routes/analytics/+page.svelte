<script>
    import { onMount } from 'svelte';
    
    let loading = $state(true);
    let error = $state(null);
    
    onMount(() => {
        initChart();
    });
    
    async function initChart() {
        try {
            const [resElena, resCelia, resJulio] = await Promise.all([
                fetch('/api/v2/ozone-depleting-substance-consumptions'),
                fetch('/api/v2/global-agriculture-climate-impacts'),
                fetch('/api/v2/co2-emission-gap-among-countries-clustering-pca')
            ]);

            if (!resElena.ok) throw new Error('Error al cargar datos de ozono');
            if (!resCelia.ok) throw new Error('Error al cargar datos de agricultura');
            if (!resJulio.ok) throw new Error('Error al cargar datos de CO2');

            const ozonoData = await resElena.json();
            const celiaRaw = await resCelia.json();
            const julioRaw = await resJulio.json();

            const agriculturaData = Array.isArray(celiaRaw) ? celiaRaw : (celiaRaw.data || []);
            const emisionesData = Array.isArray(julioRaw) ? julioRaw : (julioRaw.data || []);

            // Serie Elena: HCFC por año (sin world y sin asia)
            const hcfcPorAnio = {};
            // @ts-ignore
            ozonoData.filter(d => d.country !== 'world' && d.country !== 'asia').forEach(d => {
                // @ts-ignore
                if (!hcfcPorAnio[d.year]) hcfcPorAnio[d.year] = 0;
                // @ts-ignore
                hcfcPorAnio[d.year] += Math.abs(Number(d.hcfc) || 0);
            });

            // Serie Celia: temperatura media por año
            const tempPorAnio = {};
            const countPorAnio = {};
            // @ts-ignore
            agriculturaData.forEach(d => {
                // @ts-ignore
                if (!tempPorAnio[d.year]) { tempPorAnio[d.year] = 0; countPorAnio[d.year] = 0; }
                // @ts-ignore
                tempPorAnio[d.year] += Number(d.average_temperature_c) || 0;
                // @ts-ignore
                countPorAnio[d.year]++;
            });
            const tempMediaPorAnio = {};
            Object.keys(tempPorAnio).forEach(y => {
                // @ts-ignore
                tempMediaPorAnio[y] = tempPorAnio[y] / countPorAnio[y];
            });

            // Serie Julio: savanna_fire por año
            const savannaPorAnio = {};
            // @ts-ignore
            emisionesData.forEach(d => {
                // @ts-ignore
                if (!savannaPorAnio[d.year]) savannaPorAnio[d.year] = 0;
                // @ts-ignore
                savannaPorAnio[d.year] += Number(d.savanna_fire) || 0;
            });

            // Unir todos los años
            const yearsSet = new Set([
                ...Object.keys(hcfcPorAnio),
                ...Object.keys(tempMediaPorAnio),
                ...Object.keys(savannaPorAnio)
            ]);
            const years = Array.from(yearsSet).map(Number).sort((a, b) => a - b);

            // @ts-ignore
            const valoresElena = years.map(y => hcfcPorAnio[y] || 0);
            // @ts-ignore
            const valoresCelia = years.map(y => tempMediaPorAnio[y] || 0);
            // @ts-ignore
            const valoresJulio = years.map(y => savannaPorAnio[y] || 0);

            // Opción 3: porcentaje sobre el total de cada serie
            const totalElena = valoresElena.reduce((a, b) => a + b, 0) || 1;
            const totalCelia = valoresCelia.reduce((a, b) => a + b, 0) || 1;
            const totalJulio = valoresJulio.reduce((a, b) => a + b, 0) || 1;

            const Highcharts = (await import('highcharts')).default;
            const AccessibilityModule = (await import('highcharts/modules/accessibility')).default;
            // @ts-ignore
            if (typeof AccessibilityModule === 'function') AccessibilityModule(Highcharts);

            // @ts-ignore
            Highcharts.chart('container', {
                chart: { type: 'column', height: 550 },
                title: { text: 'Visualización Integrada del Equipo SOS2526-22' },
                xAxis: {
                    categories: years,
                    title: { text: 'Año' },
                    labels: { rotation: -45 }
                },
                yAxis: {
                    title: { text: 'Porcentaje sobre el total (%)' },
                    max: 100,
                    labels: { format: '{value}%' }
                },
                tooltip: {
                    shared: false,
                    pointFormatter: function () {
                        // @ts-ignore
                        const idx = this.point.index;
                        // @ts-ignore
                        const valoresReales = this.series.userOptions.valoresReales;
                        // @ts-ignore
                        const unidad = this.series.userOptions.unidad;
                        return `<b>${this.series.name}</b><br>
                                Porcentaje: <b>${
// @ts-ignore
                                this.y.toFixed(2)}%</b><br>
                                Valor real: <b>${valoresReales[idx].toFixed(2)} ${unidad}</b><br>`;
                    }
                },
                plotOptions: {
                    column: {
                        dataLabels: { enabled: false },
                        borderWidth: 0,
                        borderRadius: 4,
                        groupPadding: 0.1,
                        minPointLength: 5
                    }
                },
                series: [{
                    name: 'Elena - Consumo HCFC',
                    // @ts-ignore
                    data: years.map((y, i) => valoresElena[i] > 0 ? (valoresElena[i] / totalElena) * 100 : null),
                    color: '#1e88e5',
                    valoresReales: valoresElena,
                    unidad: 'toneladas'
                }, {
                    name: 'Celia - Temperatura media',
                    // @ts-ignore
                    data: years.map((y, i) => valoresCelia[i] > 0 ? (valoresCelia[i] / totalCelia) * 100 : null),
                    color: '#fb8c00',
                    valoresReales: valoresCelia,
                    unidad: '°C'
                }, {
                    name: 'Julio - Savanna Fire',
                    // @ts-ignore
                    data: years.map((y, i) => valoresJulio[i] > 0 ? (valoresJulio[i] / totalJulio) * 100 : null),
                    color: '#10b981',
                    valoresReales: valoresJulio,
                    unidad: 'toneladas CO2'
                }],
                credits: { enabled: false },
                legend: { align: 'right', verticalAlign: 'top', layout: 'vertical' }
            });

            loading = false;

        } catch (e) {
            console.error('Error:', e);
            // @ts-ignore
            error = e.message;
            loading = false;
        }
    }
</script>

<div class="analytics-container">
    <h1>Visualización Integrada del Equipo</h1>
    
    <div class="individual-links">
        <a href="/analytics/ozone-depleting-substance-consumptions" class="link-btn">Elena - Consumo HCFC</a>
        <a href="/analytics/global-agriculture-climate-impacts" class="link-btn">Celia - Temperatura media</a>
        <a href="/analytics/co2-emission-gap-among-countries-clustering-pca" class="link-btn">Julio - Savanna Fire</a>
    </div>
    
    <div id="container" style="height: 600px; width: 100%;"></div>
    
    {#if loading}
        <div class="loading-overlay">
            <div class="spinner"></div>
            <p>Cargando gráfico grupal...</p>
        </div>
    {/if}
    
    {#if error}
        <div class="error">
            <p>Error: {error}</p>
        </div>
    {/if}
        
    <div class="info">
        <h3>Visualización Grupal - Métricas utilizadas</h3>
        <ul>
            <li><strong>🔵 Barras azules (Elena):</strong> Consumo de HCFC por año (toneladas) — datos de consumo de sustancias que agotan el ozono.</li>
            <li><strong>🟠 Barras naranjas (Celia):</strong> Temperatura media anual por año (°C) — datos de impacto climático en la agricultura.</li>
            <li><strong>🟢 Barras verdes (Julio):</strong> Emisiones por fuego de sabana por año — datos de emisiones de CO2.</li>
        </ul>
        <p><strong>Normalización:</strong> Cada barra representa el porcentaje que ese año supone sobre el total acumulado de su serie. Así se pueden comparar las tres fuentes de datos independientemente de sus unidades.</p>
    </div>
</div>

<style>
    .analytics-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        position: relative;
        min-height: 600px;
    }
    
    h1 {
        color: #1e88e5;
        text-align: center;
        margin-bottom: 0.5rem;
    }
    
    .individual-links {
        display: flex;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 2rem;
    }
    
    .link-btn {
        background: #f0f9ff;
        color: #1e88e5;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 500;
        border: 1px solid #bae6fd;
        transition: all 0.2s;
    }
    
    .link-btn:hover {
        background: #1e88e5;
        color: white;
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
        border: 4px solid #f3f3f3;
        border-top: 4px solid #1e88e5;
        border-radius: 50%;
        width: 40px;
        height: 40px;
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
        margin-top: 1rem;
        color: #e53935;
        background: #fee2e2;
        border-radius: 8px;
    }
    
    .info {
        margin-top: 2rem;
        padding: 1rem;
        background: #f0f9ff;
        border-radius: 12px;
        border: 1px solid #bae6fd;
    }
    
    .info h3 {
        color: #1e88e5;
        margin-top: 0;
    }
    
    .info ul {
        margin: 0;
        padding-left: 1.5rem;
    }
    
    .info li {
        margin: 0.5rem 0;
        color: #333;
    }
</style>