import express from 'express';

const router = express.Router();

// URL base de la API externa de tus compañeros
const TARGET_API = 'https://sos2526-30-p5ay.onrender.com/api/v1/cheaters-stats';

// Usamos 'use' para que capture cualquier subruta después de /proxy-cheaters
router.use(async (req, res) => {
    // Construimos la URL eliminando el prefijo del proxy si fuera necesario
    // req.url contendrá, por ejemplo, '/loadInitialData'
    const url = TARGET_API + req.url;
    
    console.log('🔵 Proxy Cheaters request:', req.method, url);
    
    try {
        const headers = {
            'User-Agent': 'SOS2526-22-App',
            'Accept': 'application/json'
        };
        
        // Realizamos la petición hacia la API externa
        const response = await fetch(url, { 
            method: req.method,
            headers: headers 
        });
        
        const data = await response.json();
        
        console.log(`📊 Proxy status: ${response.status}`);
        
        // Devolvemos la respuesta al cliente con el mismo código de estado
        res.status(response.status).json(data);
    } catch (error) {
        console.error('❌ Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;