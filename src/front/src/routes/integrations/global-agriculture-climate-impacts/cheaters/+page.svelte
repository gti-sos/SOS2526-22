<script>
    import { onMount } from 'svelte';

    let loading = $state(true);
    let chartContainer = $state();
    let integratedData = $state([]);

    async function loadData() {
        try {
            const [resAgri, resProxy] = await Promise.all([
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts"),
                fetch("/cheaters-stats-proxy/loadInitialData")
            ]);

            const agriData = await resAgri.json();
            const rawCheaters = await resProxy.json();
            const cheatersList = Array.isArray(rawCheaters) ? rawCheaters : [];

            // Unión de datos por año
            const years = [...new Set([...agriData.map(d => d.year), ...cheatersList.map(d => d.year)])]
                .filter(y => y)
                .sort((a, b) => a - b);

            integratedData = years.map(year => {
                const agri = agriData.find(d => d.year === year);
                const cheat = cheatersList.find(d => d.year === year);
                if (!agri || !cheat) return null;

                return {
                    year: String(year),
                    agri: agri.average_temperature_c,
                    cheat: cheat.confirmed_bans
                };
            }).filter(Boolean).slice(-10); // Mostramos los últimos 10 años para no saturar el radar

            loading = false;
            setTimeout(renderChart, 100);
        } catch (e) {
            console.error("Error cargando APIs:", e);
            loading = false;
        }
    }

    function renderChart() {
        if (!chartContainer || integratedData.length === 0) return;

        // @ts-ignore
        bb.generate({
            bindto: chartContainer,
            data: {
                x: "x",
                columns: [
                    ["x", ...integratedData.map(d => d.year)],
                    ["Temperatura (ºC)", ...integratedData.map(d => d.agri)],
                    ["Baneos (Escalado /10)", ...integratedData.map(d => d.cheat / 10)] 
                ],
                type: "radar", // ESTILO NO LINEAL
                labels: true
            },
            radar: {
                axis: { max: 40 },
                level: { depth: 4 },
                direction: { clockwise: true }
            },
            color: {
                pattern: ["#e74c3c", "#3498db"]
            },
            legend: { position: "bottom" }
        });
    }

    onMount(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/billboard.js/dist/billboard.min.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/billboard.js/dist/billboard.pkgd.min.js';
        script.onload = loadData;
        document.head.appendChild(script);
    });
</script>

<main>
    <div class="card">
        <h1>Análisis Radial: Impacto Climático vs Cheaters</h1>
        <p class="subtitle">Biblioteca: <strong>Billboard.js</strong> | Estilo: <strong>Radar Chart (No Lineal)</strong></p>

        {#if loading}
            <div class="loader">
                <div class="spinner"></div>
                <p>Cruzando datos de APIs...</p>
            </div>
        {:else}
            <div bind:this={chartContainer} class="radar-view"></div>

            <section class="table-container">
                <h3>Detalle de Datos Integrados</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Año de Referencia</th>
                            <th>Temperatura Media (ºC)</th>
                            <th>Baneos Confirmados</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each integratedData as d}
                            <tr>
                                <td><strong>{d.year}</strong></td>
                                <td class="val-agri">{d.agri.toFixed(2)} ºC</td>
                                <td class="val-cheat">{d.cheat.toLocaleString()}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </section>
        {/if}
    </div>
</main>

<style>
    main { padding: 40px 20px; background: #f4f7f6; min-height: 100vh; font-family: 'Segoe UI', Tahoma, sans-serif; }
    .card { background: white; max-width: 900px; margin: auto; padding: 30px; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
    
    h1 { text-align: center; color: #2c3e50; margin-bottom: 5px; }
    .subtitle { text-align: center; color: #7f8c8d; margin-bottom: 30px; }
    
    .radar-view { height: 450px; width: 100%; margin-bottom: 40px; }

    .table-container { margin-top: 20px; border-top: 2px solid #eee; padding-top: 20px; }
    .table-container h3 { color: #34495e; font-size: 1.1rem; margin-bottom: 15px; }

    table { width: 100%; border-collapse: collapse; background: #fff; }
    th { background: #34495e; color: white; padding: 12px; text-align: center; font-size: 0.9rem; }
    td { padding: 12px; text-align: center; border-bottom: 1px solid #f1f1f1; }
    
    .val-agri { color: #e74c3c; font-weight: bold; }
    .val-cheat { color: #3498db; font-weight: bold; }

    .loader { text-align: center; padding: 100px; }
    .spinner { 
        width: 50px; height: 50px; border: 5px solid #f3f3f3; 
        border-top: 5px solid #3498db; border-radius: 50%; 
        animation: spin 1s linear infinite; margin: 0 auto 20px;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>