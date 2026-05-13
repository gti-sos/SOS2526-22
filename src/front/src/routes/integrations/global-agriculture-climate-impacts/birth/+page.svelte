<script>
    import { onMount } from 'svelte';

    let container = $state();
    let loading = $state(true);
    let tableData = $state([]);

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
        
        // 1. Carga inicial de agricultura
        await fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts/loadInitialData");

        try {
            // 2. Fetch de ambas APIs
            const [resBirth, resAgri] = await Promise.all([
                fetch("https://sos2526-12.onrender.com/api/v2/birth-death-growth-rates/loadInitialData"),
                fetch("https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts")
            ]);

            const dataBirth = await resBirth.json();
            const dataAgri = await resAgri.json();

            // 3. Procesar datos de BIRTH (Usa crude_birth_rate para el tamaño)
            const birthNodes = (Array.isArray(dataBirth) ? dataBirth : []).map(d => {
                const birthVal = parseFloat(d.crude_birth_rate || d.growth_rate || 0);
                return {
                    label: d.country_name || d.country || "Desconocido",
                    value: birthVal,
                    info: `Natalidad: ${birthVal}`,
                    year: d.year,
                    group: "DEMOGRAFÍA",
                    color: "#3182ce", // Azul
                    // Ajustamos el radio para que la tasa de natalidad sea muy visible
                    radius: (birthVal * 3) + 15 
                };
            });

            // 4. Procesar datos de AGRICULTURA
            const agriNodes = (Array.isArray(dataAgri) ? dataAgri : []).map(d => {
                const tempVal = parseFloat(d.average_temperature_c || 0);
                return {
                    label: d.country || "Desconocido",
                    value: tempVal,
                    info: `Temp: ${tempVal}ºC`,
                    year: d.year,
                    group: "AGRICULTURA",
                    color: "#e53e3e", // Rojo
                    radius: (tempVal * 1.5) + 10
                };
            });

            // Unimos todo en una sola nube
            tableData = [...birthNodes, ...agriNodes].filter(d => d.value !== 0);

            loading = false;
            setTimeout(() => renderChart(d3, tableData), 100);

        } catch (error) {
            console.error("Error:", error);
            loading = false;
        }
    }

    function renderChart(d3, data) {
        if (!container || data.length === 0) return;
        const width = container.clientWidth;
        const height = 550;

        d3.select(container).selectAll("*").remove();
        const svg = d3.select(container).append("svg").attr("width", width).attr("height", height);

        const tooltip = d3.select("body").append("div")
            .style("position", "absolute").style("visibility", "hidden")
            .style("background", "#2d3748").style("color", "#fff")
            .style("padding", "8px").style("border-radius", "5px").style("font-size", "12px");

        const simulation = d3.forceSimulation(data)
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("charge", d3.forceManyBody().strength(5))
            .force("collide", d3.forceCollide(d => d.radius + 2));

        const nodes = svg.append("g")
            .selectAll("circle")
            .data(data)
            .join("circle")
            .attr("r", d => d.radius)
            .attr("fill", d => d.color)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                       .html(`<b>${d.group}</b><br>${d.label} (${d.year})<br>${d.info}`);
            })
            .on("mousemove", (event) => {
                tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => tooltip.style("visibility", "hidden"));

        simulation.on("tick", () => {
            nodes.attr("cx", d => d.x).attr("cy", d => d.y);
        });
    }

    onMount(init);
</script>

<div class="card">
    <h2>Relación Global: Natalidad vs Clima</h2>
    <div class="legend">
        <span class="badge blue">API Birth (Crude Birth Rate)</span>
        <span class="badge red">API Agri (Temperatura ºC)</span>
    </div>

    {#if loading}
        <p style="text-align:center;">Cargando nube de datos...</p>
    {:else}
        <div bind:this={container} class="chart-container"></div>

        <div class="table-box">
            <table>
                <thead>
                    <tr>
                        <th>Categoría</th>
                        <th>País</th>
                        <th>Año</th>
                        <th>Dato Clave</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tableData as item}
                        <tr>
                            <td><span class="dot" style="background:{item.color}"></span> {item.group}</td>
                            <td>{item.label}</td>
                            <td>{item.year}</td>
                            <td><strong>{item.info}</strong></td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<style>
    .card { background: #fff; padding: 25px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 900px; margin: auto; font-family: sans-serif; }
    h2 { text-align: center; }
    .legend { display: flex; justify-content: center; gap: 15px; margin-bottom: 20px; }
    .badge { padding: 5px 12px; border-radius: 20px; color: white; font-size: 0.8rem; font-weight: bold; }
    .blue { background: #3182ce; }
    .red { background: #e53e3e; }
    .chart-container { width: 100%; height: 550px; background: #f9fafb; border-radius: 10px; border: 1px solid #eee; }
    .table-box { margin-top: 25px; max-height: 300px; overflow-y: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; padding: 10px; position: sticky; top: 0; }
    td { padding: 8px; border-bottom: 1px solid #eee; text-align: center; }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; }
</style>