/////INDIVIDUAL ELENA 
import dataStore from 'nedb';
const BASE_URL_API = "/api/v1";
 let db = new dataStore();

export function loadBackEnd(app) {


    app.get("/api/v1/ozone-depleting-substance-consumptions/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52404851/2sBXiertqM"); 
    });

    
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


    //Carga de datos iniciales
    let datosElena = [];
    app.get(BASE_URL_API + "/ozone-depleting-substance-consumptions/loadInitialData", (req, res) => {
        if (datosElena.length === 0) {
            datosElena = [...initialDataElena]; 
            res.status(200).json(datosElena);
        } 
    });

    app.get(BASE_URL_API+ "/ozone-depleting-substance-consumptions", (req,res)=>{
    res.status(200).json(datosElena);
    });

            // GET de un campo concreto de todos los recursos
    // GET a una propiedad específica de todos los recursos
app.get(BASE_URL_API + "/ozone-depleting-substance-consumptions/:field", (req, res) => {
    const field = req.params.field;

    // Verificamos si los datos están vacíos
    if (datosElena.length === 0) {
        return res.status(404).json({ error: "No data available. Load initial data first." });
    }

    // Verificamos si el campo existe en el primer objeto del array
    if (!datosElena[0].hasOwnProperty(field)) {
        return res.status(400).json({ error: `Field '${field}' does not exist in the dataset.` });
    }

    // Extraemos solo los valores de esa columna (usando Set para evitar duplicados si lo deseas)
    const result = datosElena.map(item => item[field]);
    
    // Si prefieres que no haya repetidos, usa: [...new Set(datosElena.map(item => item[field]))]

    res.status(200).json(result);
});

    // GET de un recurso específico
    app.get(`${BASE_URL_API}/ozone-depleting-substance-consumptions/:country/:year`, (req, res) => {
        const { country, year } = req.params;
        const result = datosElena.find(item => 
            item.country.toLowerCase() === country.toLowerCase() && 
            item.year === parseInt(year)
        );

        if (!result) {
            return res.status(404).json({ error: "Recurso no encontrado" });
        }
        res.status(200).json(result);
    });

    //get con filtros
    app.get(`${BASE_URL_API}/ozone-depleting-substance-consumptions/filters`, (req, res) => {
    const { country, year, from, to } = req.query;
    let results = [...datosElena];

    if (country) results = results.filter(d => d.country.toLowerCase() === country.toLowerCase());
    if (year) results = results.filter(d => d.year === parseInt(year));
    if (from) results = results.filter(d => d.year >= parseInt(from));
    if (to) results = results.filter(d => d.year <= parseInt(to));

    res.status(200).json(results);
    });

    // //GET por campo
// GET de un campo concreto de todos los recursos
app.get(BASE_URL_API + "/ozone-depleting-substance-consumptions/:field", (req, res) => {
    const field = req.params.field;

    // 1. Verificamos si el array tiene datos
    if (datosElena.length === 0) {
        return res.status(200).json([]);
    }

    // 2. Verificamos si el campo existe en el primer objeto (ej: "country", "year"...)
    // Usamos hasOwnProperty para mayor seguridad
    if (!datosElena[0].hasOwnProperty(field)) {
        return res.status(404).json({error: "Field not found"});
    }

    // 3. Mapeamos el array para extraer solo ese campo
    const resultado = datosElena.map(item => item[field]);

    res.status(200).json(resultado);
});



    // POST para agregar un nuevo dato
    app.post(`${BASE_URL_API}/ozone-depleting-substance-consumptions`, (req, res) => {
        const newData = req.body;

        // Validación de que todos los campos del CSV están presentes
        if (
            !newData.country || !newData.year || newData.code === undefined ||
            newData.methyl_chloroform === undefined || newData.methyl_bromide === undefined ||
            newData.hcfc === undefined || newData.carbon_tetrachloride === undefined ||
            newData.halon === undefined || newData.cfc === undefined
        ) {
            return res.status(400).json({ error: "Faltan campos obligatorios o el formato es incorrecto" });
        }

        newData.year = parseInt(newData.year);
        newData.methyl_chloroform = Number(newData.methyl_chloroform);
        newData.methyl_bromide = Number(newData.methyl_bromide);
        newData.hcfc = Number(newData.hcfc);
        newData.carbon_tetrachloride = Number(newData.carbon_tetrachloride);
        newData.halon = Number(newData.halon);
        newData.cfc = Number(newData.cfc);

        // Comprobar si el recurso ya existe 
        const exists = datosElena.some(item => 
            item.country.toLowerCase() === newData.country.toLowerCase() && 
            item.year === newData.year
        );

        if (exists) {
            return res.status(409).json({ error: "El recurso ya existe para ese país y año" });
        }

        datosElena.push(newData);
        res.status(201).json(newData);
    });

    

    // PUT para actualizar un recurso específico
    app.put(`${BASE_URL_API}/ozone-depleting-substance-consumptions/:country/:year`, (req, res) => {
        const { country, year } = req.params;
        const updatedData = req.body;

        if (updatedData.country.toLowerCase() !== country.toLowerCase() || parseInt(updatedData.year) !== parseInt(year)) {
            return res.status(400).json({ error: "El país o el año no coinciden con la URL" });
        }

        const index = datosElena.findIndex(item => 
            item.country.toLowerCase() === country.toLowerCase() && 
            item.year === parseInt(year)
        );

        if (index === -1) {
            return res.status(404).json({ error: "No se puede actualizar un recurso que no existe" });
        }

        datosElena[index] = { ...datosElena[index], ...updatedData };
        res.status(200).json(datosElena[index]);
    });

    // DELETE de un recurso específico
    app.delete(`${BASE_URL_API}/ozone-depleting-substance-consumptions/:country/:year`, (req, res) => {
        const { country, year } = req.params;
        const index = datosElena.findIndex(item => 
            item.country.toLowerCase() === country.toLowerCase() && 
            item.year === parseInt(year)
        );

        if (index === -1) {
            return res.status(404).json({ error: "Recurso no encontrado" });
        }

        datosElena.splice(index, 1);
        res.status(200).json({ message: "Recurso eliminado correctamente" });
    });

    // DELETE de todos los recursos
    app.delete(`${BASE_URL_API}/ozone-depleting-substance-consumptions`, (req, res) => {
        datosElena = [];
        res.status(200).json({ message: "Todos los datos han sido eliminados" });
    });



    // Control de métodos no permitidos para la ruta base
    app.all(`${BASE_URL_API}/ozone-depleting-substance-consumptions`, (req, res, next) => {
        const allowed = ["GET", "POST", "DELETE"];
        if (!allowed.includes(req.method)) {
            return res.status(405).json({ error: "Method Not Allowed (No se permite PUT sobre la lista)" });
        }
        next();
    });

    // Control de métodos no permitidos para recursos concretos
    app.all(`${BASE_URL_API}/ozone-depleting-substance-consumptions/:country/:year`, (req, res, next) => {
        const allowed = ["GET", "PUT", "DELETE"];
        if (!allowed.includes(req.method)) {
            return res.status(405).json({ error: "Method Not Allowed (No se permite POST sobre un recurso concreto)" });
        }
        next();
    });
}