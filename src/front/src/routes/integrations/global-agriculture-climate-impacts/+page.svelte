<svelte:head>
    <title>Integración: Impacto vs Externas - SOS2526</title>
</svelte:head>

<main class="container">
    <header class="header">
        <div class="badge">SOS2526 - Grupo 22</div>
        <h1>Integraciones de Datos</h1>
        <p class="subtitle">Análisis cruzado mediante el consumo de APIs internas y externas</p>
    </header>

    <section class="team-section">
        <div class="section-title">
            <span>🔗</span>
            <h2>Conexiones Disponibles</h2>
        </div>

        <div class="cards-grid">
            <div class="member-card card-blue">
                <div class="card-header">
                    <span class="icon">📈</span>
                    <h3>Impacto Agrícola vs Exportaciones (COMPAÑERO 1)</h3>
                </div>
                <div class="card-content">
                    <p>Comparativa de módulos internos del proyecto para analizar tendencias locales de comercio.</p>
                    <div class="endpoints">
                        <code>/global-agriculture-climate-impacts</code>
                        <code>/exportations-stats</code>
                    </div>
                </div>
                <a href="/integrations/global-agriculture-climate-impacts/exportations-stats" class="link-btn">Ver Análisis Gráfico</a>
            </div>

            <div class="member-card card-space">
                <div class="card-header">
                    <span class="icon">🚀</span>
                    <h3>Impacto Agrícola vs SpaceX (EXTERNA)</h3>
                </div>
                <div class="card-content">
                    <p>Correlación entre el impacto climático y la frecuencia de lanzamientos espaciales de SpaceX.</p>
                    <div class="endpoints">
                        <code>/agriculture-climate-impacts</code>
                        <code>api.spacexdata.com/v4/launches</code>
                    </div>
                </div>
                <a href="/integrations/global-agriculture-climate-impacts/spacex" class="link-btn">Ver Análisis Gráfico</a>
            </div>

            <div class="member-card card-red">
                <div class="card-header">
                    <span class="icon">🎨</span>
                    <h3>Impacto Agrícola vs Adobe (EXTERNA)</h3>
                </div>
                <div class="card-content">
                    <p>Visualización de métricas creativas y consumo de stock mediante la API de Adobe IO.</p>
                    <div class="endpoints">
                        <code>/agriculture-climate-impacts</code>
                        <code>adobe.io/apis</code>
                    </div>
                </div>
                <a href="/integrations/global-agriculture-climate-impacts/adobe" class="link-btn">Ver Análisis Gráfico</a>
            </div>

            <div class="member-card card-green">
                <div class="card-header">
                    <span class="icon">📟</span>
                    <h3>Impacto Agrícola vs AdaFruit (EXTERNA)</h3>
                </div>
                <div class="card-content">
                    <p>Integración con datos provenientes de sensores y telemetría IoT en tiempo real.</p>
                    <div class="endpoints">
                        <code>/agriculture-climate-impacts</code>
                        <code>io.adafruit.com/api</code>
                    </div>
                </div>
                <a href="/integrations/global-agriculture-climate-impacts/adafruit" class="link-btn">Ver Análisis Gráfico</a>
            </div>

            <div class="member-card card-orange">
                <div class="card-header">
                    <span class="icon">🎯</span>
                    <h3>Impacto Agrícola vs Cheaters (COMPAÑERO 2)</h3>
                </div>
                <div class="card-content">
                    <p>Análisis de baneos en videojuegos online comparado con tendencias climáticas globales.</p>
                    <div class="endpoints">
                        <code>/agriculture-climate-impacts</code>
                        <code>api.cheaters.com/v1</code>
                    </div>
                </div>
                <a href="/integrations/global-agriculture-climate-impacts/cheaters" class="link-btn">Ver Análisis Gráfico</a>
            </div>

            <div class="member-card card-teal">
                <div class="card-header">
                    <span class="icon">🏕️</span>
                    <h3>Impacto Agrícola vs Recreación (COMPAÑERO 3)</h3>
                </div>
                <div class="card-content">
                    <p>Datos sobre parques nacionales y actividades al aire libre vs variables de temperatura.</p>
                    <div class="endpoints">
                        <code>/agriculture-climate-impacts</code>
                        <code>ridb.recreation.gov/api</code>
                    </div>
                </div>
                <a href="/integrations/global-agriculture-climate-impacts/recreation" class="link-btn">Ver Análisis Gráfico</a>
            </div>

            <div class="member-card card-purple">
                <div class="card-header">
                    <span class="icon">👶</span>
                    <h3>Impacto Agrícola vs Birth (COMPAÑERO 4)</h3>
                </div>
                <div class="card-content">
                    <p>Estudio de tasas de natalidad y crecimiento demográfico frente al cambio climático.</p>
                    <div class="endpoints">
                        <code>/agriculture-climate-impacts</code>
                        <code>/birth-death-growth-rates</code>
                    </div>
                </div>
                <a href="/integrations/global-agriculture-climate-impacts/birth" class="link-btn">Ver Análisis Gráfico</a>
            </div>

            <div class="member-card card-yellow">
                <div class="card-header">
                    <span class="icon">📢</span>
                    <h3>Impacto Agrícola vs Protests (COMPAÑERO 5)</h3>
                </div>
                <div class="card-content">
                    <p>Análisis de conflictos sociales y protestas en relación con la seguridad alimentaria.</p>
                    <div class="endpoints">
                        <code>/agriculture-climate-impacts</code>
                        <code>/protests-stats</code>
                    </div>
                </div>
                <a href="/integrations/global-agriculture-climate-impacts/protests" class="link-btn">Ver Análisis Gráfico</a>
            </div>
        </div>
    </section>
