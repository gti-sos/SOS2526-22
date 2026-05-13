<main class="container">
    <section class="card">
        <h2>ℹ️ Acerca del Proyecto (About)</h2>
        
        <!-- SECCIÓN DEL VÍDEO D03 (CELIA LEAL) -->
        <div class="info-block video-box">
            <h3>🎥 Presentación Entregable D03</h3>
            <p>A continuación, se presenta el vídeo narrado donde se explican detalladamente todas las funcionalidades y aspectos técnicos de la API desarrollados para esta entrega.</p>
            
            <div class="video-action">
                <!-- RECUERDA CAMBIAR EL ID POR EL DE TU VÍDEO -->
                <a href="https://youtu.be/y8RBBBC4jHs" target="_blank" class="btn-video-celia">
                    <span>🎬</span> Vídeo de Celia Leal: Funcionalidades de la API (D03)
                </a>
            </div>
            
            <ul class="video-requirements">
                <li>✅ Duración: Menos de 5 minutos.</li>
                <li>✅ Formato: Narrado y comentado directamente.</li>
                <li>✅ Acceso: Visualización directa desde el navegador (sin descarga).</li>
            </ul>
        </div>

        <div class="info-block">
            <h3>📝 Project Description</h3>
            <p>Our sources of information are aimed at analyzing the relationship that exists between the consumption of substances that deplete the ozone layer, the impact of climate change on agriculture and CO2 emissions in the agri-food sector.</p>
        </div>

        <div class="info-block">
            <h3>👥 Team</h3>
            <ul>
                <li><a href="https://github.com/Celia-Leal" target="_blank">Celia Leal Salvago (Responsable)</a></li>
                <li><a href="https://github.com/elemarmor" target="_blank">Elena Martínez Moreno</a></li>
                <li><a href="https://github.com/Juliomv02" target="_blank">Julio Morales Vela</a></li>
            </ul>
        </div>

        <div class="info-block">
            <h3>📂 Repository</h3>
            <p><a href="https://github.com/gti-sos/SOS2526-22" target="_blank">https://github.com/gti-sos/SOS2526-22</a></p>
        </div>
    </section>
</main>

<style>
    .container { 
        max-width: 850px; 
        margin: 40px auto; 
        padding: 20px; 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    }
    .card { 
        background: white; 
        padding: 40px; 
        border-radius: 16px; 
        box-shadow: 0 10px 25px rgba(0,0,0,0.08); 
        border-top: 6px solid #ff85a2;
    }
    
    .video-box {
        background-color: #fff5f7;
        padding: 25px;
        border-radius: 15px;
        border: 2px dashed #ff85a2;
        margin-bottom: 35px;
    }

    .btn-video-celia {
        background-color: #ff85a2;
        color: white !important;
        padding: 16px 32px;
        border-radius: 50px;
        font-size: 1.15rem;
        font-weight: bold;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 4px 15px rgba(255, 133, 162, 0.4);
        text-decoration: none !important;
    }

    .btn-video-celia:hover {
        transform: translateY(-3px);
        background-color: #f76c8e;
        box-shadow: 0 6px 20px rgba(255, 133, 162, 0.6);
    }

    .video-action {
        text-align: center;
        margin: 25px 0;
    }

    .video-requirements {
        list-style: none;
        padding: 0;
        font-size: 0.9rem;
        color: #666;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    h2 { color: #333; text-align: center; margin-bottom: 30px; font-size: 2.2rem; }
    h3 { color: #ff85a2; margin-bottom: 15px; border-bottom: 2px solid #ffeef1; padding-bottom: 8px; }
    .info-block { margin-bottom: 30px; }
    p { line-height: 1.7; color: #555; }
    ul { line-height: 2; }
    a { color: #2a9d8f; text-decoration: none; font-weight: bold; }
    a:hover { text-decoration: underline; }
</style>