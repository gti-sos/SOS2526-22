<script>
    import { onMount } from 'svelte';

    let stats = $state([]);
    let loading = $state(true);
    let chartContainer = $state();

    async function loadData() {
        try {
            // 1. Cargas iniciales
            await fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts/loadInitialData");
            await fetch("https://sos2526-10.onrender.com/api/v2/protests/loadInitialData");

            const [resAgri, resProtests] = await Promise.all([
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts"),
                fetch("https://sos2526-10.onrender.com/api/v2/protests")
            ]);

            const dataAgri = await resAgri.json();
            const dataProtests = await resProtests.json();

            const merger = {};

            // 2. Procesar Agricultura
            dataAgri.forEach(d => {
                const y = String(d.year);
                if (!merger[y]) merger[y] = { year: y, temp: 0, totalProtests: 0 };
                merger[y].temp = parseFloat(d.average_temperature_c || 0);
            });

            // 3. Procesar Protestas usando el campo "protest" de tu JSON
            dataProtests.forEach(d => {
                const y = String(d.year);
                if (!merger[y]) merger[y] = { year: y, temp: 0, totalProtests: 0 };
                
                // Sumamos el valor del campo 'protest' (que es 1 según tu ejemplo)
                const val = parseInt(d.protest);
                merger[y].totalProtests += isNaN(val) ? 0 : val;
            });

            // 4. Ordenar y limpiar
            stats = Object.values(merger)
                .sort((a, b) => parseInt(a.year) - parseInt(b.year))
                .filter(s => s.temp > 0 || s.totalProtests > 0);

            loading = false;
            setTimeout(renderChart, 500); 
        } catch (e) {
            console.error("Error en integración:", e);
            loading = false;
        }
    }

    function renderChart() {
        if (!chartContainer || stats.length === 0) return;

        // @ts-ignore
        c3.generate({
            bindto: chartContainer,
            data: {
                x: 'x',
                columns: [
                    ['x', ...stats.map(s => s.year)],
                    ['Temperatura Media (°C)', ...stats.map(s => s.temp)],
                    ['Número de Protestas', ...stats.map(s => s.totalProtests)]
                ],
                type: 'area-step',
                axes: { 'Número de Protestas': 'y2' }
            },
            axis: {
                x: { type: 'category', label: 'Evolución Anual' },
                y: { label: 'Temperatura', tick: { format: d => d + "°" } },
                y2: { show: true, label: 'Cantidad de Protestas' }
            },
            color: { pattern: ['#ff4d4d', '#2c3e50'] },
            grid: { y: { show: true } }
        });
    }

    onMount(() => {
        // Carga de estilos y scripts de C3/D3
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/c3/0.7.20/c3.min.css';
        document.head.appendChild(link);

        const s1 = document.createElement('script');
        s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/5.16.0/d3.min.js';
        s1.onload = () => {
            const s2 = document.createElement('script');
            s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/c3/0.7.20/c3.min.js';
            s2.onload = loadData;
            document.head.appendChild(s2);
        };
        document.head.appendChild(s1);
    });
</script>

<main style="padding: 20px; font-family: 'Segoe UI', Tahoma, sans-serif;">
    <h1 style="text-align: center; color: #2c3e50;">Dashboard: Clima vs Protestas</h1>

    <div style="background: white; border-radius: 15px; padding: 25px; box-shadow: 0 8px 30px rgba(0,0,0,0.08);">
        {#if loading}
            <div style="text-align: center; padding: 50px;">
                <strong>Procesando datos</strong>
            </div>
        {:else}
            <div bind:this={chartContainer} style="height: 450px;"></div>

            <div style="margin-top: 30px; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                            <th style="padding: 12px;">Año</th>
                            <th>Temperatura (°C)</th>
                            <th>Total Protestas (Suma)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each stats as s}
                            <tr style="border-bottom: 1px solid #eee; text-align: center;">
                                <td style="padding: 10px; font-weight: bold;">{s.year}</td>
                                <td style="color: #ff4d4d;">{s.temp.toFixed(2)} °C</td>
                                <td style="color: #2c3e50; font-weight: bold;">{s.totalProtests}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</main>