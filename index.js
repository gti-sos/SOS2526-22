// index.js - Principal
import express from "express";
import cors from "cors";
import {handler} from "./src/front/build/handler.js";
import { fileURLToPath } from "url";
import { dirname } from "path";




// Importar backends individuales
import { loadBackEnd as loadCLS } from "./src/back/indexCLS.js";
import { loadBackEnd as loadEMM } from "./src/back/indexEMM.js";
import { loadBackEnd as loadJMV } from "./src/back/indexJMV.js";
import { loadBackEnd as loadBackEndJMV_v2 } from './src/back/indexJMV_v2.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());


app.use(express.json());



// Cargar backends
loadCLS(app);
loadEMM(app);
loadJMV(app);
loadBackEndJMV_v2(app);


app.use(handler);



// Arrancar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});