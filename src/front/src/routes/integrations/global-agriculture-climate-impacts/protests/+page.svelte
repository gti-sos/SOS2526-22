<script>
    import { onMount } from 'svelte';

    let stats = $state([]);
    let loading = $state(true);
    let chartContainer = $state();

    async function loadData() {
        try {

              // 1. Cargamos datos iniciales en la API de agricultura por si está vacía
            await fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts/loadInitialData");


            const [resAgri, resExp] = await Promise.all([
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts"),
                fetch("https://sos2526-13.onrender.com/api/v1/exportations-stats")
            ]);

            const dataAgri = await resAgri.json();
            const dataExp = await resExp.json();

            const merger = {};

            // 1. Insertamos TODOS los datos de Agricultura
            dataAgri.forEach(d => {
                const year = String(d.year);
                merger[year] = { 
                    year: year, 
                    temp: parseFloat(d.average_temperature_c || 0), 
                    tiv: 0 
                };
            });

            // 2. Insertamos TODOS los datos de Exportaciones (sin filtrar años comunes)
            dataExp.forEach(d => {
                const year = String(d.year_of_order || d.year);
                if (!merger[year]) {
                    merger[year] = { year: year, temp: 0, tiv: 0 };
                }
                merger[year].tiv += parseFloat(d.tiv_total_order || 0);
            });

            // 3. Ordenamos y quitamos solo los años que estén totalmente vacíos
            stats = Object.values(merger)
                .filter(s => s.temp !== 0 || s.tiv !== 0)
                .sort((a, b) => parseInt(a.year) - parseInt(b.year));

            loading = false;
            setTimeout(renderChart, 500); 
        } catch (e) {
            console.error("Error en las APIs:", e);
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
                    ['Temperatura (API Agricultura)', ...stats.map(s => s.temp)],
                    ['Exportaciones (API Comercio)', ...stats.map(s => s.tiv)]
                ],
                type: 'area-step', // Estilo no lineal (escalonado)
                axes: {
                    'Exportaciones (API Comercio)': 'y2' // Eje derecho para exportaciones
                }
            },
            axis: {
                x: { type: 'category', label: 'Evolución por Años' },
                y: { label: 'Temperatura ºC', tick: { format: d => d + "º" } },
                y2: { show: true, label: 'Volumen TIV (Comercio)' }
            },
            color: { pattern: ['#e74c3c', '#2980b9'] },
            grid: { y: { show: true } }
        });
    }

    onMount(() => {
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

<main style="padding: 20px; font-family: sans-serif;">
    <h1 style="text-align: center;">Integración Total: Evolución Clima y Comercio</h1>

    <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        {#if loading}
            <p style="text-align: center;">Cargando y uniendo datos de ambas fuentes...</p>
        {:else}
            <div bind:this={chartContainer} style="height: 450px;"></div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 0.9em;">
                <thead>
                    <tr style="background: #2c3e50; color: white;">
                        <th style="padding: 10px;">Año</th>
                        <th>Temp (Agricultura)</th>
                        <th>TIV (Exportaciones)</th>
                    </tr>
                </thead>
                <tbody>
                    {#each stats as s}
                        <tr style="border-bottom: 1px solid #eee; text-align: center;">
                            <td style="padding: 8px; font-weight: bold;">{s.year}</td>
                            <td style="color: #e74c3c;">{s.temp > 0 ? s.temp + ' ºC' : 'Sin datos'}</td>
                            <td style="color: #2980b9;">{s.tiv > 0 ? s.tiv.toLocaleString() : 'Sin datos'}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    </div>
</main>