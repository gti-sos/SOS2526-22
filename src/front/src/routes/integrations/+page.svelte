<svelte:head>
    <title>Integraciones - SOS2526</title>
</svelte:head>

<main class="container">
    <header class="header">
        <h1> Integraciones </h1>
        <p class="subtitle">Integración con APIs externas y de otros grupos SOS</p>
    </header>

    <section class="team-section">
        <h2>👥 Integraciones por miembro</h2>

        <div class="cards-grid">

            <div class="member-card card-celia">

                <h3>Celia Leal Salvago</h3>
                <p class="data-source">Fuente propia: <br><code>global-agriculture-climate-impacts</code></p>
                <div class="links">
                    <a href="/integrations/global-agriculture-climate-impacts" class="link-btn main-btn">
                        🌱 Ver integraciones de Celia
                    </a>
                </div>
            </div>

            <div class="member-card card-elena">
                <h3>Elena Martínez Moreno</h3>
                <p class="data-source">Fuente propia: <br><code>ozone-depleting-substance-consumptions</code></p>
                <div class="links">
                    <a href="/integrations/ozone-depleting-substance-consumptions" class="link-btn main-btn">
                        🛡️ Ver integraciones de Elena
                    </a>
                </div>
            </div>

        </div>
    </section>
</main>

<style>
    :root {
        --primary: #2085d8;
        --secondary: #2a9d8f;
        --tertiary: #b160ca;
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

    .team-section h2 {
        text-align: center;
        margin-bottom: 30px;
    }

    .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 20px;
        max-width: 800px;
        margin: 0 auto;
    }

    .member-card {
        background: white;
        padding: 30px 25px;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        border-top: 5px solid var(--primary);
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .card-celia {
        border-top-color: var(--secondary);
    }

    .card-elena {
        border-top-color: var(--tertiary);
    }


    .member-card h3 {
        margin-top: 0;
        color: var(--tertiary);
        font-size: 1.2rem;
    }

    .card-celia h3 {
        color: var(--secondary);
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
        padding: 12px 10px;
        border-radius: 6px;
        text-align: center;
        font-weight: 600;
        transition: all 0.2s;
        font-size: 0.95rem;
    }

    .card-celia .link-btn {
        background: var(--secondary);
    }


    .card-elena .link-btn {
        background: var(--tertiary);
    }


    .link-btn:hover {
        opacity: 0.9;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
</style>