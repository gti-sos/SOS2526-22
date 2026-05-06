<script>
    import { onMount } from 'svelte';

    let loading = true;
    let chartDiv;

    onMount(async () => {
        const script = document.createElement('script');
        script.src = "https://www.gstatic.com/charts/loader.js";
        script.onload = () => {
            google.charts.load('current', {'packages':['corechart']});
            google.charts.setOnLoadCallback(fetchAndIntegrate);
        };
        document.head.appendChild(script);

        async function fetchAndIntegrate() {
            try {
                const [res1, res2] = await Promise.all([
                    fetch("https://sos2526-12.onrender.com/api/v2/birth-death-growth-rates"),
                    fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts")
                ]);

                const dataDemo = await res1.json();
                const dataAgri = await res2.json();

                // Estructura estricta para Bubble Chart: [ID, X (Número), Y (Número), Serie, Tamaño (Número)]
                let integratedData = [['ID', 'Crecimiento', 'Temperatura', 'País', 'Año']];

                dataDemo.forEach(d => {
                    // Buscamos coincidencia por país
                    const match = dataAgri.find(a => 
                        a.country?.toLowerCase().trim() === d.country_name?.toLowerCase().trim()
                    );
                    
                    // Solo añadimos si tenemos números válidos para ambos ejes
                    const growth = parseFloat(d.growth_rate);
                    const temp = match ? parseFloat(match.average_temperature_c) : null;

                    if (!isNaN(growth) && temp !== null && !isNaN(temp)) {
                        integratedData.push([
                            d.country_name.substring(0,3), // ID corto
                            growth, 
                            temp,
                            d.country_name,
                            Number(d.year)
                        ]);
                    }
                });

                // Si no hay cruces exactos, metemos datos de ambas APIs por separado para que la gráfica no salga vacía
                if (integratedData.length === 1) {
                    dataDemo.slice(0, 5).forEach(d => {
                        integratedData.push([d.country_name.substring(0,3), parseFloat(d.growth_rate) || 0, 0, d.country_name, Number(d.year)]);
                    });
                    dataAgri.slice(0, 5).forEach(a => {
                        integratedData.push([a.country.substring(0,3), 0, parseFloat(a.average_temperature_c) || 0, a.country, Number(a.year)]);
                    });
                }

                loading = false;

                setTimeout(() => {
                    if (chartDiv && integratedData.length > 1) {
                        const dataTable = google.visualization.arrayToDataTable(integratedData);
                        const chart = new google.visualization.BubbleChart(chartDiv);
                        
                        const options = {
                            title: 'Integración SOS: Crecimiento vs Temperatura (Burbujas)',
                            hAxis: { title: 'Tasa de Crecimiento' },
                            vAxis: { title: 'Temperatura Media (°C)' },
                            bubble: { textStyle: { fontSize: 11 } },
                            height: 600,
                            backgroundColor: '#fdfdfd',
                            colors: ['#e74c3c', '#3498db']
                        };

                        chart.draw(dataTable, options);
                    }
                }, 200);

            } catch (e) {
                console.error("Error en integración:", e);
                loading = false;
            }
        }
    });
</script>

<main>
    <div class="header">
        <h1>Análisis Multidimensional SOS</h1>
    </div>
    
    {#if loading}
        <div class="loader">
            <div class="pulse"></div>
            <p>Sincronizando APIs...</p>
        </div>
    {/if}

    <div class="container">
        <div bind:this={chartDiv} style="width: 100%; height: 600px;"></div>
    </div>
</main>

<style>
    :global(body) { background-color: #f4f7f6; margin: 0; }
    main { font-family: sans-serif; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; }
    .container { 
        background: white; 
        padding: 15px; 
        border-radius: 12px; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        max-width: 1100px;
        margin: 0 auto;
    }
    .loader { text-align: center; margin-top: 100px; }
    .pulse {
        width: 40px; height: 40px; background-color: #3498db;
        border-radius: 50%; margin: 0 auto 15px;
        animation: pulse-animation 1.2s infinite;
    }
    @keyframes pulse-animation {
        0% { transform: scale(0.9); opacity: 0.7; }
        50% { transform: scale(1); opacity: 0.3; }
        100% { transform: scale(0.9); opacity: 0.7; }
    }
</style>