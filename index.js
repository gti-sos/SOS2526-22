// index.js
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

// Importar tus módulos de backend (cada compañero en su archivo)
import { loadBackEnd as loadCLS } from "./src/back/indexCLS.js";
// import { loadBackEnd as loadEMM } from "./src/back/indexEMM.js";
// import { loadBackEnd as loadJMV } from "./src/back/indexJMV.js";

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL_API = "/api/v1";

// Crear __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware para JSON
app.use(bodyParser.json());

// Servir carpeta public de forma estática
app.use(express.static(path.join(__dirname, "public")));

// Ruta principal de prueba
app.get("/", (req, res) => {
    res.send("SOS2526-22 API funcionando correctamente");
});

// --- RUTA ABOUT ---
// Esto sirve tu archivo public/about.html
app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "about.html"));
});

// Cargar los backends individuales de cada compañero
loadCLS(app); // Tu módulo
// loadEMM(app); // Compañera
// loadJMV(app); // Compañero

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});