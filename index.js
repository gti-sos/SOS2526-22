let express = require('express');
const bodyParser = require('body-parser');
let BASE_URL_API = "/api/v1";
let PORT = process.env.PORT || 3000;
const app = express();
let cool= require ("cool-ascii-faces"); 


// Para acceder al render del grupo 
app.get("/", (req, res) => {
    res.send("SOS2526-22 API funcionando correctamente ");
});







app.listen(PORT , () => {
    console.log(`Server is running on ${PORT}`);
});
