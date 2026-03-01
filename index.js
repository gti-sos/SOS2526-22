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

//Ruta dinámica /cool
app.get('/cool', (req, res) => {
  res.send(`<html><body><h1> 
     ${cool()} 
     </h1></body></html>`);
})

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})



////Individual CELIA, DATOS CELIA 
let globalAgricultureData  = [];


app.use("/", express.static("./static"));
app.use(bodyParser.json());


let contacts = [
    { name: "Celia", phone: 6789898 },
    { name: "Elena", phone: 6789898 },
    { name: "Julio", phone: 6789898 }
];

app.get(BASE_URL_API + "/contacts", (req, res) => {
    let jsonData = JSON.stringify(contacts, null,2);
    console.log(`JSON Data to be sent: ${jsonData}`);
    res.send(jsonData);
    
});


app.post(BASE_URL_API + "/contacts", (req, res) => {
    let newContact= req.body;
    console.log(`New contact received: ${JSON.stringify(newContact, null,2)}`);
    contacts.push(newContact);
    res.sendStatus(201,"CREATED");
    
});



app.listen(PORT , () => {
    console.log(`Server is running on ${PORT}`);
});



//// Algoritmo de index-CLS.js
const datos = [
  { year: 2001, country: "India", region: "West Bengal", crop_type: "Corn", average_temperature_c: 155, total_precipitation_mm: 44706 },
  { year: 2024, country: "China", region: "North", crop_type: "Corn", average_temperature_c: 323, total_precipitation_mm: 291357 },
  { year: 2001, country: "France", region: "Ile-de-France", crop_type: "Wheat", average_temperature_c: 2111, total_precipitation_mm: 130174 },
  { year: 2001, country: "Canada", region: "Prairies", crop_type: "Coffee", average_temperature_c: 2785, total_precipitation_mm: 115436 },
  { year: 2010, country: "Brazil", region: "Sao Paulo", crop_type: "Soy", average_temperature_c: 24.6, total_precipitation_mm: 1420.5 },
  { year: 2015, country: "United States", region: "California", crop_type: "Almond", average_temperature_c: 18.9, total_precipitation_mm: 800.3 },
  { year: 2018, country: "Australia", region: "New South Wales", crop_type: "Wheat", average_temperature_c: 22.4, total_precipitation_mm: 950.8 },
  { year: 2012, country: "Germany", region: "Bavaria", crop_type: "Barley", average_temperature_c: 16.7, total_precipitation_mm: 1100.2 },
  { year: 2019, country: "Mexico", region: "Jalisco", crop_type: "Corn", average_temperature_c: 25.3, total_precipitation_mm: 980.4 },
  { year: 2020, country: "Argentina", region: "Pampas", crop_type: "Soy", average_temperature_c: 23.1, total_precipitation_mm: 1200.6 },
  { year: 2016, country: "China", region: "South", crop_type: "Rice", average_temperature_c: 28.4, total_precipitation_mm: 1800.9 },
  { year: 2013, country: "India", region: "Punjab", crop_type: "Wheat", average_temperature_c: 26.2, total_precipitation_mm: 1020.3 },
  { year: 2017, country: "France", region: "Normandy", crop_type: "Corn", average_temperature_c: 19.4, total_precipitation_mm: 1250.7 },
  { year: 2021, country: "Canada", region: "Ontario", crop_type: "Corn", average_temperature_c: 17.6, total_precipitation_mm: 980.1 },
  { year: 2022, country: "Brazil", region: "Minas Gerais", crop_type: "Coffee", average_temperature_c: 21.8, total_precipitation_mm: 1350.4 }
];

function calcularMedia(countryElegido) {
    const datosFiltrados = datos.filter(item => item.country === countryElegido);
    if (datosFiltrados.length === 0) return 0;

    const valores = datosFiltrados.map(item => item.average_temperature_c);
    const media = valores.reduce((acc, val) => acc + val, 0) / valores.length;
    return media;
}


//  Ruta para individual CELIA 
app.get("/samples/CLS", (req, res) => {
    const countryElegido = "China"; // puedes cambiar a tu país
    const media = calcularMedia(countryElegido);
    res.send(`La media de average_temperature_c para ${countryElegido} es: ${media}`);
});



/////////INDIVIDUAL CELIA //////

