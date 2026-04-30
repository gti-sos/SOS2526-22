<svelte:head>
    <title>Integraciones Elena - SOS2526</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&display=swap" rel="stylesheet">
</svelte:head>

<main class="container">
    <header class="header">
        <h1>🛡️ Integraciones de Elena</h1>
        <p class="subtitle">Consumo de sustancias que agotan el ozono · APIs integradas</p>
    </header>

    <div class="cards-grid-top">
        <div class="integration-card">
            <div class="card-number">API Compañero 1</div>
            <div class="card-content">
                <div class="api-badge sos">API SOS</div>
                <h3>Olympics Athlete Events</h3>
                <p class="description">Descripción de la integración próximamente.</p>
                <div class="card-footer">
                    <span class="library-tag">Biblioteca</span>
                    <a href="/integrations/ozone-depleting-substance-consumptions/Olympics-Athlet-Events" class="link-btn">
                        Ver integración →
                    </a>
                </div>
            </div>
        </div>

        <div class="integration-card">
            <div class="card-number">API Compañero 2</div>
            <div class="card-content">
                <div class="api-badge sos">API SOS</div>
                <h3>Military stats</h3>
                <p class="description">Descripción de la integración próximamente.</p>
                <div class="card-footer">
                    <span class="library-tag">Biblioteca</span>
                    <a href="/integrations/ozone-depleting-substance-consumptions/integration-2" class="link-btn">
                        Ver integración →
                    </a>
                </div>
            </div>
        </div>

        <div class="integration-card">
            <div class="card-number">API Externa 1</div>
            <div class="card-content">
                <div class="api-badge externa">API Externa</div>
                <h3>Integración 3</h3>
                <p class="description">Descripción de la integración próximamente.</p>
                <div class="card-footer">
                    <span class="library-tag">Biblioteca</span>
                    <a href="/integrations/ozone-depleting-substance-consumptions/integration-3" class="link-btn">
                        Ver integración →
                    </a>
                </div>
            </div>
        </div>
    </div>

    <div class="cards-grid-bottom">
        <div class="integration-card">
            <div class="card-number">API Externa 2</div>
            <div class="card-content">
                <div class="api-badge externa">API Externa</div>
                <h3>Integración 4</h3>
                <p class="description">Descripción de la integración próximamente.</p>
                <div class="card-footer">
                    <span class="library-tag">Biblioteca</span>
                    <a href="/integrations/ozone-depleting-substance-consumptions/integration-4" class="link-btn">
                        Ver integración →
                    </a>
                </div>
            </div>
        </div>

        <div class="integration-card">
            <div class="card-number">API Externa 3</div>
            <div class="card-content">
                <div class="api-badge externa">API Externa</div>
                <h3>Integración 5</h3>
                <p class="description">Descripción de la integración próximamente.</p>
                <div class="card-footer">
                    <span class="library-tag">Biblioteca</span>
                    <a href="/integrations/ozone-depleting-substance-consumptions/integration-5" class="link-btn">
                        Ver integración →
                    </a>
                </div>
            </div>
        </div>
    </div>
</main>

<style>
    :root {
        --primary: #2085d8;
        --accent: #00897b;
        --accent-dark: #00695c;
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
        font-size: 1.1rem;
        color: #666;
    }

    .cards-grid-top {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        margin-bottom: 24px;
    }

    .cards-grid-bottom {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
        width: calc(66.66% + 8px);
        margin: 0 auto;
    }

    .integration-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.08);
        border-top: 5px solid var(--accent);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .integration-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.12);
    }

    .card-number {
        background: var(--accent);
        color: white;
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-size: 1.6rem;
        font-weight: 600;
        padding: 20px;
        text-align: center;
        letter-spacing: 0.03em;
        line-height: 1.2;
    }

    .card-content {
        padding: 20px;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        gap: 10px;
    }

    .api-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        width: fit-content;
    }

    .api-badge.sos {
        background: #e3f2fd;
        color: #1565c0;
    }

    .api-badge.externa {
        background: #f3e5f5;
        color: #7b1fa2;
    }

    .card-content h3 {
        margin: 0;
        font-size: 1.15rem;
        color: var(--text);
    }

    .description {
        font-size: 0.9rem;
        color: #777;
        margin: 0;
        flex-grow: 1;
    }

    .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #f0f0f0;
    }

    .library-tag {
        font-size: 0.8rem;
        color: #999;
        font-style: italic;
    }

    .link-btn {
        text-decoration: none;
        background: var(--accent);
        color: white;
        padding: 8px 14px;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 600;
        transition: all 0.2s;
    }

    .link-btn:hover {
        background: var(--accent-dark);
        transform: translateY(-1px);
    }
</style>