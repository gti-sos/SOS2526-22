<svelte:head>
    <title>Integración: Impacto vs Externas - SOS2526</title>
</svelte:head>

<main class="container">
    <header class="header">
        <h1>Integraciones</h1>
        <p class="subtitle">Análisis cruzado de datos en tiempo real</p>
    </header>

    <section class="team-section">
        <h2>🔗 Conexiones de Datos</h2>

        <div class="cards-grid">
            <!-- Integración Interna -->
            <div class="member-card card-integration">
                <h3>Impacto Agrícola vs Exportaciones</h3>
                <p class="data-source">Comparativa entre módulos del grupo:<br>
                    <code>/global-agriculture-climate-impacts</code><br>
                    <code>/exportations-stats</code>
                </p>
                <div class="links">
                    <a href="/integrations/global-agriculture-climate-impacts/exportations-stats" class="link-btn main-btn">
                        📊 Ver gráfica de integración
                    </a>
                </div>
            </div>

            <!-- SpaceX -->
            <div class="member-card card-integration">
                <h3>Impacto Agrícola vs SpaceX</h3>
                <p class="data-source">Datos externos de lanzamientos:<br>
                    <code>/global-agriculture-climate-impacts</code><br>
                    <code>api.spacexdata.com/v4/launches</code>
                </p>
                <div class="links">
                    <a href="/integrations/global-agriculture-climate-impacts/spacex" class="link-btn main-btn">
                        📊 Ver gráfica de integración
                    </a>
                </div>
            </div>

            <!-- Adobe -->
            <div class="member-card card-integration">
                <h3>Impacto Agrícola vs Adobe</h3>
                <p class="data-source">Integración mediante API Adobe:<br>
                    <code>/global-agriculture-climate-impacts</code><br>
                    <code>adobe.io/apis</code>
                </p>
                <div class="links">
                    <a href="/integrations/global-agriculture-climate-impacts/adobe" class="link-btn main-btn">
                        📊 Ver gráfica de integración
                    </a>
                </div>
            </div>
        </div>

        <div class="cards-grid">
            <!-- AdaFruit -->
            <div class="member-card card-integration">
                <h3>Impacto Agrícola vs AdaFruit</h3>
                <p class="data-source">Sensores y datos IoT:<br>
                    <code>/global-agriculture-climate-impacts</code><br>
                    <code>io.adafruit.com/api</code>
                </p>
                <div class="links">
                    <a href="/integrations/global-agriculture-climate-impacts/adafruit" class="link-btn main-btn">
                        📊 Ver gráfica de integración
                    </a>
                </div>
            </div>

            <!-- Cheaters -->
            <div class="member-card card-integration">
                <h3>Impacto Agrícola vs Cheaters</h3>
                <p class="data-source">API Externa de terceros:<br>
                    <code>/global-agriculture-climate-impacts</code><br>
                    <code>api.cheaters.com/v1</code>
                </p>
                <div class="links">
                    <a href="/integrations/global-agriculture-climate-impacts/cheaters" class="link-btn main-btn">
                        📊 Ver gráfica de integración
                    </a>
                </div>
            </div>
        </div>
    </section>
</main>

<style>
    :root {
        --primary: #2085d8;
        --accent: #d8206d; 
        --bg: #f8f9fa;
        --text: #333;
    }

    .container {
        max-width: 1100px;
        margin: 0 auto;
        padding: 40px 20px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: var(--text);
    }

    .header { text-align: center; margin-bottom: 50px; }
    .header h1 { font-size: 2.5rem; color: var(--primary); margin-bottom: 10px; }
    .subtitle { font-size: 1.2rem; color: #666; }

    .team-section h2 { text-align: center; margin-bottom: 30px; }

    .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 25px;
        margin-bottom: 25px;
        justify-items: center;
    }

    .member-card {
        background: white;
        padding: 30px 25px;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        border-top: 5px solid var(--accent);
        width: 100%;
        display: flex;
        flex-direction: column;
        transition: transform 0.3s ease;
    }

    .member-card:hover {
        transform: translateY(-5px);
    }

    .member-card h3 { margin-top: 0; color: var(--accent); font-size: 1.3rem; }

    .data-source { font-size: 0.9rem; color: #555; margin-bottom: 20px; flex-grow: 1; }
    .data-source code {
        background: #f0f0f0;
        padding: 4px 8px;
        border-radius: 4px;
        display: block;
        margin-top: 5px;
        font-size: 0.8rem;
        color: #d63384;
    }

    .link-btn {
        text-decoration: none;
        background: var(--accent);
        color: white;
        padding: 12px;
        border-radius: 6px;
        text-align: center;
        font-weight: 600;
        display: block;
        transition: all 0.2s;
    }

    .link-btn:hover {
        opacity: 0.9;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
</style>