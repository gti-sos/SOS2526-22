<svelte:head>
    <title>Integración: Impacto vs Exportaciones - SOS2526</title>
</svelte:head>

<main class="container">
    <header class="header">
        <h1>Integraciones</h1>
        <p class="subtitle">Análisis cruzado de datos</p>
    </header>

    <section class="team-section">
        <h2>🔗 Integración destacada</h2>

        <div class="cards-grid">
            <div class="member-card card-integration">
                <h3>Impacto Agrícola vs Exportaciones</h3>
                <p class="data-source">Comparativa entre fuentes:<br>
                    <code>/global-agriculture-climate-impacts</code><br>
                    <code>/exportations-stats</code>
                </p>
                <div class="links">
                    <a href="/integrations/global-agriculture-climate-impacts/exportations-stats" class="link-btn main-btn">
                        📊 Ver gráfica de integración
                    </a>
                </div>
            </div>



               <div class="member-card card-integration">
                <h3>Impacto Agrícola vs SpaceX</h3>
                <p class="data-source">Comparativa entre fuentes:<br>
                    <code>/global-agriculture-climate-impacts</code><br>
                    <code>/exportations-stats</code>
                </p>
                <div class="links">
                    <a href="/integrations/global-agriculture-climate-impacts/spacex" class="link-btn main-btn">
                        📊 Ver gráfica de integración
                    </a>
                </div>
            </div>







              <div class="member-card card-integration">
                <h3>Impacto Agrícola vs Adobe</h3>
                <p class="data-source">Comparativa entre fuentes:<br>
                    <code>/global-agriculture-climate-impacts</code><br>
                    <code>/exportations-stats</code>
                </p>
                <div class="links">
                    <a href="/integrations/global-agriculture-climate-impacts/adobe" class="link-btn main-btn">
                        📊 Ver gráfica de integración
                    </a>
                </div>
            </div>
       

        </div>



        
         
    


          
          



        <div class="cards-grid">
            <div class="member-card card-integration">
                <h3>Impacto Agrícola vs AdaFruit</h3>
                <p class="data-source">Comparativa entre fuentes:<br>
                    <code>/global-agriculture-climate-impacts</code><br>
                    <code>/exportations-stats</code>
                </p>
                <div class="links">
                    <a href="/integrations/global-agriculture-climate-impacts/adafruit" class="link-btn main-btn">
                        📊 Ver gráfica de integración
                    </a>
                </div>
            </div>



            
            <div class="member-card card-integration">
                <h3>Impacto Agrícola vs Cheaters</h3>
                <p class="data-source">Comparativa entre fuentes:<br>
                    <code>/global-agriculture-climate-impacts</code><br>
                    <code>/exportations-stats</code>
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
        --accent: #d8206d; /* Color distinto para diferenciar la integración */
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
        display: flex;
        justify-content: center;
        margin: 0 auto;
    }

    .member-card {
        background: white;
        padding: 30px 25px;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        border-top: 5px solid var(--accent);
        width: 100%;
        max-width: 400px;
        display: flex;
        flex-direction: column;
    }

    .member-card h3 { margin-top: 0; color: var(--accent); font-size: 1.3rem; }

    .data-source { font-size: 0.9rem; color: #555; margin-bottom: 20px; }
    .data-source code {
        background: #eee;
        padding: 4px 8px;
        border-radius: 4px;
        display: block;
        margin-top: 5px;
        font-size: 0.8rem;
    }

    .link-btn {
        text-decoration: none;
        background: var(--accent);
        color: white;
        padding: 12px;
        border-radius: 6px;
        text-align: center;
        font-weight: 600;
        transition: all 0.2s;
    }

    .link-btn:hover {
        opacity: 0.9;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
</style>