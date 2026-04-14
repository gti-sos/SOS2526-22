// Ejemplo de lo que debe hacer el script de la grupal
async function loadAllData() {
    const resAgri = await fetch('/api/v2/global-agriculture-climate-impacts');
    const resOzono = await fetch('/api/v2/ozone-depleting-substances'); // Ruta de tu compañero
    const resCO2 = await fetch('/api/v2/co2-emissions-stats'); // Ruta de tu otro compañero

    if (resAgri.ok && resOzono.ok && resCO2.ok) {
        const dataAgri = await resAgri.json();
        const dataOzono = await resOzono.json();
        const dataCO2 = await resCO2.json();
        
        // Aquí montaríais una gráfica de tipo 'column' con las 3 series juntas
    }
}