app.get(`${BASE_URL_API}/global-agriculture-climate-impacts/loadInitialData`, (req, res) => {
    if (globalAgricultureData.length === 0) {
        globalAgricultureData.push(
            { country: "Spain", year: 2020, crop_type: "Wheat", average_temperature_c: 20, total_precipitation_mm: 500 },
            { country: "France", year: 2020, crop_type: "Corn", average_temperature_c: 19, total_precipitation_mm: 450 },
            { country: "Germany", year: 2020, crop_type: "Barley", average_temperature_c: 17, total_precipitation_mm: 480 },
            { country: "Italy", year: 2020, crop_type: "Soy", average_temperature_c: 21, total_precipitation_mm: 470 },
            { country: "Portugal", year: 2020, crop_type: "Rice", average_temperature_c: 22, total_precipitation_mm: 460 },
            { country: "Greece", year: 2020, crop_type: "Olive", average_temperature_c: 25, total_precipitation_mm: 430 },
            { country: "Norway", year: 2020, crop_type: "Barley", average_temperature_c: 10, total_precipitation_mm: 300 },
            { country: "Sweden", year: 2020, crop_type: "Wheat", average_temperature_c: 11, total_precipitation_mm: 310 },
            { country: "Finland", year: 2020, crop_type: "Corn", average_temperature_c: 8, total_precipitation_mm: 290 },
            { country: "Poland", year: 2020, crop_type: "Soy", average_temperature_c: 16, total_precipitation_mm: 320 }
        );
    }
    res.status(200).json(globalAgricultureData);
});

// GET todos los datos
app.get(`${BASE_URL_API}/global-agriculture-climate-impacts`, (req, res) => {
    res.status(200).json(globalAgricultureData);
});

// GET dato específico por país
app.get(`${BASE_URL_API}/global-agriculture-climate-impacts/:country`, (req, res) => {
    const country = req.params.country;
    const result = globalAgricultureData.filter(item => item.country.toLowerCase() === country.toLowerCase());
    if (result.length === 0) {
        res.status(404).json({ error: "No se encontró el país" });
    } else {
        res.status(200).json(result);
    }
});

// POST para agregar un dato
app.post(`${BASE_URL_API}/global-agriculture-climate-impacts`, (req, res) => {
    const newData = req.body;

    // Convertimos a números
    newData.year = Number(newData.year);
    newData.average_temperature_c = Number(newData.average_temperature_c);
    newData.total_precipitation_mm = Number(newData.total_precipitation_mm);

    if (
        !newData.country || newData.country === "" ||
        !newData.year || isNaN(newData.year) ||
        !newData.crop_type || newData.crop_type === "" ||
        newData.average_temperature_c === undefined || isNaN(newData.average_temperature_c) ||
        newData.total_precipitation_mm === undefined || isNaN(newData.total_precipitation_mm)
    ) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const exists = globalAgricultureData.some(item => item.country.toLowerCase() === newData.country.toLowerCase() && item.year === newData.year);
    if (exists) {
        return res.status(409).json({ error: "El dato ya existe" });
    }

    globalAgricultureData.push(newData);
    res.status(201).json(newData);
});

// PUT para actualizar
app.put(`${BASE_URL_API}/global-agriculture-climate-impacts/:country/:year`, (req, res) => {
    const country = req.params.country;
    const year = parseInt(req.params.year);
    const updatedData = req.body;

    const index = globalAgricultureData.findIndex(item => item.country.toLowerCase() === country.toLowerCase() && item.year === year);
    if (index === -1) {
        return res.status(404).json({ error: "Dato no encontrado" });
    }

    globalAgricultureData[index] = { ...globalAgricultureData[index], ...updatedData };
    res.status(200).json(globalAgricultureData[index]);
});

// DELETE específico
app.delete(`${BASE_URL_API}/global-agriculture-climate-impacts/:country/:year`, (req, res) => {
    const country = req.params.country;
    const year = parseInt(req.params.year);
    const index = globalAgricultureData.findIndex(item => item.country.toLowerCase() === country.toLowerCase() && item.year === year);
    if (index === -1) {
        return res.status(404).json({ error: "Dato no encontrado" });
    }

    globalAgricultureData.splice(index, 1);
    res.status(200).json({ message: "Dato eliminado" });
});

// DELETE todos los datos
app.delete(`${BASE_URL_API}/global-agriculture-climate-impacts`, (req, res) => {
    globalAgricultureData = [];
    res.status(200).json({ message: "Todos los datos eliminados" });
});