</main>

<style>
    :root {
        --bg: #f8fafc;
        --card-bg: #ffffff;
        --text-main: #0f172a;
        --text-muted: #64748b;
    }

    /* Paleta de Colores por Tarjeta */
    .card-blue   { --accent: #2563eb; }
    .card-space  { --accent: #1e293b; }
    .card-red    { --accent: #dc2626; }
    .card-green  { --accent: #16a34a; }
    .card-orange { --accent: #ea580c; }
    .card-teal   { --accent: #0d9488; }
    .card-purple { --accent: #9333ea; }
    .card-yellow { --accent: #ca8a04; }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 60px 20px;
        font-family: 'Inter', system-ui, sans-serif;
        background-color: var(--bg);
        min-height: 100vh;
    }

    .header { text-align: center; margin-bottom: 60px; }
    
    .badge {
        display: inline-block;
        background: #e2e8f0;
        color: #475569;
        padding: 4px 12px;
        border-radius: 99px;
        font-size: 0.85rem;
        font-weight: 700;
        margin-bottom: 16px;
    }

    .header h1 { font-size: 3rem; font-weight: 800; color: var(--text-main); margin: 0; }
    .subtitle { font-size: 1.25rem; color: var(--text-muted); margin: 15px auto 0; }

    .section-title { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 40px; }
    .section-title h2 { font-size: 1.75rem; color: var(--text-main); margin: 0; }

    .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 30px;
    }

    .member-card {
        background: var(--card-bg);
        border-radius: 20px;
        padding: 32px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        border-top: 6px solid var(--accent); /* Color dinámico */
    }

    .member-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .card-header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
    .icon { font-size: 1.5rem; background: #f1f5f9; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }

    .member-card h3 { margin: 0; font-size: 1.2rem; color: var(--text-main); }
    .card-content { flex-grow: 1; margin-bottom: 25px; }
    .card-content p { color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; }

    code {
        background: #f8fafc;
        color: var(--accent); /* El texto del código ahora hace juego con la tarjeta */
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-family: monospace;
        display: block;
        margin-top: 5px;
        border: 1px solid rgba(0,0,0,0.05);
    }

    .link-btn {
        text-decoration: none;
        background: var(--accent); /* Botón del color de la tarjeta */
        color: white;
        padding: 12px;
        border-radius: 12px;
        text-align: center;
        font-weight: 600;
        transition: opacity 0.2s;
    }

    .link-btn:hover { opacity: 0.9; }

    @media (max-width: 768px) {
        .header h1 { font-size: 2.2rem; }
        .cards-grid { grid-template-columns: 1fr; }
    }
</style>