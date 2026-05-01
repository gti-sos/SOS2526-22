<script>
    import { onMount } from 'svelte';

    let cheatersList = $state([]);
    let agriData = $state([]);
    let loading = $state(true);

    // Procesamiento de datos SOLO con datos reales
    let integratedData = $derived.by(() => {
        if (agriData.length === 0 && cheatersList.length === 0) return [];

        const allYears = [...new Set([
            ...agriData.map(d => d.year),
            ...cheatersList.map(d => d.year)
        ])]
            .filter(y => y)
            .sort((a, b) => a - b);

        return allYears.map(year => {
            const agriForYear = agriData.filter(d => d.year === year);
            const cheatForYear = cheatersList.filter(d => d.year === year);

            // Solo incluir años con datos en ambas APIs
            if (agriForYear.length === 0 || cheatForYear.length === 0) return null;

            const agriVal =
                agriForYear.reduce(
                    (acc, curr) => acc + (curr.average_temperature_c ?? 0),
                    0
                ) / agriForYear.length;

            const cheatersVal = cheatForYear.reduce(
                (acc, curr) => acc + (curr.confirmed_bans ?? 0),
                0
            );

            return {
                year,
                agriVal,
                cheatersVal
            };
        }).filter(Boolean);
    });

    // Escalas dinámicas sin valores artificiales
    let maxCheat = $derived(
        integratedData.length > 0
            ? Math.max(...integratedData.map(d => d.cheatersVal))
            : 0
    );

    let maxAgri = $derived(
        integratedData.length > 0
            ? Math.max(...integratedData.map(d => d.agriVal))
            : 0
    );

    onMount(async () => {
        try {
            const [resAgri, resProxy] = await Promise.all([
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts"),
                fetch("/cheaters-stats-proxy/loadInitialData")
            ]);

            agriData = await resAgri.json();

            const rawCheaters = await resProxy.json();
            cheatersList = Array.isArray(rawCheaters) ? rawCheaters : [];
        } catch (e) {
            console.error("Error cargando datos:", e);
        } finally {
            loading = false;
        }
    });
</script>

<main>
    <h1>Análisis de Burbujas: Impacto vs Trampas</h1>

    {#if loading}
        <div class="loading">Cargando datos desde APIs...</div>

    {:else if integratedData.length === 0}
        <div class="loading">No hay datos disponibles para mostrar</div>

    {:else}
        <section class="bubble-chart-container">
            <h2>Relación Temporal (Altura: Agri | Tamaño: Cheaters)</h2>

            <div class="svg-container">
                <svg viewBox="0 0 700 400">
                    <!-- Ejes -->
                    <line x1="60" y1="340" x2="650" y2="340" stroke="#ddd" stroke-width="2" />
                    <line x1="60" y1="40" x2="60" y2="340" stroke="#ddd" stroke-width="2" />

                    <text
                        x="20"
                        y="200"
                        transform="rotate(-90 20,200)"
                        text-anchor="middle"
                        class="axis-title"
                    >
                        Impacto Agrícola (ºC)
                    </text>

                    {#each integratedData as d, i}
                        {@const xPos = 100 + (i * (500 / (integratedData.length - 1 || 1)))}

                        {@const yPos = maxAgri > 0
                            ? 340 - ((d.agriVal / maxAgri) * 260)
                            : 340}

                        {@const radius = maxCheat > 0
                            ? 5 + ((d.cheatersVal / maxCheat) * 35)
                            : 5}

                        <line
                            x1={xPos}
                            y1="340"
                            x2={xPos}
                            y2={yPos}
                            stroke="#f0f0f0"
                            stroke-dasharray="4"
                        />

                        <circle
                            cx={xPos}
                            cy={yPos}
                            r={radius}
                            class="bubble"
                        >
                            <title>
                                Año: {d.year}
                                Impacto Agri: {d.agriVal.toFixed(2)}
                                Baneos Cheaters: {d.cheatersVal}
                            </title>
                        </circle>

                        <text
                            x={xPos}
                            y="365"
                            text-anchor="middle"
                            class="year-label"
                        >
                            {d.year}
                        </text>
                    {/each}
                </svg>
            </div>

            <div class="legend">
                <div class="legend-item">
                    <span class="box agri-box"></span>
                    <strong>Altura:</strong> Valor API Agricultura
                </div>

                <div class="legend-item">
                    <span class="circle-sample"></span>
                    <strong>Tamaño:</strong> API Cheaters
                </div>
            </div>
        </section>

        <section class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Año</th>
                        <th>Métrica Agrícola</th>
                        <th>Baneos</th>
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
    main {
        padding: 2rem;
        max-width: 1000px;
        margin: auto;
        font-family: 'Inter', sans-serif;
    }

    h1 {
        text-align: center;
        color: #1a202c;
        font-weight: 800;
        margin-bottom: 2rem;
    }

    .bubble-chart-container {
        background: white;
        padding: 30px;
        border-radius: 20px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        border: 1px solid #edf2f7;
        margin-bottom: 3rem;
    }

    .svg-container {
        width: 100%;
        height: 400px;
    }

    svg {
        width: 100%;
        height: 100%;
        overflow: visible;
    }

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

    .axis-title {
        font-size: 14px;
        fill: #718096;
        font-weight: 600;
    }

    .year-label {
        font-size: 12px;
        fill: #4a5568;
        font-weight: bold;
    }

    .legend {
        display: flex;
        justify-content: center;
        gap: 40px;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #f7fafc;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.95rem;
    }

    .agri-box {
        width: 15px;
        height: 15px;
        background: #2ecc71;
        border-radius: 3px;
    }

    .circle-sample {
        width: 15px;
        height: 15px;
        border: 2px solid #c0392b;
        border-radius: 50%;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    th, td {
        padding: 15px;
        text-align: center;
        border-bottom: 1px solid #f0f0f0;
    }

    th {
        background: #2d3748;
        color: white;
        font-weight: 500;
    }

    .cheat-val {
        font-weight: bold;
        color: #c0392b;
    }

    .loading {
        text-align: center;
        font-size: 1.3rem;
        color: #718096;
        padding: 100px;
    }
</style>