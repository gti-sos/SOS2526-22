
<svelte:head>
    <title>SOS2526</title>
</svelte:head>

<main class="container">
    <header class="header">
        <h1>🚀 Proyecto SOS2526 - Grupo 22</h1>
        <p class="subtitle">Análisis del impacto climático y emisiones globales</p>
        
        <a href="https://github.com/gti-sos/SOS2526-22" target="_blank" class="btn-repo">
            📂 Repositorio de GitHub del Equipo
        </a>
    </header>

    <section class="team-section">
        <h2>👥 Equipo y Recursos de Datos</h2>

        <div class="cards-grid">
            <div class="member-card">
                <h3>Celia Leal Salvago</h3>
                <p class="data-source">Fuente: <br><code>global-agriculture-climate-impacts</code></p>
                <div class="links">
                    <a href="/global-agriculture-climate-impacts" class="link-btn main-btn">🖥️ Front-end Svelte</a>
                    
                    <div class="api-group">
                        <span class="api-label">API v1</span>
                        <div class="api-buttons">
                            <a href="/api/v1/global-agriculture-climate-impacts" target="_blank" class="link-btn outline small">🔗 URL Base</a>
                            <a href="/api/v1/global-agriculture-climate-impacts/docs" target="_blank" class="link-btn outline small">📚 Docs</a>
                        </div>
                    </div>

                    <div class="api-group">
                        <span class="api-label">API v2</span>
                        <div class="api-buttons">
                            <a href="/api/v2/global-agriculture-climate-impacts" target="_blank" class="link-btn outline small">🔗 URL Base</a>
                            <a href="/api/v2/global-agriculture-climate-impacts/docs" target="_blank" class="link-btn outline small">📚 Docs</a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="member-card">
                <h3>Elena Martínez Moreno</h3>
                <p class="data-source">Fuente: <br><code>ozone-depleting-substance-consumptions</code></p>
                <div class="links">
                    <a href="/ozone-depleting-substance-consumptions" class="link-btn main-btn">🖥️ Front-end Svelte</a>
                    
                    <div class="api-group">
                        <span class="api-label">API v1</span>
                        <div class="api-buttons">
                            <a href="/api/v1/ozone-depleting-substance-consumptions" target="_blank" class="link-btn outline small">🔗 URL Base</a>
                            <a href="/api/v1/ozone-depleting-substance-consumptions/docs" target="_blank" class="link-btn outline small">📚 Docs</a>
                        </div>
                    </div>

                    <div class="api-group">
                        <span class="api-label">API v2</span>
                        <div class="api-buttons">
                            <a href="/api/v2/ozone-depleting-substance-consumptions" target="_blank" class="link-btn outline small">🔗 URL Base</a>
                            <a href="/api/v2/ozone-depleting-substance-consumptions/docs" target="_blank" class="link-btn outline small">📚 Docs</a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="member-card">
                <h3>Julio Morales Vela</h3>
                <p class="data-source">Fuente: <br><code>co2-emission-gap-among-countries-clustering-pca</code></p>
                <div class="links">
                    <a href="/co2-emissions-stats" class="link-btn main-btn">🖥️ Front-end Svelte</a>
                    
                    <div class="api-group">
                        <span class="api-label">API v1</span>
                        <div class="api-buttons">
                            <a href="/api/v1/co2-emission-gap-among-countries-clustering-pca" target="_blank" class="link-btn outline small">🔗 URL Base</a>
                            <a href="/api/v1/co2-emission-gap-among-countries-clustering-pca/docs" target="_blank" class="link-btn outline small">📚 Docs</a>
                        </div>
                    </div>

                    <div class="api-group">
                        <span class="api-label">API v2</span>
                        <div class="api-buttons">
                            <a href="/api/v2/co2-emission-gap-among-countries-clustering-pca" target="_blank" class="link-btn outline small">🔗 URL Base</a>
                            <a href="/api/v2/co2-emission-gap-among-countries-clustering-pca/docs" target="_blank" class="link-btn outline small">📚 Docs</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>

<style>
    :root {
        --primary: #2085d8;
        --secondary: #2a9d8f;
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
    .header {
        text-align: center;
        margin-bottom: 50px;
    }
    .header h1 {
        font-size: 2.5rem;
        color: var(--primary);
        margin-bottom: 10px;
    }
    .subtitle {
        font-size: 1.2rem;
        color: #666;
        margin-bottom: 30px;
    }
    .btn-repo {
        display: inline-block;
        background-color: var(--text);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
        transition: transform 0.2s;
    }
    .btn-repo:hover {
        transform: scale(1.05);
    }
    .team-section h2 {
        text-align: center;
        margin-bottom: 30px;
    }
    .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 20px;
    }
    .member-card {
        background: white;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        border-top: 5px solid var(--primary);
        display: flex;
        flex-direction: column;
    }
    .member-card h3 {
        margin-top: 0;
        color: var(--primary);
    }
    .data-source {
        font-size: 0.9rem;
        color: #555;
        margin-bottom: 20px;
    }
    .data-source code {
        background: #eee;
        padding: 6px;
        border-radius: 4px;
        display: block;
        margin-top: 8px;
        word-break: break-all;
        font-size: 0.85rem;
    }
    .links {
        display: flex;
        flex-direction: column;
        gap: 15px;
        flex-grow: 1;
    }
    .link-btn {
        text-decoration: none;
        background: var(--primary);
        color: white;
        padding: 10px;
        border-radius: 6px;
        text-align: center;
        font-weight: 500;
        transition: all 0.2s;
        font-size: 0.95rem;
    }
    .link-btn:hover {
        opacity: 0.9;
        transform: translateY(-2px);
    }
    .main-btn {
        margin-bottom: 5px;
        font-weight: bold;
    }
    .api-group {
        background: #f8f9fa;
        padding: 10px;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    }
    .api-label {
        display: block;
        font-size: 0.85rem;
        font-weight: bold;
        color: #555;
        margin-bottom: 8px;
        text-align: center;
    }
    .api-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }
    .link-btn.outline {
        background: transparent;
        color: var(--primary);
        border: 1.5px solid var(--primary);
    }
    .link-btn.outline:hover {
        background: var(--primary);
        color: white;
    }
    .link-btn.small {
        padding: 6px 4px;
        font-size: 0.85rem;
    }
</style>