// index.js - Principal
import express from "express";
import cors from "cors";
import {handler} from "./src/front/build/handler.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

import proxyCheaters from './src/back/cheaters-stats-proxy.js';



// Importar backends individuales
import { loadBackEnd as loadCLS } from "./src/back/indexCLS.js";
import { loadBackEnd as loadEMM } from "./src/back/indexEMM.js";
import { loadBackEnd as loadJMV } from "./src/back/indexJMV.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());


app.use(express.json());

app.use('/cheaters-stats-proxy', proxyCheaters);



// Cargar backends
loadCLS(app);
loadEMM(app);
loadJMV(app);


app.use(handler);



// Arrancar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});