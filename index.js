import express from 'express';
import bodyParser from 'body-parser';  
import { loadBackend } from './src/back/indexEMM.js';
import { loadBackend } from './src/back/indexCLS.js';
import { loadBackend } from './src/back/indexJMV.js';


let BASE_URL_API = "/api/v1";
let PORT = process.env.PORT || 3000;
const app = express();


// Para acceder al render del grupo 
app.get("/", (req, res) => {
    res.send("SOS2526-22 API funcionando correctamente ");
});


app.listen(PORT , () => {
    console.log(`Server is running on ${PORT}`);
});
