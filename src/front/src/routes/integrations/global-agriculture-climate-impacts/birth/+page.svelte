<script>
    import { onMount } from 'svelte';

    let container = $state();
    let loading = $state(true);
    let tableData = $state([]);

    function getRandomColor() {
        const colors = ["#4e79a7", "#e15759", "#76b7b2", "#59a14f", "#edc949", "#af7aa1", "#ff9da7", "#9c755f", "#bab0ab"];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    async function loadD3() {
        if (window.d3) return window.d3;
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/d3@7";
            script.onload = () => resolve(window.d3);
            document.head.appendChild(script);
        });
    }

    async function init() {
        const d3 = await loadD3();
        
        // 1. Cargamos datos iniciales en la API de agricultura por si está vacía
        await fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts/loadInitialData");

        // 2. Ahora pedimos los datos reales (arrays)
        const [r1, r2] = await Promise.all([
            fetch("https://sos2526-12.onrender.com/api/v2/birth-death-growth-rates"),
            fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts")
        ]);

        const data1 = await r1.json();
        const data2 = await r2.json();

        // 3. Validación: Comprobamos que sean arrays antes de usar .map
        const cleanData1 = Array.isArray(data1) ? data1 : [];
        const cleanData2 = Array.isArray(data2) ? data2 : [];

        tableData = [
            ...cleanData1.map(d => ({
                label: d.country_name || d.country,
                value: parseFloat(d.growth_rate) || 0.1, // Valor mínimo para que se vea la burbuja
                group: 'Demografía',
                color: getRandomColor()
            })),
            ...cleanData2.map(d => ({
                label: d.country,
                value: parseFloat(d.average_temperature_c) || 0.1,
                group: 'Agricultura',
                color: getRandomColor()
            }))
        ].filter(d => d.label);

        loading = false;
        // Pequeño delay para asegurar que el contenedor DOM esté listo
        setTimeout(() => renderChart(d3, tableData), 50);
    }

    function renderChart(d3, data) {
        if (!container || data.length === 0) return;
        const width = container.clientWidth;
        const height = 500;

        d3.select(container).selectAll("*").remove();

        const tooltip = d3.select("body").append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "#333")
            .style("color", "#fff")
            .style("padding", "5px 10px")
            .style("border-radius", "5px")
            .style("font-size", "12px")
            .style("z-index", "10");

        const svg = d3.select(container).append("svg")
            .attr("width", width).attr("height", height);

        const simulation = d3.forceSimulation(data)
            .force("x", d3.forceX(width / 2).strength(0.05))
            .force("y", d3.forceY(height / 2).strength(0.05))
            .force("collide", d3.forceCollide(d => Math.sqrt(Math.abs(d.value)) * 15 + 5)); // Ajustado el multiplicador

        const node = svg.append("g")
            .selectAll("circle")
            .data(data)
            .join("circle")
            .attr("r", d => Math.sqrt(Math.abs(d.value)) * 15)
            .attr("fill", d => d.color)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible").text(`${d.label}: ${d.value}`);
            })
            .on("mousemove", (event) => {
                tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => tooltip.style("visibility", "hidden"));

        simulation.on("tick", () => {
            node.attr("cx", d => d.x).attr("cy", d => d.y);
        });
    }

    onMount(init);
</script>

<div class="card">
    <h2>Visualización de Burbujas Dinámicas</h2>
    <p style="text-align: center; color: #666;">Pasa el ratón sobre las burbujas para ver el dato</p>

    {#if loading}
        <div class="loader-container">
            <div class="spinner"></div>
            <p>Cargando simulación y datos...</p>
        </div>
    {:else}
        <div bind:this={container} class="chart-area"></div>

        <section class="table-section">
            <h3>Datos Detallados</h3>
            <div class="table-scroll">
                <table>
                    <thead>
                        <tr>
                            <th>País</th>
                            <th>Categoría</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each tableData as item}
                            <tr>
                                <td>{item.label}</td>
                                <td><span class="dot" style="background: {item.color}"></span> {item.group}</td>
                                <td><strong>{item.value}</strong></td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </section>
    {/if}
</div>

<style>
    .card { background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 900px; margin: 20px auto; font-family: sans-serif; }
    h2 { text-align: center; color: #333; }
    .chart-area { width: 100%; height: 500px; background: #f9f9f9; border-radius: 10px; margin-bottom: 20px; border: 1px solid #eee; }
    
    .loader-container { text-align: center; padding: 50px; }
    .spinner { 
        width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; 
        border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .table-section { margin-top: 20px; }
    .table-scroll { max-height: 300px; overflow-y: auto; border: 1px solid #eee; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f4f4f4; padding: 12px; position: sticky; top: 0; z-index: 1; }
    td { padding: 10px; border-bottom: 1px solid #eee; text-align: center; }
    
    .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; }
</style>