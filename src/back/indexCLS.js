import dataStore from 'nedb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL_API = "/api/v1";
const BASE_URL_API_V2 = "/api/v2";

const dbV1 = new dataStore({ 
    filename: path.join(__dirname, '../../data/dataCLS-v1.db'), 
    autoload: true 
});

const dbV2 = new dataStore({ 
    filename: path.join(__dirname, '../../data/dataCLS-v2.db'), 
    autoload: true 
});

export function loadBackEnd(app) {

    app.get(BASE_URL_API + "/global-agriculture-climate-impacts/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52404852/2sBXiesEcp"); 
    });

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

    const campos = ["country", "year", "crop_type", "average_temperature_c", "total_precipitation_mm"];

    // 1. CORRECCIÓN LOAD INITIAL DATA (Evita el Error 500 del test)
    function loadInitialDataHandler(db, res) {
        db.remove({}, { multi: true }, (err) => { // Limpiamos antes para evitar conflictos
            if (err) return res.status(500).json({ error: "Error clearing BD" });
            
            db.insert(initialData, (err, newDocs) => {
                if (err) return res.status(500).json({ error: "Insert error" });
                // Limpiamos los _id para el test
                const result = newDocs.map(({ _id, ...rest }) => rest);
                res.status(200).json(result);
            });
        });
    }

    function getAllHandler(db, req, res) {
        let query = {};
        if (req.query.country) query.country = req.query.country;
        if (req.query.year) query.year = parseInt(req.query.year);
        if (req.query.crop_type) query.crop_type = req.query.crop_type;
        
        if (req.query.from || req.query.to) {
            query.year = {};
            if (req.query.from) query.year.$gte = parseInt(req.query.from);
            if (req.query.to) query.year.$lte = parseInt(req.query.to);
        }

        let offset = parseInt(req.query.offset) || 0;
        let limit = parseInt(req.query.limit) || 1000;

        db.find(query).skip(offset).limit(limit).exec((err, docs) => {
            if (err) return res.status(500).json({ error: "Error en BD" });
            const result = docs.map(({ _id, ...rest }) => rest);
            res.status(200).json(result); 
        });
    }

    // 2. CORRECCIÓN GET ONE (Búsqueda insensible a mayúsculas)
    function getOneHandler(db, req, res) {
        const country = req.params.country;
        const year = parseInt(req.params.year);
        
        // Usamos RegExp para que "spain" y "Spain" funcionen igual
        db.findOne({ country: new RegExp("^" + country + "$", "i"), year: year }, (err, doc) => {
            if (err) return res.status(500).json({ error: "Error en BD" });
            if (!doc) return res.status(404).json({ error: "NOT FOUND" });
            const { _id, ...rest } = doc;
            res.status(200).json(rest);
        });
    }

    function postHandler(db, req, res) {
        const newData = req.body;
        const requestKeys = Object.keys(newData);
        
        if (requestKeys.length !== campos.length || !campos.every(key => requestKeys.includes(key))) {
            return res.status(400).json({ error: "BAD REQUEST" });
        }

        newData.year = parseInt(newData.year);
        // Comprobar si ya existe
        db.findOne({ country: newData.country, year: newData.year }, (err, doc) => {
            if (err) return res.status(500).json({ error: "DB error" });
            if (doc) return res.status(409).json({ error: "CONFLICT" });
            
            db.insert(newData, (err, doc) => {
                if (err) return res.status(500).json({ error: "Insert error" });
                const { _id, ...rest } = doc;
                res.status(201).json(rest);
            });
        });
    }

    // 3. CORRECCIÓN PUT (Debe devolver el objeto o mensaje que el test espera)
    function putHandler(db, req, res) {
        const { country, year } = req.params;
        const updatedData = req.body;
        
        if (updatedData.country !== country || parseInt(updatedData.year) !== parseInt(year)) {
            return res.status(400).json({ error: "BAD REQUEST: ID mismatch" });
        }
        
        updatedData.year = parseInt(updatedData.year);
        
        db.update({ country: country, year: parseInt(year) }, { $set: updatedData }, {}, (err, numReplaced) => {
            if (err) return res.status(500).json({ error: "Update error" });
            if (numReplaced === 0) return res.status(404).json({ error: "NOT FOUND" });
            
            // IMPORTANTE: Devolvemos el objeto actualizado para que el test no de "undefined"
            res.status(200).json(updatedData);
        });
    }

    function deleteOneHandler(db, req, res) {
        const { country, year } = req.params;
        db.remove({ country: new RegExp("^" + country + "$", "i"), year: parseInt(year) }, {}, (err, numRemoved) => {
            if (err) return res.status(500).json({ error: "Delete error" });
            if (numRemoved === 0) return res.status(404).json({ error: "NOT FOUND" });
            res.status(200).json({ message: "OK" });
        });
    }

    function deleteAllHandler(db, req, res) {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) return res.status(500).json({ error: "Delete error" });
            res.status(200).json({ message: "OK" });
        });
    }

    function methodNotAllowed(req, res) {
        res.status(405).json({ error: "Method Not Allowed" });
    }

    [BASE_URL_API, BASE_URL_API_V2].forEach(base => {
        const vBase = base + "/global-agriculture-climate-impacts";
        const db = (base === BASE_URL_API) ? dbV1 : dbV2;

        app.get(vBase + "/loadInitialData", (req, res) => loadInitialDataHandler(db, res));
        app.get(vBase, (req, res) => getAllHandler(db, req, res));
        app.get(vBase + "/:country/:year", (req, res) => getOneHandler(db, req, res));
        app.post(vBase, (req, res) => postHandler(db, req, res));
        app.put(vBase + "/:country/:year", (req, res) => putHandler(db, req, res));
        app.delete(vBase + "/:country/:year", (req, res) => deleteOneHandler(db, req, res));
        app.delete(vBase, (req, res) => deleteAllHandler(db, req, res));
        app.put(vBase, methodNotAllowed);
        app.post(vBase + "/:country/:year", methodNotAllowed);
    });
}