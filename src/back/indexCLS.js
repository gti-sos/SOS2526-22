import express from 'express';
import bodyParser from 'body-parser';
import DataStore from 'nedb';

export function loadBackEnd(app) {
    const BASE_URL_API = "/api/v1";

    // NeDB para persistencia
    const db = new DataStore({ filename: 'globalAgriculture.db', autoload: true });

    // Datos iniciales
    const initialData = [
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
    ];

    // Ruta estática /about
    app.use("/", express.static("./public"));
    app.get("/about", (req, res) => {
        res.sendFile(__dirname + "/public/about.html");
    });

    // Docs Postman
    app.get(`${BASE_URL_API}/global-agriculture-climate-impacts/docs`, (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52404852/2sBXiertz6"); 
    });

    // loadInitialData
    app.get(`${BASE_URL_API}/global-agriculture-climate-impacts/loadInitialData`, (req, res) => {
        db.count({}, (err, count) => {
            if (count === 0) {
                db.insert(initialData);
            }
            db.find({}, (err, docs) => {
                res.status(200).json(docs);
            });
        });
    });

    // GET con filtros y paginación
    app.get(`${BASE_URL_API}/global-agriculture-climate-impacts`, (req, res) => {
        const { country, year, from, to, limit = 10, offset = 0 } = req.query;
        let query = {};

        if (country) query.country = country;
        if (year) query.year = parseInt(year);
        if (from || to) {
            query.year = {};
            if (from) query.year.$gte = parseInt(from);
            if (to) query.year.$lte = parseInt(to);
        }

        db.find(query).skip(parseInt(offset)).limit(parseInt(limit)).exec((err, docs) => {
            res.status(200).json(docs);
        });
    });

    // GET recurso único
    app.get(`${BASE_URL_API}/global-agriculture-climate-impacts/:country/:year`, (req, res) => {
        const country = req.params.country;
        const year = parseInt(req.params.year);
        db.findOne({ country, year }, (err, doc) => {
            if (!doc) return res.status(404).json({ error: "Dato no encontrado" });
            res.status(200).json(doc);
        });
    });

    // POST
    app.post(`${BASE_URL_API}/global-agriculture-climate-impacts`, (req, res) => {
        const newData = req.body;
        newData.year = Number(newData.year);
        newData.average_temperature_c = Number(newData.average_temperature_c);
        newData.total_precipitation_mm = Number(newData.total_precipitation_mm);

        db.findOne({ country: newData.country, year: newData.year }, (err, doc) => {
            if (doc) return res.status(409).json({ error: "El dato ya existe" });
            db.insert(newData);
            res.status(201).json(newData);
        });
    });

    // PUT
    app.put(`${BASE_URL_API}/global-agriculture-climate-impacts/:country/:year`, (req, res) => {
        const country = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;

        if (updatedData.country && updatedData.country !== country) return res.status(400).json({ error: "Country no coincide" });
        if (updatedData.year && updatedData.year !== year) return res.status(400).json({ error: "Year no coincide" });

        db.update({ country, year }, { $set: updatedData }, {}, (err, numReplaced) => {
            if (numReplaced === 0) return res.status(404).json({ error: "Dato no encontrado" });
            db.findOne({ country, year }, (err, doc) => res.status(200).json(doc));
        });
    });

    // DELETE recurso único
    app.delete(`${BASE_URL_API}/global-agriculture-climate-impacts/:country/:year`, (req, res) => {
        const country = req.params.country;
        const year = parseInt(req.params.year);
        db.remove({ country, year }, {}, (err, numRemoved) => {
            if (numRemoved === 0) return res.status(404).json({ error: "Dato no encontrado" });
            res.status(200).json({ message: "Dato eliminado" });
        });
    });

    // DELETE todos
    app.delete(`${BASE_URL_API}/global-agriculture-climate-impacts`, (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            res.status(200).json({ message: "Todos los datos eliminados" });
        });
    });

    // Filtro de métodos permitidos
    app.all(`${BASE_URL_API}/global-agriculture-climate-impacts`, (req, res, next) => {
        const allowed = ["GET","POST","DELETE"];
        if (!allowed.includes(req.method)) return res.status(405).json({ error: "Method Not Allowed" });
        next();
    });
    app.all(`${BASE_URL_API}/global-agriculture-climate-impacts/:country/:year`, (req,res,next) => {
        const allowed = ["GET","PUT","DELETE"];
        if(!allowed.includes(req.method)) return res.status(405).json({error:"Method Not Allowed"});
        next();
    });

    // Algoritmo individual
    const datosCelia = initialData; // o tus datos reales
    function calcularMediaCelia(countryElegido) {
        const datosFiltrados = datosCelia.filter(item => item.country === countryElegido);
        if (datosFiltrados.length === 0) return 0;
        const valores = datosFiltrados.map(item => item.average_temperature_c);
        return valores.reduce((acc, val) => acc + val, 0) / valores.length;
    }
    app.get("/samples/CLS", (req,res) => {
        const countryElegido = "China";
        const media = calcularMediaCelia(countryElegido);
        res.send(`La media de average_temperature_c para ${countryElegido} es: ${media}`);
    });
}