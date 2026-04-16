<script>
    import { onMount, tick } from 'svelte';
    import 'leaflet/dist/leaflet.css';

    let loading = $state(true);
    let error = $state(null);

    // Coordenadas de los países
    const countryCoords = {
        bangladesh: { lat: 23.8103, lon: 90.4125, name: 'Bangladesh', consumo: 0 },
        mexico: { lat: 19.4326, lon: -99.1332, name: 'México', consumo: 0 },
        'united-states': { lat: 38.8951, lon: -77.0364, name: 'Estados Unidos', consumo: 0 },
        japan: { lat: 35.6895, lon: 139.6917, name: 'Japón', consumo: 0 },
        china: { lat: 39.9042, lon: 116.4074, name: 'China', consumo: 0 },
        'costa-rica': { lat: 9.9281, lon: -84.0907, name: 'Costa Rica', consumo: 0 },
        singapore: { lat: 1.3521, lon: 103.8198, name: 'Singapur', consumo: 0 }
    };

    function calcularConsumoTotal(registros) {
        const totalPorPais = {};
        registros.forEach(item => {
            const pais = item.country;
            if (!countryCoords[pais]) return;
            if (!totalPorPais[pais]) totalPorPais[pais] = 0;
            const sustancias = ['methyl_chloroform', 'methyl_bromide', 'hcfc', 'carbon_tetrachloride', 'halon', 'cfc'];
            let total = 0;
            sustancias.forEach(s => total += Number(item[s]) || 0);
            totalPorPais[pais] += total;
        });
        return totalPorPais;
    }

    onMount(async () => {
        try {
            // 1. Cargar datos de la API
            console.log('Fetching data...');
            const res = await fetch('/api/v2/ozone-depleting-substance-consumptions?t=' + Date.now());
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            let data = await res.json();
            const allData = Array.isArray(data) ? data : (data.data || []);
            
            if (allData.length === 0) {
                error = 'No hay datos disponibles.';
                loading = false;
                return;
            }

            const totalPorPais = calcularConsumoTotal(allData);
            console.log('Total por país:', totalPorPais);
            
            // 2. Esperar a que el DOM esté listo
            await tick();
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // 3. Obtener el contenedor por ID
            const container = document.getElementById('map-container-element');
            if (!container) {
                throw new Error('No se encontró el elemento del mapa');
            }
            
            // 4. Importar Leaflet y el plugin heat
            const L = await import('leaflet');
            await import('leaflet.heat');
            
            // 5. Inicializar el mapa
            const map = L.default.map(container).setView([20, 0], 2);
            L.default.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(map);
            
            // 6. Preparar datos para el heatmap
            // Formato: [lat, lon, intensidad]
            const heatData = [];
            const maxConsumo = Math.max(...Object.values(totalPorPais).filter(v => v > 0));
            
            for (const [pais, total] of Object.entries(totalPorPais)) {
                const coords = countryCoords[pais];
                if (coords && total > 0) {
                    // Normalizar intensidad (0-1) basado en el consumo máximo
                    const intensidad = total / maxConsumo;
                    heatData.push([coords.lat, coords.lon, intensidad]);
                }
            }
            
            console.log('Datos para heatmap:', heatData);
            
            // 7. Añadir capa de calor
            const heat = L.default.heatLayer(heatData, {
                radius: 45,
                blur: 25,
                maxZoom: 5,
                minOpacity: 0.3,
                gradient: {
                    0.0: '#2c7bb6',   // azul (bajo consumo)
                    0.3: '#abd9e9',
                    0.5: '#ffffbf',
                    0.7: '#fdae61',
                    0.9: '#d7191c',   // rojo (alto consumo)
                    1.0: '#b10026'
                }
            }).addTo(map);
            
            // 8. Opcional: añadir marcadores con popups informativos
            for (const [pais, total] of Object.entries(totalPorPais)) {
                const coords = countryCoords[pais];
                if (coords) {
                    const color = total > 0 ? '#ff4444' : '#ffaa00';
                    const marker = L.default.marker([coords.lat, coords.lon], {
                        icon: L.default.divIcon({
                            className: 'custom-marker',
                            html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
                            iconSize: [12, 12]
                        })
                    }).addTo(map);
                    
                    marker.bindPopup(`
                        <div style="font-family: Arial, sans-serif; min-width: 200px;">
                            <h3 style="margin: 0 0 10px 0; color: ${color};">${coords.name}</h3>
                            <hr style="margin: 5px 0;">
                            <p><strong>💰 Consumo total:</strong> ${total.toFixed(2)} toneladas</p>
                            <p><strong>📊 Intensidad:</strong> ${((total / maxConsumo) * 100).toFixed(1)}% del máximo</p>
                            <p><em>Suma de todas las sustancias y años</em></p>
                        </div>
                    `);
                }
            }
            
            loading = false;
            console.log('Heatmap inicializado correctamente');
            
        } catch (err) {
            console.error('Error en mapa:', err);
            error = err.message;
            loading = false;
        }
    });
