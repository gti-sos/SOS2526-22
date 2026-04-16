<script>
    import { onMount } from 'svelte';

    onMount(async () => {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        const coordenadas = {
            'bangladesh': [23.7, 90.4],
            'mexico': [23.6, -102.6],
            'united-states': [37.1, -95.7],
            'japan': [36.2, 138.3],
            'china': [35.9, 104.2],
            'costa-rica': [9.7, -83.8],
            'singapore': [1.3, 103.8]
        };

        const map = L.map('map-container').setView([20, 0], 2);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const res = await fetch('/api/v1/ozone-depleting-substance-consumptions');
        const datos = await res.json();

        const datosValidos = datos.filter(d => coordenadas[d.country]);

        // Años mín y máx para normalizar el color
        const years = datosValidos.map(d => d.year);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);

        // Función para interpolar color según año (azul claro = antiguo, azul oscuro = reciente)
        function getColorByYear(year) {
            const t = (year - minYear) / (maxYear - minYear || 1);
            // De #AED6F1 (azul claro) a #1a237e (azul muy oscuro)
            const r = Math.round(174 + (26 - 174) * t);
            const g = Math.round(214 + (35 - 214) * t);
            const b = Math.round(241 + (126 - 241) * t);
            return `rgb(${r},${g},${b})`;
        }

        datosValidos.forEach(d => {
            const [lat, lng] = coordenadas[d.country];

            // Media de todas las sustancias (valores absolutos)
            const sustancias = [d.hcfc, d.cfc, d.methyl_bromide, d.methyl_chloroform, d.carbon_tetrachloride, d.halon];
            const media = sustancias.reduce((sum, v) => sum + Math.abs(v || 0), 0) / sustancias.length;
            const radio = Math.max(8, Math.min(50, Math.log(media + 1) * 3));

            const color = getColorByYear(d.year);
            const tieneNegativos = d.cfc < 0 || d.methyl_chloroform < 0 || d.carbon_tetrachloride < 0 || d.halon < 0;

            const circulo = L.circleMarker([lat, lng], {
                radius: radio,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.85
            });

            circulo.bindPopup(`
                <div style="font-family: system-ui; min-width: 200px;">
                    <h3 style="margin:0 0 8px; color:#263238; text-transform:capitalize;">
                        ${d.country} (${d.year})
                    </h3>
                    <p style="margin:0 0 8px; font-size:0.85rem; color:#555;">
                        Media de sustancias: <b>${media.toFixed(0)} ton</b>
                    </p>
                    <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                        <tr><td style="padding:2px 4px;"><b>HCFC</b></td><td style="padding:2px 4px; text-align:right;">${d.hcfc.toLocaleString()} ton</td></tr>
                        <tr style="background:#f5f5f5;"><td style="padding:2px 4px;"><b>CFC</b></td><td style="padding:2px 4px; text-align:right; color:${d.cfc < 0 ? '#c0392b' : '#000'};">${d.cfc.toLocaleString()} ton</td></tr>
                        <tr><td style="padding:2px 4px;"><b>Bromuro de metilo</b></td><td style="padding:2px 4px; text-align:right;">${d.methyl_bromide.toLocaleString()} ton</td></tr>
                        <tr style="background:#f5f5f5;"><td style="padding:2px 4px;"><b>Metilcloroformo</b></td><td style="padding:2px 4px; text-align:right; color:${d.methyl_chloroform < 0 ? '#c0392b' : '#000'};">${d.methyl_chloroform.toLocaleString()} ton</td></tr>
                        <tr><td style="padding:2px 4px;"><b>Tetracloruro</b></td><td style="padding:2px 4px; text-align:right; color:${d.carbon_tetrachloride < 0 ? '#c0392b' : '#000'};">${d.carbon_tetrachloride.toLocaleString()} ton</td></tr>
                        <tr style="background:#f5f5f5;"><td style="padding:2px 4px;"><b>Halón</b></td><td style="padding:2px 4px; text-align:right; color:${d.halon < 0 ? '#c0392b' : '#000'};">${d.halon.toLocaleString()} ton</td></tr>
                    </table>
                    ${tieneNegativos ? '<p style="color:#c0392b; font-size:0.8rem; margin:6px 0 0;">⚠️ Contiene valores negativos (reducción)</p>' : ''}
                </div>
            `);

            circulo.addTo(map);
        });

        // Leyenda
        const leyenda = L.control({ position: 'bottomright' });
        leyenda.onAdd = () => {
            const div = L.DomUtil.create('div');
            div.style.cssText = 'background:white; padding:12px; border-radius:8px; border:1px solid #ccc; font-family:system-ui; font-size:0.85rem;';
            div.innerHTML = `
                <strong style="display:block; margin-bottom:8px;">Leyenda</strong>
                <div style="margin-bottom:8px;">
                    <div style="display:flex; align-items:center; gap:8px; margin:4px 0;">
                        <span style="width:14px;height:14px;background:#AED6F1;border-radius:50%;display:inline-block;border:2px solid #fff;box-shadow:0 0 2px #999;"></span>
                        Dato más antiguo (${minYear})
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; margin:4px 0;">
                        <span style="width:14px;height:14px;background:rgb(26,35,126);border-radius:50%;display:inline-block;border:2px solid #fff;box-shadow:0 0 2px #999;"></span>
                        Dato más reciente (${maxYear})
                    </div>
                </div>
                <hr style="margin:8px 0; border-color:#eee;">
                <div style="color:#666; font-size:0.8rem;">
                    <b>Color:</b> año del dato<br>
                    <b>Tamaño:</b> media de sustancias
                </div>
            `;
            return div;
        };
        leyenda.addTo(map);
    });
</script>

<div class="container">
    <h1>Mapa de Consumo de Sustancias que Agotan el Ozono</h1>
    <p class="subtitle">Color según el año del dato · Tamaño según la media de sustancias · Clic para ver detalle</p>
    <div id="map-container" class="map"></div>
    <br>
    <a href="/analytics/ozone-depleting-substance-consumptions" class="volver">← Volver a la visualización individual</a>
</div>

<style>
    .container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 20px;
        font-family: system-ui;
    }

    h1 {
        text-align: center;
        color: #263238;
        margin-bottom: 5px;
    }

    .subtitle {
        text-align: center;
        color: #666;
        margin-bottom: 20px;
    }

    .map {
        width: 100%;
        height: 600px;
        border-radius: 12px;
        border: 1px solid #dee2e6;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .volver {
        display: block;
        text-align: center;
        color: #1e88e5;
        text-decoration: none;
        margin-top: 20px;
    }
</style>