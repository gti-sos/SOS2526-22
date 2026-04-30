<script>
    import { onMount } from 'svelte';

    let cheatersList = $state([]); 
    let agriData = $state([]); 
    let loading = $state(true);

    // 1. Procesamiento de datos agrupados por AÑO
    let integratedData = $derived.by(() => {
        if (agriData.length === 0 && cheatersList.length === 0) return [];

        const allYears = [...new Set([...agriData.map(d => d.year), ...cheatersList.map(d => d.year)])]
            .filter(y => y).sort((a, b) => a - b);

        return allYears.map(year => {
            const agriForYear = agriData.filter(d => d.year === year);
            const cheatForYear = cheatersList.filter(d => d.year === year);

            return {
                year,
                // Valor de tu API (Eje Y)
                agriVal: agriForYear.length > 0 
                    ? agriForYear.reduce((acc, curr) => acc + (curr.average_temperature_c || 0), 0) / agriForYear.length 
                    : 20, // Valor base si no hay dato para que no baje a 0
                // Valor de la API Externa (Radio de la burbuja)
                cheatersVal: cheatForYear.reduce((acc, curr) => acc + (curr.confirmed_bans || 0), 0)
            };
        }).filter(d => d.cheatersVal > 0 || agriData.some(a => a.year === d.year));
    });

    // 2. Límites para escalar las burbujas
    let maxCheat = $derived(Math.max(...integratedData.map(d => d.cheatersVal), 100));
    let maxAgri = $derived(Math.max(...integratedData.map(d => d.agriVal), 40));

    onMount(async () => {
        try {
            const [resAgri, resProxy] = await Promise.all([
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts"),
                fetch("/cheaters-stats-proxy/loadInitialData") 
            ]);
            agriData = await resAgri.json();
            const rawCheaters = await resProxy.json();
            cheatersList = Array.isArray(rawCheaters) ? rawCheaters : [];
            loading = false;
        } catch (e) {
            console.error(e);
            loading = false;
        }
    });
</script>

<main>
    <h1>Análisis de Burbujas: Impacto vs Trampas</h1>

    {#if loading}
        <div class="loading">Sincronizando dimensiones de datos...</div>
    {:else}
        <section class="bubble-chart-container">
            <h2>Relación Temporal (Altura: Agri | Tamaño: Cheaters)</h2>
            
            <div class="svg-container">
                <svg viewBox="0 0 700 400">
                    <line x1="60" y1="340" x2="650" y2="340" stroke="#ddd" stroke-width="2" />
                    <line x1="60" y1="40" x2="60" y2="340" stroke="#ddd" stroke-width="2" />
                    
                    <text x="20" y="200" transform="rotate(-90 20,200)" text-anchor="middle" class="axis-title">Impacto Agrícola (ºC)</text>

                    {#each integratedData as d, i}
                        {@const xPos = 100 + (i * (500 / (integratedData.length - 1 || 1)))}
                        {@const yPos = 340 - ((d.agriVal / maxAgri) * 260)}
                        {@const radius = 5 + ((d.cheatersVal / maxCheat) * 35)}

                        <line x1={xPos} y1="340" x2={xPos} y2={yPos} stroke="#f0f0f0" stroke-dasharray="4" />

                        <circle 
                            cx={xPos} 
                            cy={yPos} 
                            r={radius} 
                            class="bubble"
                        >
                            <title>
                                Año: {d.year}
                                Impacto Agri: {d.agriVal.toFixed(1)}
                                Baneos Cheaters: {d.cheatersVal}
                            </title>
                        </circle>

                        <text x={xPos} y="365" text-anchor="middle" class="year-label">{d.year}</text>
                    {/each}
                </svg>
            </div>

            <div class="legend">
                <div class="legend-item">
                    <span class="box agri-box"></span> <strong>Altura:</strong> Valor de tu API (Agricultura)
                </div>
                <div class="legend-item">
                    <span class="circle-sample"></span> <strong>Tamaño:</strong> Volumen de Baneos (Cheaters)
                </div>
            </div>
        </section>

        <section class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Año</th>
                        <th>Métrica Agrícola (Altura)</th>
                        <th>Baneos (Tamaño Burbuja)</th>
                    </tr>
                </thead>
                <tbody>
                    {#each integratedData as d}
                        <tr>
                            <td>{d.year}</td>
                            <td>{d.agriVal.toFixed(2)}</td>
                            <td class="cheat-val">{d.cheatersVal}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}
</main>

<style>
    main { padding: 2rem; max-width: 1000px; margin: auto; font-family: 'Inter', sans-serif; }
    h1 { text-align: center; color: #1a202c; font-weight: 800; margin-bottom: 2rem; }

    .bubble-chart-container { 
        background: #ffffff; 
        padding: 30px; 
        border-radius: 20px; 
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        border: 1px solid #edf2f7;
        margin-bottom: 3rem;
    }

    .svg-container { width: 100%; height: 400px; }
    svg { width: 100%; height: 100%; overflow: visible; }

    .bubble { 
        fill: rgba(46, 204, 113, 0.6); 
        stroke: #27ae60; 
        stroke-width: 2; 
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .bubble:hover { 
        fill: rgba(231, 76, 60, 0.7); 
        stroke: #c0392b;
        filter: drop-shadow(0 0 8px rgba(231, 76, 60, 0.5));
    }

    .axis-title { font-size: 14px; fill: #718096; font-weight: 600; }
    .year-label { font-size: 12px; fill: #4a5568; font-weight: bold; }

    .legend { 
        display: flex; 
        justify-content: center; 
        gap: 40px; 
        margin-top: 30px; 
        padding-top: 20px; 
        border-top: 1px solid #f7fafc;
    }

    .legend-item { display: flex; align-items: center; gap: 10px; font-size: 0.95rem; }
    .agri-box { width: 15px; height: 15px; background: #2ecc71; border-radius: 3px; }
    .circle-sample { width: 15px; height: 15px; border: 2px solid #c0392b; border-radius: 50%; }

    table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    th, td { padding: 15px; text-align: center; border-bottom: 1px solid #f0f0f0; }
    th { background: #2d3748; color: white; font-weight: 500; }
    .cheat-val { font-weight: bold; color: #c0392b; }

    .loading { text-align: center; font-size: 1.5rem; color: #a0aec0; padding: 100px; }
</style>