import express from 'express';
import bodyParser from 'body-parser';

// Importa cada backend con alias diferente
import { loadBackEnd as loadCLS } from './src/back/indexCLS.js';
import { loadBackEnd as loadEMM } from './src/back/indexEMM.js';
import { loadBackEnd as loadJMV } from './src/back/indexJMV.js';

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Carga todos los backends
loadCLS(app);
loadEMM(app);
loadJMV(app);

// Ruta de inicio del grupo
app.get("/", (req, res) => {
    res.send("SOS2526-22 API funcionando correctamente");
});

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});