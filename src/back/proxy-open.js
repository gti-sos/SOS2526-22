import express from 'express';

const router = express.Router();

const OPENAQ_KEY = process.env.OPENAQ_KEY || '7d572277a01c2a1a247e3c69a771392762261313ee2e7825c9fff9ee3614e411';

router.get('/', async (req, res) => {
    try {
        const { country = 'CN', parameter = 'pm25', limit = 1000 } = req.query;
        // Usamos la URL de la v2 (estable)
        const url = `https://api.openaq.org/v2/measurements?limit=${limit}&parameter=${parameter}&country=${country}&sort=desc&order_by=datetime`;
        
        console.log(`🔵 OpenAQ request: ${url}`);
        
        const response = await fetch(url, {
            headers: { 'X-API-Key': OPENAQ_KEY }
        });
        
        if (!response.ok) {
            console.error(`❌ OpenAQ error: ${response.status}`);
            return res.status(response.status).json({ error: `OpenAQ error: ${response.status}` });
        }
        
        const data = await response.json();
        
        // Procesar datos: media anual
        const results = {};
        if (data.results && Array.isArray(data.results)) {
            data.results.forEach(measure => {
                const date = new Date(measure.datetime);
                const year = date.getFullYear();
                const value = measure.value;
                if (value && value > 0) {
                    if (!results[year]) results[year] = { sum: 0, count: 0 };
                    results[year].sum += value;
                    results[year].count++;
                }
            });
        }
        
        const annualAvg = Object.entries(results).map(([year, { sum, count }]) => ({
            year: parseInt(year),
            pm25: sum / count
        })).sort((a, b) => a.year - b.year);
        
        res.json(annualAvg);
    } catch (error) {
        console.error('❌ Proxy OpenAQ error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;