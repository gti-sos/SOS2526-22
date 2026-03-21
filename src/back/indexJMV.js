import dataStore from 'nedb'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL_API = "/api/v1";
const BASE_URL_API_V2 = "/api/v2";

// Base de datos para v1 (solo lectura)
const dbV1 = new dataStore({ 
    filename: path.join(__dirname, '../../data/dataJMV-v1.db'), 
    autoload: true 
});

// Base de datos para v2 (lectura/escritura)
const dbV2 = new dataStore({ 
    filename: path.join(__dirname, '../../data/dataJMV-v2.db'), 
    autoload: true 
});

export function loadBackEnd(app) {

    // ------------- DOCS (ambas versiones) -------------
    app.get(BASE_URL_API + "/co2-emission-gap-among-countries-clustering-pca/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52411427/2sBXigNZgB"); 
    });
    app.get(BASE_URL_API_V2 + "/co2-emission-gap-among-countries-clustering-pca/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52411427/2sBXijHWuU"); 
    });

    // Datos iniciales (iguales para ambas) [cite: 510]
    const initialDataJulio = [
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

    const campos = [
        "country", "year", "savanna_fire", "forest_fire", 
        "crop_residues", "rice_cultivation", "drained_organic", 
        "pesticides_manufacturing", "food_transport"
    ];

    // ------------- FUNCIONES AUXILIARES -------------
    function loadInitialDataHandler(db, res) {
        db.find({}, (err, docs) => {
            if (docs.length === 0) {
                db.insert(initialDataJulio, (err, newDocs) => {
                    if (err) return res.status(500).json({ error: err.message });
                    const result = newDocs.map(({ _id, ...rest }) => rest);
                    res.status(200).json(result);
                });
            } else {
                return res.status(409).send("CONFLICT: La base de datos ya tiene datos.");
            }
        });
    }

    function getAllHandler(db, req, res) {
        let query = {};
        
        // Búsqueda [cite: 454]
        if (req.query.country) query.country = req.query.country;
        if (req.query.year) query.year = parseInt(req.query.year);
        if (req.query.savanna_fire) query.savanna_fire = parseFloat(req.query.savanna_fire);
        if (req.query.forest_fire) query.forest_fire = parseFloat(req.query.forest_fire);
        if (req.query.crop_residues) query.crop_residues = parseFloat(req.query.crop_residues);
        if (req.query.rice_cultivation) query.rice_cultivation = parseFloat(req.query.rice_cultivation);
        if (req.query.drained_organic) query.drained_organic = parseFloat(req.query.drained_organic);
        if (req.query.pesticides_manufacturing) query.pesticides_manufacturing = parseFloat(req.query.pesticides_manufacturing);
        if (req.query.food_transport) query.food_transport = parseFloat(req.query.food_transport);

        // Paginación [cite: 455]
        let offset = parseInt(req.query.offset) || 0;
        let limit = parseInt(req.query.limit) || 100;

        db.find(query).skip(offset).limit(limit).exec((err, docs) => {
            if (err) return res.status(500).json({ error: "Error en la base de datos" });
            const result = docs.map(({ _id, ...rest }) => rest); // Sin _id [cite: 470]
            res.status(200).json(result); // Array [cite: 466]
        });
    }

    function getOneHandler(db, req, res) {
        const { country, year } = req.params;
        db.find({ country: country, year: parseInt(year) }, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error en la base de datos" });
            if (docs.length === 0) {
                res.status(404).send("NOT FOUND: Recurso no encontrado."); // 404 [cite: 525]
            } else {
                const recurso = docs[0];
                delete recurso._id;
                res.status(200).json(recurso); // Objeto [cite: 467]
            }
        });
    }

    // ------------- RUTAS PARA V1 (solo lectura) -------------
    const v1Base = BASE_URL_API + "/co2-emission-gap-among-countries-clustering-pca";

    app.get(v1Base + "/loadInitialData", (req, res) => loadInitialDataHandler(dbV1, res));
    app.get(v1Base, (req, res) => getAllHandler(dbV1, req, res));
    app.get(v1Base + "/:country/:year", (req, res) => getOneHandler(dbV1, req, res));

    // Bloquear métodos de escritura en v1
    app.post(v1Base, (req, res) => res.status(405).send("Method Not Allowed: v1 es solo lectura"));
    app.put(v1Base + "/:country/:year", (req, res) => res.status(405).send("Method Not Allowed: v1 es solo lectura"));
    app.delete(v1Base + "/:country/:year", (req, res) => res.status(405).send("Method Not Allowed: v1 es solo lectura"));
    app.delete(v1Base, (req, res) => res.status(405).send("Method Not Allowed: v1 es solo lectura"));
    app.post(v1Base + "/:country/:year", (req, res) => res.status(405).send("Method Not Allowed: v1 es solo lectura"));

    // ------------- RUTAS PARA V2 (lectura/escritura) -------------
    const v2Base = BASE_URL_API_V2 + "/co2-emission-gap-among-countries-clustering-pca";

    app.get(v2Base + "/loadInitialData", (req, res) => loadInitialDataHandler(dbV2, res));
    app.get(v2Base, (req, res) => getAllHandler(dbV2, req, res));
    app.get(v2Base + "/:country/:year", (req, res) => getOneHandler(dbV2, req, res));

    // POST crear [cite: 522]
    app.post(v2Base, (req, res) => {
        const newData = req.body;
        const requestKeys = Object.keys(newData);
        const hasRequiredKeys = campos.every(key => requestKeys.includes(key));
        const hasSameLength = requestKeys.length === campos.length;

        if (!hasRequiredKeys || !hasSameLength) {
            return res.status(400).send("BAD REQUEST: El JSON no tiene la estructura de campos esperada"); // 400 [cite: 468, 524]
        }

        newData.year = parseInt(newData.year);

        dbV2.find({ country: newData.country, year: newData.year }, (err, docs) => {
            if (docs.length > 0) {
                return res.status(409).send("CONFLICT: El recurso ya existe."); // 409 [cite: 523]
            } else {
                dbV2.insert(newData, (err, doc) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.sendStatus(201);
                });
            }
        });
    });

    // PUT actualizar [cite: 520]
    app.put(v2Base + "/:country/:year", (req, res) => {
        const { country, year } = req.params;
        const updatedData = req.body;

        const requestKeys = Object.keys(updatedData);
        const hasRequiredKeys = campos.every(key => requestKeys.includes(key));
        const hasSameLength = requestKeys.length === campos.length;

        if (!hasRequiredKeys || !hasSameLength) {
            return res.status(400).send("BAD REQUEST: El JSON no tiene la estructura de campos esperada"); // 400 [cite: 468]
        }

        if (updatedData.country !== country || parseInt(updatedData.year) !== parseInt(year)) {
            return res.status(400).send("BAD REQUEST: El ID del recurso no coincide con el cuerpo"); // 400 [cite: 521]
        }

        dbV2.update(
            { country: country, year: parseInt(year) },
            { $set: updatedData },
            {},
            (err, numReplaced) => {
                if (numReplaced === 0) {
                    return res.status(404).send("NOT FOUND: No existe el recurso"); // 404
                } else {
                    res.sendStatus(200);
                }
            }
        );
    });

    // DELETE individual
    app.delete(v2Base + "/:country/:year", (req, res) => {
        const { country, year } = req.params;
        dbV2.remove({ country: country, year: parseInt(year) }, {}, (err, numRemoved) => {
            if (numRemoved === 0) {
                res.status(404).send("NOT FOUND: No se encuentra el recurso a borrar"); // 404
            } else {
                res.sendStatus(200);
            }
        });
    });

    // DELETE todos
    app.delete(v2Base, (req, res) => {
        dbV2.remove({}, { multi: true }, (err, numRemoved) => {
            res.sendStatus(200);
        });
    });

    // Métodos NO permitidos [cite: 526]
    app.put(v2Base, (req, res) => res.sendStatus(405));
    app.post(v2Base + "/:country/:year", (req, res) => res.sendStatus(405));
}