</script>

<svelte:head>
    <title>Heatmap - Consumo de sustancias</title>
</svelte:head>

<div class="map-container">
    <h1>🔥 Mapa de calor - Consumo de sustancias agotadoras de ozono</h1>
    <p>Las zonas con colores más cálidos (rojo) indican mayor consumo total de sustancias.</p>
    
    <div id="map-container-element" class="map"></div>
    
    <div class="legend">
        <h4>Leyenda de intensidad</h4>
        <div class="gradient-bar"></div>
        <div class="legend-labels">
            <span>Bajo</span>
            <span style="float: right">Alto</span>
        </div>
        <div class="legend-colors">
            <span style="background: #2c7bb6;"></span>
            <span style="background: #abd9e9;"></span>
            <span style="background: #ffffbf;"></span>
            <span style="background: #fdae61;"></span>
            <span style="background: #d7191c;"></span>
            <span style="background: #b10026;"></span>
        </div>
        <p class="legend-note">* Los círculos blancos indican la ubicación exacta de cada país</p>
    </div>
    
    {#if loading}
        <div class="loading-overlay">
            <div class="spinner"></div>
            <p>Cargando mapa de calor...</p>
        </div>
    {/if}
    
    {#if error}
        <div class="error">Error: {error}</div>
    {/if}
</div>

<style>
    .map-container {
        max-width: 1200px;
        margin: 2rem auto;
        padding: 1rem;
        position: relative;
    }
    h1 {
        text-align: center;
        color: #1e88e5;
    }
    .map {
        width: 100%;
        height: 600px;
        border-radius: 1rem;
        border: 1px solid #ccc;
        z-index: 1;
    }
    
    /* Leyenda */
    .legend {
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 12px 18px;
        border-radius: 8px;
        position: absolute;
        bottom: 20px;
        right: 20px;
        z-index: 10;
        font-size: 12px;
        backdrop-filter: blur(5px);
        min-width: 180px;
        font-family: Arial, sans-serif;
    }
    .legend h4 {
        margin: 0 0 8px 0;
        text-align: center;
        font-size: 14px;
    }
    .gradient-bar {
        height: 20px;
        background: linear-gradient(to right, #2c7bb6, #abd9e9, #ffffbf, #fdae61, #d7191c, #b10026);
        border-radius: 4px;
        margin: 8px 0 4px 0;
    }
    .legend-labels {
        font-size: 11px;
        margin-bottom: 8px;
    }
    .legend-colors {
        display: flex;
        gap: 2px;
        margin-top: 5px;
    }
    .legend-colors span {
        flex: 1;
        height: 8px;
        border-radius: 2px;
    }
    .legend-note {
        font-size: 10px;
        margin: 8px 0 0 0;
        opacity: 0.7;
        text-align: center;
    }
    
    /* Marcador personalizado */
    :global(.custom-marker) {
        background: transparent !important;
        border: none !important;
    }
    
    /* Loading overlay */
    .loading-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 1.5rem 2rem;
        border-radius: 1rem;
        text-align: center;
        z-index: 20;
        backdrop-filter: blur(5px);
        min-width: 220px;
    }
    .loading-overlay p {
        margin: 0;
        font-size: 1rem;
    }
    .spinner {
        width: 40px;
        height: 40px;
        margin: 0 auto 10px auto;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .error {
        text-align: center;
        padding: 2rem;
        font-size: 1.2rem;
        color: #e53935;
        background: white;
        border-radius: 1rem;
        margin-top: 1rem;
    }
</style>