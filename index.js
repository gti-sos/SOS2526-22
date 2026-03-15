// index.js - Principal
import express from "express";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import { dirname } from "path";


// Importar backends individuales
import { loadBackEnd as loadCLS } from "./src/back/indexCLS.js";
import { loadBackEnd as loadEMM } from "./src/back/indexEMM.js";
// import { loadBackEnd as loadJMV } from "./src/back/indexJMV.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
const BASE_URL_API = "/api/v1";

app.use(bodyParser.json());
app.use("/", express.static(__dirname + "/public"));


// Ruta estática /about
app.get("/about", (req, res) => {
  res.sendFile(__dirname + "/public/about.html");
});

// Cargar backends
loadCLS(app);
loadEMM(app);
// loadJMV(app);

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});