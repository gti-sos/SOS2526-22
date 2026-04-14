<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let map;
    let stats = [];

    // Diccionario de coordenadas básicas para que los países se ubiquen en el mapa
    const countryCoords = {
        "spain": [40.4637, -3.7492],
        "france": [46.2276, 2.2137],
        "italy": [41.8719, 12.5674],
        "germany": [51.1657, 10.4515],
        "poland": [51.9194, 19.1451],
        "finland": [61.9241, 25.7482],
        "sweden": [60.1282, 18.6435],
        "greece": [39.0742, 21.8243],
        "norway": [60.4720, 8.4689],
        "denmark": [56.2639, 9.5018]
    };

    async function initMap() {
        if (!browser) return;

        // 1. Importar Leaflet dinámicamente
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        // 2. Cargar datos de tu API
        const res = await fetch('/api/v2/global-agriculture-climate-impacts');
        if (res.ok) {
            stats = await res.json();

            // 3. Crear el mapa centrado en Europa
            map = L.map('map').setView([50, 10], 4);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            // 4. Añadir marcadores por cada dato
            stats.forEach(data => {
                const countryName = data.country.toLowerCase();
                const coords = countryCoords[countryName];

                if (coords) {
                    const temp = data.average_temperature_c || data.temp || 0;
                    const prec = data.total_precipitation_mm || data.prec || 0;

                    L.marker(coords).addTo(map)
                        .bindPopup(`
                            <b>${data.country} (${data.year})</b><br>
                            Temp: ${temp} ºC<br>
                            Prec: ${prec} mm
                        `);
                }
            });
        }
    }

    onMount(initMap);
</script>

<svelte:head>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<main>
    <h1>Mapa Geoespacial de Agricultura</h1>
    <p>Visualización de datos por ubicación geográfica.</p>

    <div id="map"></div>

    <div class="actions">
        <a href="/analytics/global-agriculture-climate-impacts">← Volver a la Gráfica</a>
    </div>
</main>

<style>
    main { text-align: center; padding: 20px; font-family: sans-serif; }
    
    #map {
        width: 100%;
        max-width: 1000px;
        height: 600px;
        margin: 20px auto;
        border: 2px solid #333;
        border-radius: 10px;
        z-index: 1; /* Para que no tape los menús */
    }

    .actions { margin-top: 20px; }
    a { color: #007bff; text-decoration: none; font-weight: bold; }
</style>