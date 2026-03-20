import dataStore from '@seald-io/nedb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL_API = "/api/v1";
const BASE_URL_API_V2 = "/api/v2";

// Base de datos para v1 (Para que pasen tus tests de Postman)
const dbV1 = new dataStore({ 
    filename: path.join(__dirname, '../../data/dataCLS-v1.db'), 
    autoload: true 
});

// Base de datos para v2 (Para conectarla a tu frontend Svelte)
const dbV2 = new dataStore({ 
    filename: path.join(__dirname, '../../data/dataCLS-v2.db'), 
    autoload: true 
});

export function loadBackEnd(app) {

    // ------------- DOCS (ambas versiones) -------------
    app.get(BASE_URL_API + "/global-agriculture-climate-impacts/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52404852/2sBXiesEcp"); 
    });
    app.get(BASE_URL_API_V2 + "/global-agriculture-climate-impacts/docs", (req, res) => {
        // Cuando crees la colección V2 en Postman, cambia esta URL por la nueva
        res.redirect("https://documenter.getpostman.com/view/52404852/2sBXijHrA5"); 
    });

    // ------------- DATOS INICIALES -------------
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

    // ------------- FUNCIONES AUXILIARES -------------
    
    function loadInitialDataHandler(db, res) {
        db.find({}, (err, docs) => {
            if (err) return res.status(500).json({ error: "DB error" });
            if (docs.length === 0) {
                const datosLimpios = initialData.map(d => ({ ...d }));
                db.insert(datosLimpios, (err, newDocs) => {
                    if (err) return res.status(500).json({ error: "Insert error" });
                    const result = newDocs.map(({ _id, ...rest }) => rest);
                    res.status(200).json(result);
                });
            } else {
                const result = docs.map(({ _id, ...rest }) => rest);
                res.status(200).json(result);
            }
        });
    }

    function getAllHandler(db, req, res) {
        let query = {};
        
        if (req.query.country) query.country = req.query.country;
        if (req.query.year) query.year = parseInt(req.query.year);
        if (req.query.crop_type) query.crop_type = req.query.crop_type;
        if (req.query.average_temperature_c) query.average_temperature_c = parseFloat(req.query.average_temperature_c);
        if (req.query.total_precipitation_mm) query.total_precipitation_mm = parseFloat(req.query.total_precipitation_mm);

        // Búsqueda por rango (necesaria para el front)
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

    function getOneHandler(db, req, res) {
        const { country, year } = req.params;
        db.findOne({ country: country, year: parseInt(year) }, (err, doc) => {
            if (err) return res.status(500).json({ error: "Error en BD" });
            if (!doc) {
                // Si no existe, devolvemos 404 explícito
                return res.status(404).json({ error: "NOT FOUND: Recurso no encontrado" });
            }
            const { _id, ...rest } = doc;
            res.status(200).json(rest);
        });
    }

    function postHandler(db, req, res) {
        const newData = req.body;
        const requestKeys = Object.keys(newData);
        const hasRequiredKeys = campos.every(key => requestKeys.includes(key));
        const hasSameLength = requestKeys.length === campos.length;

        if (!hasRequiredKeys || !hasSameLength) {
            return res.status(400).json({ error: "BAD REQUEST: JSON incompleto o incorrecto" });
        }

        newData.year = parseInt(newData.year);
        newData.average_temperature_c = parseFloat(newData.average_temperature_c);
        newData.total_precipitation_mm = parseFloat(newData.total_precipitation_mm);

        db.find({ country: newData.country, year: newData.year }, (err, docs) => {
            if (docs.length > 0) {
                return res.status(409).json({ error: "CONFLICT: El recurso ya existe" });
            } else {
                db.insert(newData, (err, doc) => {
                    if (err) return res.status(500).json({ error: "Error al guardar" });
                    delete doc._id;
                    res.status(201).json(doc);
                });
            }
        });
    }

    function putHandler(db, req, res) {
        const { country, year } = req.params;
        const updatedData = req.body;
        const requestKeys = Object.keys(updatedData);

        const hasRequiredKeys = campos.every(key => requestKeys.includes(key));
        const hasSameLength = requestKeys.length === campos.length;

        if (!hasRequiredKeys || !hasSameLength) {
            return res.status(400).json({ error: "BAD REQUEST: Estructura JSON incorrecta" });
        }

        if (updatedData.country !== country || parseInt(updatedData.year) !== parseInt(year)) {
            return res.status(400).json({ error: "BAD REQUEST: El ID no coincide con el cuerpo" });
        }

        updatedData.year = parseInt(updatedData.year);
        updatedData.average_temperature_c = parseFloat(updatedData.average_temperature_c);
        updatedData.total_precipitation_mm = parseFloat(updatedData.total_precipitation_mm);

        db.update({ country: country, year: parseInt(year) }, { $set: updatedData }, {}, (err, numReplaced) => {
            if (numReplaced === 0) {
                res.status(404).json({ error: "NOT FOUND: No existe el recurso" });
            } else {
                res.status(200).json({ message: "OK: Recurso actualizado correctamente" });
            }
        });
    }

    function deleteOneHandler(db, req, res) {
        const { country, year } = req.params;
        db.remove({ country: country, year: parseInt(year) }, {}, (err, numRemoved) => {
            if (numRemoved === 0) {
                res.status(404).json({ error: "NOT FOUND: No se encontró el recurso" });
            } else {
                res.status(200).json({ message: "OK: Recurso eliminado" });
            }
        });
    }

    function deleteAllHandler(db, req, res) {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            res.status(200).json({ message: "OK: Todos los recursos eliminados" });
        });
    }

    function methodNotAllowed(req, res) {
        res.status(405).json({ error: "Method Not Allowed" });
    }

    // ------------- ENRUTAMIENTO V1 (Para pasar Postman y Newman) -------------
    const v1Base = BASE_URL_API + "/global-agriculture-climate-impacts";

    app.get(v1Base + "/loadInitialData", (req, res) => loadInitialDataHandler(dbV1, res));
    app.get(v1Base, (req, res) => getAllHandler(dbV1, req, res));
    app.get(v1Base + "/:country/:year", (req, res) => getOneHandler(dbV1, req, res));
    app.post(v1Base, (req, res) => postHandler(dbV1, req, res));
    app.put(v1Base + "/:country/:year", (req, res) => putHandler(dbV1, req, res));
    app.delete(v1Base + "/:country/:year", (req, res) => deleteOneHandler(dbV1, req, res));
    app.delete(v1Base, (req, res) => deleteAllHandler(dbV1, req, res));
    app.put(v1Base, methodNotAllowed);
    app.post(v1Base + "/:country/:year", methodNotAllowed);

    // ------------- ENRUTAMIENTO V2 (Para tu Frontend en Svelte) -------------
    const v2Base = BASE_URL_API_V2 + "/global-agriculture-climate-impacts";

    app.get(v2Base + "/loadInitialData", (req, res) => loadInitialDataHandler(dbV2, res));
    app.get(v2Base, (req, res) => getAllHandler(dbV2, req, res));
    app.get(v2Base + "/:country/:year", (req, res) => getOneHandler(dbV2, req, res));
    app.post(v2Base, (req, res) => postHandler(dbV2, req, res));
    app.put(v2Base + "/:country/:year", (req, res) => putHandler(dbV2, req, res));
    app.delete(v2Base + "/:country/:year", (req, res) => deleteOneHandler(dbV2, req, res));
    app.delete(v2Base, (req, res) => deleteAllHandler(dbV2, req, res));
    app.put(v2Base, methodNotAllowed);
    app.post(v2Base + "/:country/:year", methodNotAllowed);
}