import Datastore from 'nedb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// REGLA: Persistencia NeDB [cite: 394, 453]
const db = new Datastore({ filename: path.join(__dirname, '../../data/dataJMV_v2.db'), autoload: true });

// REGLA: Mínimo 10 datos para loadInitialData [cite: 97, 510, 566]
const datosJulio = [
    { country: "Afghanistan", year: 1990, savanna_fire: 14.72, forest_fire: 0.05, crop_residues: 205.60, rice_cultivation: 686, drained_organic: 0, pesticides_manufacturing: 11.80, food_transport: 63.11 },
    { country: "Afghanistan", year: 1992, savanna_fire: 14.72, forest_fire: 0.05, crop_residues: 196.53, rice_cultivation: 686, drained_organic: 0, pesticides_manufacturing: 11.71, food_transport: 53.31 },
    { country: "Albania", year: 1990, savanna_fire: 5.55, forest_fire: 7.02, crop_residues: 59.23, rice_cultivation: 23.52, drained_organic: 110.57, pesticides_manufacturing: 2, food_transport: 46.96 },
    { country: "Algeria", year: 1990, savanna_fire: 55.64, forest_fire: 89.04, crop_residues: 164.27, rice_cultivation: 4.31, drained_organic: 0, pesticides_manufacturing: 104, food_transport: 1584.44 },
    { country: "Andorra", year: 2011, savanna_fire: 0, forest_fire: 0, crop_residues: 0, rice_cultivation: 926.34, drained_organic: 0, pesticides_manufacturing: 11.48, food_transport: 40.47 },
    { country: "Angola", year: 1990, savanna_fire: 2501, forest_fire: 120, crop_residues: 30, rice_cultivation: 15, drained_organic: 0, pesticides_manufacturing: 0, food_transport: 45 },
    { country: "Argentina", year: 1995, savanna_fire: 400, forest_fire: 250, crop_residues: 1200, rice_cultivation: 500, drained_organic: 10, pesticides_manufacturing: 80, food_transport: 3000 },
    { country: "Australia", year: 2000, savanna_fire: 8000, forest_fire: 4000, crop_residues: 500, rice_cultivation: 1200, drained_organic: 5, pesticides_manufacturing: 150, food_transport: 6000 },
    { country: "Austria", year: 2010, savanna_fire: 0, forest_fire: 5, crop_residues: 40, rice_cultivation: 0, drained_organic: 100, pesticides_manufacturing: 20, food_transport: 800 },
    { country: "Belgium", year: 2015, savanna_fire: 0, forest_fire: 2, crop_residues: 35, rice_cultivation: 0, drained_organic: 50, pesticides_manufacturing: 60, food_transport: 1200 }
];

