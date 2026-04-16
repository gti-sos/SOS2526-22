<header class="navbar">
    <div class="brand">🌍 Grupo 22</div>
    <nav>
        <a href="/">🏠 Inicio</a>
        <a href="/about">ℹ️ Acerca de (About)</a>
        <a href="/global-agriculture-climate-impacts">🌱 Agricultura</a>
        <a href="/ozone-depleting-substance-consumptions">🛡️ Ozono</a>
        <a href="/co2-emissions-stats">💨 Emisiones CO2</a>
        <a href="/analytics">📊 Analytics</a>
    </nav>
</header>

<style>
    .navbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 30px;
        background-color: #2085d8;
        color: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .brand {
        font-size: 1.2rem;
        font-weight: bold;
    }
    nav {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
    }
    nav a {
        color: white;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.95rem;
        transition: opacity 0.2s;
    }
    nav a:hover {
        opacity: 0.8;
        text-decoration: underline;
    }
</style>