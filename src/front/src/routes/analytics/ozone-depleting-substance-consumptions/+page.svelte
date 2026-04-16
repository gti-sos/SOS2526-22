    <script>
        import { onMount } from 'svelte';

        onMount(async () => {
            const Highcharts = (await import('highcharts')).default;
            const TreemapModule = (await import('highcharts/modules/treemap')).default;
            const AccessibilityModule = (await import('highcharts/modules/accessibility')).default;

            // @ts-ignore
            if (typeof TreemapModule === 'function') TreemapModule(Highcharts);
            // @ts-ignore
            if (typeof AccessibilityModule === 'function') AccessibilityModule(Highcharts);

            const res = await fetch('/api/v1/ozone-depleting-substance-consumptions');
            const datos = await res.json();

            // @ts-ignore
            const datosValidos = datos.filter(d => d.country !== 'world' && d.country !== 'asia');

            const sustancias = [
                { key: 'hcfc', nombre: 'HCFC', colorPos: '#AED6F1', colorNeg: '#c0392b' },
                { key: 'cfc', nombre: 'CFC', colorPos: '#F1948A', colorNeg: '#c0392b' },
                { key: 'methyl_bromide', nombre: 'Bromuro de metilo', colorPos: '#A9DFBF', colorNeg: '#c0392b' },
                { key: 'methyl_chloroform', nombre: 'Metilcloroformo', colorPos: '#FAD7A0', colorNeg: '#c0392b' },
                { key: 'carbon_tetrachloride', nombre: 'Tetracloruro', colorPos: '#D7BDE2', colorNeg: '#c0392b' },
                { key: 'halon', nombre: 'Halón', colorPos: '#A2D9CE', colorNeg: '#c0392b' }
            ];

            const MIN_VISUAL = 8;
            // @ts-ignore
            const treeData = [];

            // @ts-ignore
            datosValidos.forEach((d) => {
                const id = `${d.country}_${d.year}`;
                const label = `${d.country} (${d.year})`;

                const valores = sustancias.map(s => ({
                    ...s,
                    val: Number(d[s.key]) || 0
                }));

                const totalAbs = valores.reduce((sum, s) => sum + Math.abs(s.val), 0);

                const tooltipDetalle = valores.map(s => {
                    const pct = totalAbs > 0 ? ((Math.abs(s.val) / totalAbs) * 100).toFixed(1) : '0.0';
                    const signo = s.val < 0 ? '⚠️ ' : '';
                    return `${signo}${s.nombre}: <b>${s.val.toLocaleString()} ton</b> (${pct}%)`;
                }).join('<br>');

                treeData.push({ id, name: label, tooltipDetalle, color: '#ffffff' });
                
                const presentes = valores.filter(s => s.val !== 0);
                const totalMinimos = presentes.length * MIN_VISUAL;
                const espacioRestante = Math.max(0, 100 - totalMinimos);

                presentes.forEach(s => {
                    const pctReal = totalAbs > 0 ? (Math.abs(s.val) / totalAbs) * 100 : 0;
                    const pctVisual = MIN_VISUAL + (pctReal / 100) * espacioRestante;
                    const esNegativo = s.val < 0;

                    treeData.push({
                        name: esNegativo ? `${s.nombre} (neg.)` : s.nombre,
                        parent: id,
                        value: Math.round(pctVisual * 10) / 10,
                        valorReal: s.val,
                        pctReal: pctReal.toFixed(1),
                        color: esNegativo ? s.colorNeg : s.colorPos,
                        esNegativo
                    });
                });
            });

            // @ts-ignore
            Highcharts.chart('chart-container', {
                series: [{
                    type: 'treemap',
                    allowTraversingTree: true,
                    alternateStartingDirection: true,
                    dataLabels: {
                        format: '{point.name}',
                        style: { textOutline: 'none', fontWeight: 'normal' }
                    },
                    borderRadius: 3,
                    nodeSizeBy: 'leaf',
                    states: {
                        hover: { enabled: false },
                        inactive: { enabled: false }
                    },
                    levels: [{
                        level: 1,
                        layoutAlgorithm: 'sliceAndDice',
                        groupPadding: 6,
                        dataLabels: {
                            headers: true,
                            enabled: true,
                            style: {
                                fontSize: '0.8em',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                color: '#000000',
                            }
                        },
                        borderRadius: 3,
                        borderWidth: 4,
                        borderColor: '#000',
                    }, {
                        level: 2,
                        borderWidth: 1,
                        borderColor: '#000',
                        dataLabels: { enabled: true, inside: true }
                    }],
                    // @ts-ignore
                    data: treeData
                }],
                title: { text: 'Consumo de Sustancias que Agotan el Ozono por País', align: 'left' },
                subtitle: { text: 'Haz clic en un país para ver el detalle. Los valores en rojo son negativos.', align: 'left' },
                tooltip: {
                    formatter: function() {
                        // @ts-ignore
                        if (this.point.parent) {
                            // @ts-ignore
                            const signo = this.point.esNegativo ? '<br>⚠️ Valor negativo' : '';
                            // @ts-ignore
                            return `<b>${this.point.parent.split('_')[0]}</b> — ${this.point.name}<br>
                                    Porcentaje real: <b>${this.
    // @ts-ignore
                                    point.pctReal}%</b><br>
                                    Valor real: <b>${this.
    // @ts-ignore
                                    point.valorReal.toLocaleString()} toneladas</b>
                                    ${signo}`;
                        } else {
                            // @ts-ignore
                            return `<b>${this.point.name}</b><br><br>${this.point.tooltipDetalle}`;
                        }
                    }
                },
                credits: { enabled: false }
            });

            // Leyenda manual
            const leyenda = document.getElementById('leyenda');
            if (leyenda) {
                sustancias.forEach(s => {
                    const item = document.createElement('div');
                    item.className = 'leyenda-item';
                    item.innerHTML = `<span class="leyenda-color" style="background:${s.colorPos};"></span> ${s.nombre}`;
                    leyenda.appendChild(item);
                });
                const sep = document.createElement('hr');
                sep.className = 'leyenda-sep';
                leyenda.appendChild(sep);
                const itemNeg = document.createElement('div');
                itemNeg.className = 'leyenda-item';
                itemNeg.innerHTML = `<span class="leyenda-color" style="background:#c0392b;"></span> <b>Valor negativo</b>`;
                leyenda.appendChild(itemNeg);
                const nota = document.createElement('p');
                nota.className = 'leyenda-nota';
                nota.innerText = 'Un valor negativo indica reducción en el consumo de esa sustancia.';
                leyenda.appendChild(nota);
            }
        });
    </script>

    <div class="container">
        <h1>Visualización Individual - Consumo de Sustancias que Agotan el Ozono</h1>
        <p class="subtitle">Haz clic en un país para explorar el detalle de cada sustancia</p>
        <div class="chart-wrapper">
            <div id="chart-container" class="chart"></div>
            <div class="leyenda-box">
                <strong class="leyenda-titulo">Sustancias</strong>
                <div id="leyenda"></div>
            </div>
        </div>
        <br>
    </div>

    <div class="map-link">
    <a href="/analytics/ozone-depleting-substance-consumptions/map" class="link-btn map-btn">
        Ver mapa geoespacial (Elena)
    </a>
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
            color: #0f1417;
            margin-bottom: 5px;
        }

        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 20px;
        }

        .chart-wrapper {
            display: flex;
            gap: 20px;
            align-items: flex-start;
        }

        .chart {
            flex: 1;
            height: 600px;
        }

        .leyenda-box {
            min-width: 210px;
            padding: 15px;
            background: #c6dbf0;
            border-radius: 8px;
            border: 1px solid #dee2e6;
            position: sticky;
            top: 20px;
        }

        .leyenda-titulo {
            display: block;
            margin-bottom: 10px;
            color: #0a0e10;
            font-size: 1rem;
        }

        .map-link {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
}

    .map-btn {
        color: #000;
    }

    .map-btn:hover {
        background: #81aed3;
        color: #000 }

        :global(.leyenda-item) {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 6px 0;
            font-size: 0.9rem;
        }

        :global(.leyenda-color) {
            width: 16px;
            height: 16px;
            border-radius: 3px;
            display: inline-block;
            border: 1px solid #ccc;
            flex-shrink: 0;
        }

        :global(.leyenda-sep) {
            margin: 10px 0;
            border-color: #ddd;
        }

        :global(.leyenda-nota) {
            font-size: 0.8rem;
            color: #666;
            margin-top: 8px;
            line-height: 1.4;
        }

    </style>