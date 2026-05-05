<svelte:head>
    <title>Integración: Impacto vs Externas - SOS2526</title>
</svelte:head>

<main class="container">
    <header class="header">
        <div class="badge">SOS2526 - Grupo 13</div>
        <h1>Integraciones de Datos</h1>
        <p class="subtitle">Análisis cruzado mediante el consumo de APIs internas y externas</p>
    </header>

    <section class="team-section">
        <div class="section-title">
            <span>🔗</span>
            <h2>Conexiones Disponibles</h2>
        </div>

        <div class="cards-grid">
            <!-- Integración Interna -->
            <div class="member-card card-internal">
                <div class="card-header">
                    <span class="icon">📈</span>
                    <h3>Impacto Agrícola vs Exportaciones</h3>
                </div>
                <div class="card-content">
                    <p>Comparativa de módulos internos del proyecto para analizar tendencias locales.</p>
                    <div class="endpoints">
                        <code>/global-agriculture-climate-impacts</code>
                        <code>/exportations-stats</code>
                    </div>
                </div>
                <a href="/integrations/global-agriculture-climate-impacts/exportations-stats" class="link-btn">
                    Ver Análisis Gráfico
                </a>
            </div>

            <!-- SpaceX -->
            <div class="member-card">
                <div class="card-header">
                    <span class="icon">🚀</span>
                    <h3>Impacto Agrícola vs SpaceX</h3>
                </div>
                <div class="card-content">
                    <p>Correlación entre el impacto climático y la frecuencia de lanzamientos espaciales.</p>
                    <div class="endpoints">
                        <code>/agriculture-climate-impacts</code>
                        <code>api.spacexdata.com/v4/launches</code>
                    </div>
                </div>
                <a href="/integrations/global-agriculture-climate-impacts/spacex" class="link-btn">
                    Ver Análisis Gráfico
                </a>
            </div>

            <!-- Adobe -->
            <div class="member-card">
                <div class="card-header">
                    <span class="icon">🎨</span>
                    <h3>Impacto Agrícola vs Adobe</h3>
                </div>
                <div class="card-content">
                    <p>Visualización de métricas creativas mediante la API de Adobe IO.</p>
                    <div class="endpoints">
                        <code>/agriculture-climate-impacts</code>
                        <code>adobe.io/apis</code>
                    </div>
                </div>
                <a href="/integrations/global-agriculture-climate-impacts/adobe" class="link-btn">
                    Ver Análisis Gráfico
                </a>
            </div>

            <!-- AdaFruit -->
            <div class="member-card">
                <div class="card-header">
                    <span class="icon">📟</span>
                    <h3>Impacto Agrícola vs AdaFruit</h3>
                </div>
                <div class="card-content">
                    <p>Integración con datos provenientes de sensores y telemetría IoT.</p>
                    <div class="endpoints">
                        <code>/agriculture-climate-impacts</code>
                        <code>io.adafruit.com/api</code>
                    </div>
                </div>
                <a href="/integrations/global-agriculture-climate-impacts/adafruit" class="link-btn">
                    Ver Análisis Gráfico
                </a>
            </div>

            <!-- Cheaters -->
            <div class="member-card">
                <div class="card-header">
                    <span class="icon">🎯</span>
                    <h3>Impacto Agrícola vs Cheaters</h3>
                </div>
                <div class="card-content">
                    <p>Consumo de datos externos de terceros mediante proxy CORS.</p>
                    <div class="endpoints">
                        <code>/agriculture-climate-impacts</code>
                        <code>api.cheaters.com/v1</code>
                    </div>
                </div>
                <a href="/integrations/global-agriculture-climate-impacts/cheaters" class="link-btn">
                    Ver Análisis Gráfico
                </a>
            </div>

            <!-- Recreation (Corregido) -->
            <div class="member-card">
                <div class="card-header">
                    <span class="icon">🏕️</span>
                    <h3>Impacto Agrícola vs Recreación</h3>
                </div>
                <div class="card-content">
                    <p>Datos sobre parques nacionales y actividades al aire libre vs Clima.</p>
                    <div class="endpoints">
                        <code>/agriculture-climate-impacts</code>
                        <code>ridb.recreation.gov/api</code>
                    </div>
                </div>
                <a href="/integrations/global-agriculture-climate-impacts/recreation" class="link-btn">
                    Ver Análisis Gráfico
                </a>
            </div>

             <div class="member-card">
                <div class="card-header">
                    <span class="icon">🏕️</span>
                    <h3>Impacto Agrícola vs Recreación</h3>
                </div>
                <div class="card-content">
                    <p>Datos sobre parques nacionales y actividades al aire libre vs Clima.</p>
                    <div class="endpoints">
                        <code>/agriculture-climate-impacts</code>
                        <code>ridb.recreation.gov/api</code>
                    </div>
                </div>
                <a href="/integrations/global-agriculture-climate-impacts/ajm" class="link-btn">
                    Ver Análisis Gráfico
                </a>
            </div>




















        </div>
    </section>