export function loadBackEnd(app) {
    // CAMBIO A V2: [cite: 32]
    const BASE_URL_API = "/api/v2";
    const JMV_API_URL = BASE_URL_API + "/co2-emission-gap-among-countries-clustering-pca";

    // REGLA: No devolver _id de NeDB [cite: 411, 470]
    const cleanData = (data) => {
        if (Array.isArray(data)) {
            return data.map(d => { const { _id, ...rest } = d; return rest; });
        }
        if (data) { const { _id, ...rest } = data; return rest; }
        return data;
    };

    // GET /loadInitialData 
    app.get(JMV_API_URL + "/loadInitialData", (req, res) => {
        db.count({}, (err, count) => {
            if (count > 0) return res.status(409).send("La base de datos ya tiene datos.");
            db.insert(datosJulio, (err) => {
                if (err) return res.sendStatus(500);
                res.status(200).json(cleanData(datosJulio));
            });
        });
    });

    // GET Colección (Búsqueda por TODOS los campos + Paginación)
    app.get(JMV_API_URL, (req, res) => {
        let query = {};

        // 1. Búsqueda por campos de texto
        if (req.query.country) query.country = req.query.country;
        if (req.query.year) query.year = parseInt(req.query.year);
        if (req.query.savanna_fire) query.savanna_fire = parseFloat(req.query.savanna_fire);
        if (req.query.forest_fire) query.forest_fire = parseFloat(req.query.forest_fire);
        if (req.query.crop_residues) query.crop_residues = parseFloat(req.query.crop_residues);
        if (req.query.rice_cultivation) query.rice_cultivation = parseFloat(req.query.rice_cultivation);
        if (req.query.drained_organic) query.drained_organic = parseFloat(req.query.drained_organic);
        if (req.query.pesticides_manufacturing) query.pesticides_manufacturing = parseFloat(req.query.pesticides_manufacturing);
        if (req.query.food_transport) query.food_transport = parseFloat(req.query.food_transport);

        // 3. Paginación 
        let offset = parseInt(req.query.offset) || 0;
        let limit = parseInt(req.query.limit) || 10;

        db.find(query).skip(offset).limit(limit).exec((err, data) => {
            if (err) {
                console.error("Error accediendo a la DB: " + err);
                return res.sendStatus(500);
            }
            res.status(200).json(cleanData(data)); 
        });
    });

    // POST Colección [cite: 114, 522]
    app.post(JMV_API_URL, (req, res) => {
        const newData = req.body;
        const fields = ["country", "year", "savanna_fire", "forest_fire", "crop_residues", "rice_cultivation", "drained_organic", "pesticides_manufacturing", "food_transport"];
        
        // REGLA: 400 si faltan campos o sobran [cite: 116, 409, 524]
        if (!fields.every(f => f in newData) || Object.keys(newData).length !== fields.length) {
            return res.status(400).send("Formato de JSON incorrecto.");
        }

        db.findOne({ country: newData.country, year: parseInt(newData.year) }, (err, exists) => {
            if (exists) return res.status(409).send("El recurso ya existe."); // REGLA: 409 Conflict [cite: 115, 523]
            newData.year = parseInt(newData.year);
            db.insert(newData, (err) => {
                if (err) return res.sendStatus(500);
                res.sendStatus(201);
            });
        });
    });

    // GET Recurso Único [cite: 408, 467]
    app.get(JMV_API_URL + "/:country/:year", (req, res) => {
        db.findOne({ country: req.params.country, year: parseInt(req.params.year) }, (err, data) => {
            if (err) return res.sendStatus(500);
            if (!data) return res.status(404).send("Recurso no encontrado."); // REGLA: 404 [cite: 118, 525]
            res.status(200).json(cleanData(data)); // REGLA: Devolver Objeto [cite: 408, 467]
        });
    });

    // PUT Recurso Único [cite: 112, 520]
    app.put(JMV_API_URL + "/:country/:year", (req, res) => {
        const { country, year } = req.params;
        const updatedData = req.body;

        // REGLA: 400 si el ID de la URL no coincide con el del cuerpo [cite: 113, 521]
        if (updatedData.country !== country || parseInt(updatedData.year) !== parseInt(year)) {
            return res.status(400).send("El ID del recurso no coincide.");
        }

        db.update({ country, year: parseInt(year) }, { $set: updatedData }, {}, (err, numReplaced) => {
            if (err) return res.sendStatus(500);
            if (numReplaced === 0) return res.status(404).send("No encontrado.");
            res.sendStatus(200);
        });
    });

    // DELETE Recurso Único
    app.delete(JMV_API_URL + "/:country/:year", (req, res) => {
        db.remove({ country: req.params.country, year: parseInt(req.params.year) }, {}, (err, numRemoved) => {
            if (err) return res.sendStatus(500);
            if (numRemoved === 0) return res.status(404).send("No encontrado.");
            res.sendStatus(200);
        });
    });

    // DELETE Colección completa
    app.delete(JMV_API_URL, (req, res) => {
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.sendStatus(500);
            res.sendStatus(200);
        });
    });

    // Métodos NO permitidos [cite: 119, 526]
    app.put(JMV_API_URL, (req, res) => { res.sendStatus(405); });
    app.post(JMV_API_URL + "/:country/:year", (req, res) => { res.sendStatus(405); });

    // Documentación [cite: 413, 472]
    app.get(JMV_API_URL + "/docs", (req, res) => {
        // RECUERDA: Debes poner aquí el enlace a tu portal de documentación de la v2 en Postman [cite: 33]
        res.redirect("PON_AQUI_TU_NUEVO_ENLACE_POSTMAN_V2");
    });
}