/////INDIVIDUAL ELENA 

//apartado 8. Replicar el algoritmo del archivo llamado “index-YYY.js” 
let initialDataElena = [
    { country: "bangladesh", code: "bgd", year: 1994, methyl_chloroform: 4, methyl_bromide: 0, hcfc: 38, carbon_tetrachloride: 71, halon: 35, cfc: 1806 },
    { country: "mexico", code: "mex", year: 2010, methyl_chloroform: 0, methyl_bromide: 6679, hcfc: 11717, carbon_tetrachloride: 1, halon: 0, cfc: -2408 },
    { country: "asia", code: "", year: 2015, methyl_chloroform: 0, methyl_bromide: 0, hcfc: 2142218, carbon_tetrachloride: 0, halon: 0, cfc: -2296 },
    { country: "united-states", code: "usa", year: 2009, methyl_chloroform: -448, methyl_bromide: 13633, hcfc: 3396, carbon_tetrachloride: -1932, halon: -125, cfc: -2236 },
    { country: "japan", code: "jpn", year: 2012, methyl_chloroform: 0, methyl_bromide: 938, hcfc: 21014, carbon_tetrachloride: 0, halon: 0, cfc: -2231 },
    { country: "china", code: "chn", year: 2017, methyl_chloroform: 0, methyl_bromide: 54, hcfc: 1460466, carbon_tetrachloride: 2365, halon: -1, cfc: -2141 },
    { country: "world", code: "owid_wrl", year: 2010, methyl_chloroform: -20300003, methyl_bromide: 45654, hcfc: 4090047, carbon_tetrachloride: -1378, halon: -1608, cfc: -2089 },
    { country: "costa-rica", code: "cri", year: 1998, methyl_chloroform: 0, methyl_bromide: 4367, hcfc: 61, carbon_tetrachloride: 0, halon: 0, cfc: -2042 },
    { country: "japan", code: "jpn", year: 2013, methyl_chloroform: 0, methyl_bromide: 7, hcfc: 20569, carbon_tetrachloride: 145, halon: 0, cfc: -1813 },
    { country: "asia", code: "", year: 2012, methyl_chloroform: 0, methyl_bromide: 0, hcfc: 3298312, carbon_tetrachloride: 0, halon: -8, cfc: -1801 },
    { country: "singapore", code: "sgp", year: 1997, methyl_chloroform: 0, methyl_bromide: 43, hcfc: 1431, carbon_tetrachloride: 0, halon: 0, cfc: -1789 }
];

const calcularMediaElena = (nombreRegion) => {
    let filtrados = initialDataElena.filter(n => n.country === nombreRegion);
    return filtrados
        .map(n => n.halon)  
        .reduce((acum, n) => acum + n, 0) / (filtrados.length || 1);
};

app.get("/samples/EMM", (req, res) => {
    const media = calcularMediaElena(initialDataElena, "asia");    
    res.send(`Media de consumo de halon en asia: ${media}`);
});



//apartado 12: Carga de datos iniciales
let datosElena = [];
app.get(BASE_URL_API + "/ozone-depleting-substance-consumptions/loadInitialData", (req, res) => {
    if (datosElena.length === 0) {
        datosElena = [...initialDataElena]; 
        res.status(200).json(datosElena);
    } else {
        res.status(400).send("Bad Request: El array ya tiene datos"); //
    }
});


//apartado 10.	Debe tener desplegado en Render una API REST funcional ofreciendo su fuente de datos
app.get(BASE_URL_API+ "/ozone-depleting-substance-consumptions", (req,res)=>{
res.status(200).json(datosElena);
});


//apartado 13.	La API debe cumplir con las buenas prácticas definidas en los laboratorios

// POST para crear un nuevo recurso
app.post(BASE_URL_API + "/ozone-depleting-substance-consumptions", (req, res) => {
    let newData = req.body; 

    // 1. Validamos que el recurso no exista ya
    // Comprobamos por país y año, que es nuestro identificador natural
    const exists = datosElena.some(item => 
        item.country.toLowerCase() === newData.country.toLowerCase() && 
        item.year === parseInt(newData.year)
    );

    if (exists) {
        res.status(409).send("CONFLICT: El recurso ya existe para ese país y año."); 
    } else {
        datosElena.push(newData);
        
        res.status(201).send("CREATED"); 
    }
});