</main>

<style>
    :root {
        --primary: #2563eb;
        --primary-dark: #1e40af;
        --accent: #ec4899;
        --bg: #f3f4f6;
        --card-bg: #ffffff;
        --text-main: #1f2937;
        --text-muted: #6b7280;
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 60px 20px;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        background-color: var(--bg);
        min-height: 100vh;
    }

    /* Header Styles */
    .header { text-align: center; margin-bottom: 60px; }
    
    .badge {
        display: inline-block;
        background: #dbeafe;
        color: var(--primary);
        padding: 4px 12px;
        border-radius: 99px;
        font-size: 0.85rem;
        font-weight: 700;
        margin-bottom: 16px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .header h1 { 
        font-size: 3rem; 
        font-weight: 800; 
        color: var(--text-main); 
        margin: 0; 
        letter-spacing: -1px;
    }

    .subtitle { 
        font-size: 1.25rem; 
        color: var(--text-muted); 
        max-width: 600px; 
        margin: 15px auto 0;
    }

    /* Section Styles */
    .section-title {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 40px;
    }

    .section-title h2 {
        font-size: 1.75rem;
        color: var(--text-main);
        margin: 0;
    }

    .section-title span { font-size: 1.5rem; }

    /* Grid System */
    .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 30px;
    }

    /* Card Styles */
    .member-card {
        background: var(--card-bg);
        border-radius: 20px;
        padding: 32px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid rgba(0,0,0,0.05);
    }

    .member-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    /* Estilo especial para la primera tarjeta (interna) */
    .card-internal {
        border-top: 6px solid var(--primary);
    }

    .member-card:not(.card-internal) {
        border-top: 6px solid var(--accent);
    }

    .card-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 20px;
    }

    .icon {
        font-size: 1.5rem;
        background: #f9fafb;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
    }

    .member-card h3 { 
        margin: 0; 
        font-size: 1.2rem; 
        line-height: 1.2;
        color: var(--text-main);
    }

    .card-content {
        flex-grow: 1;
        margin-bottom: 25px;
    }

    .card-content p {
        color: var(--text-muted);
        font-size: 0.95rem;
        line-height: 1.5;
        margin-bottom: 15px;
    }

    .endpoints {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    code {
        background: #f1f5f9;
        color: #ef4444;
        padding: 6px 10px;
        border-radius: 8px;
        font-size: 0.75rem;
        font-family: 'Fira Code', monospace;
        word-break: break-all;
    }

    /* Button Styles */
    .link-btn {
        text-decoration: none;
        background: #1f2937;
        color: white;
        padding: 14px;
        border-radius: 12px;
        text-align: center;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.2s;
    }

    .link-btn:hover {
        background: var(--text-main);
        filter: brightness(1.2);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    /* Responsive */
    @media (max-width: 768px) {
        .header h1 { font-size: 2.2rem; }
        .cards-grid { grid-template-columns: 1fr; }
    }
</style>