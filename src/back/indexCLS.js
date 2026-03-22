import dataStore from 'nedb';
import path from 'path';
import { fileURLToPath } from 'url';
import util from 'util';

// --- PARCHE DE COMPATIBILIDAD NeDB (Node 18+) ---
if (typeof util.isDate !== 'function') {
    util.isDate = (obj) => Object.prototype.toString.call(obj) === '[object Date]';
}
if (typeof util.isRegExp !== 'function') {
    util.isRegExp = (obj) => Object.prototype.toString.call(obj) === '[object RegExp]';
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL_API = "/api/v1";
const BASE_URL_API_V2 = "/api/v2";

// --- BASES DE DATOS INDEPENDIENTES ---
const dbV1 = new dataStore({ 
    filename: path.join(__dirname, '../../data/dataCLS-v1.db'), 
    autoload: true 
});

const dbV2 = new dataStore({ 
    filename: path.join(__dirname, '../../data/dataCLS-v2.db'), 
    autoload: true 
});

export function loadBackEnd(app) {

    // ------------- DOCUMENTACIÓN -------------
    app.get(BASE_URL_API + "/global-agriculture-climate-impacts/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52404852/2sBXiesEcp"); 
    });
    app.get(BASE_URL_API_V2 + "/global-agriculture-climate-impacts/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52404852/2sBXijHrA5"); 
    });

    const initialData = [
        { country: "spain", year: 2020, crop_type: "wheat", average_temperature_c: 20, total_precipitation_mm: 500 },
        { country: "france", year: 2020, crop_type: "corn", average_temperature_c: 19, total_precipitation_mm: 450 },
        { country: "germany", year: 2020, crop_type: "barley", average_temperature_c: 17, total_precipitation_mm: 480 },
        { country: "italy", year: 2020, crop_type: "soy", average_temperature_c: 21, total_precipitation_mm: 470 },
        { country: "portugal", year: 2020, crop_type: "rice", average_temperature_c: 22, total_precipitation_mm: 460 },
        { country: "greece", year: 2020, crop_type: "olive", average_temperature_c: 25, total_precipitation_mm: 430 },
        { country: "norway", year: 2020, crop_type: "barley", average_temperature_c: 10, total_precipitation_mm: 300 },
        { country: "sweden", year: 2020, crop_type: "wheat", average_temperature_c: 11, total_precipitation_mm: 310 },
        { country: "finland", year: 2020, crop_type: "corn", average_temperature_c: 8, total_precipitation_mm: 290 },
        { country: "poland", year: 2020, crop_type: "soy", average_temperature_c: 16, total_precipitation_mm: 320 }
    ];

    const campos = ["country", "year", "crop_type", "average_temperature_c", "total_precipitation_mm"];

    // ------------- FUNCIONES AUXILIARES (Lógica compartida) -------------
    
    function loadInitialDataHandler(db, res) {
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.status(500).json({ error: "Error limpiando DB" });
            db.persistence.compactDatafile();
            const datosInsertar = JSON.parse(JSON.stringify(initialData));
            db.insert(datosInsertar, (err, newDocs) => {
                if (err) return res.status(500).json({ error: "Insert error", mensaje: err.message });
                const result = newDocs.map(({ _id, ...rest }) => rest);
                res.status(200).json(result);
            });
        });
    }

    function getAllHandler(db, req, res) {
        let query = {};
        if (req.query.country) query.country = req.query.country.toLowerCase();
        if (req.query.year) query.year = parseInt(req.query.year);
        if (req.query.crop_type) query.crop_type = req.query.crop_type.toLowerCase();

        if (req.query.from || req.query.to) {
            query.year = {};
            if (req.query.from) query.year.$gte = parseInt(req.query.from);
            if (req.query.to) query.year.$lte = parseInt(req.query.to);
        }

        // Paginación (Arregla error "expected 10 to be at most 2")
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
        db.findOne({ country: country.toLowerCase(), year: parseInt(year) }, (err, doc) => {
            if (err) return res.status(500).json({ error: "Error en BD" });
            if (!doc) return res.status(404).json({ error: "NOT FOUND" });
            const { _id, ...rest } = doc;
            res.status(200).json(rest);
        });
    }

    function postHandler(db, req, res) {
        const newData = req.body;
        const requestKeys = Object.keys(newData);
        const hasRequiredKeys = campos.every(key => requestKeys.includes(key));

        if (!hasRequiredKeys || requestKeys.length !== campos.length) {
            return res.status(400).json({ error: "BAD REQUEST: Estructura incorrecta" });
        }

        newData.country = newData.country.toLowerCase();
        newData.year = parseInt(newData.year);
        newData.average_temperature_c = parseFloat(newData.average_temperature_c);
        newData.total_precipitation_mm = parseFloat(newData.total_precipitation_mm);

        db.findOne({ country: newData.country, year: newData.year }, (err, doc) => {
            if (doc) return res.status(409).json({ error: "CONFLICT: Ya existe" });
            db.insert(newData, (err, insertedDoc) => {
                if (err) return res.status(500).json({ error: "Insert error" });
                const { _id, ...rest } = insertedDoc;
                res.status(201).json(rest);
            });
        });
    }

    function putHandler(db, req, res) {
        const { country, year } = req.params;
        const updatedData = req.body;
        
        // Validación de seguridad para que el cuerpo coincida con la URL
        if (!updatedData.country || updatedData.country.toLowerCase() !== country.toLowerCase() || parseInt(updatedData.year) !== parseInt(year)) {
            return res.status(400).json({ error: "BAD REQUEST: ID mismatch" });
        }
        
        // Aseguramos tipos de datos correctos antes de actualizar
        updatedData.country = updatedData.country.toLowerCase();
        updatedData.year = parseInt(updatedData.year);
        if(updatedData.average_temperature_c) updatedData.average_temperature_c = parseFloat(updatedData.average_temperature_c);
        if(updatedData.total_precipitation_mm) updatedData.total_precipitation_mm = parseFloat(updatedData.total_precipitation_mm);

        db.update({ country: country.toLowerCase(), year: parseInt(year) }, { $set: updatedData }, {}, (err, numReplaced) => {
            if (err) return res.status(500).json({ error: "Internal Server Error" });
            
            if (numReplaced === 0) {
                return res.status(404).json({ error: "NOT FOUND" });
            } else {
                // FORZAR ESCRITURA EN DISCO (Esto soluciona el fallo en el test)
                db.persistence.compactDatafile();
                res.status(200).json({ message: "OK actualizado" });
            }
        });
    }

    function deleteOneHandler(db, req, res) {
        const { country, year } = req.params;
        db.remove({ country: country.toLowerCase(), year: parseInt(year) }, {}, (err, numRemoved) => {
            if (numRemoved === 0) return res.status(404).json({ error: "NOT FOUND" });
            res.status(200).json({ message: "OK borrado" });
        });
    }

    function deleteAllHandler(db, req, res) {
        db.remove({}, { multi: true }, (err) => {
            res.status(200).json({ message: "OK todos borrados" });
        });
    }

    // ------------- ENRUTAMIENTO V1 Y V2 -------------
    [BASE_URL_API, BASE_URL_API_V2].forEach(base => {
        const vBase = base + "/global-agriculture-climate-impacts";
        const db = (base === BASE_URL_API) ? dbV1 : dbV2;

        // Rutas GET (Ambas versiones)
        app.get(vBase + "/loadInitialData", (req, res) => loadInitialDataHandler(db, res));
        app.get(vBase, (req, res) => getAllHandler(db, req, res));
        app.get(vBase + "/:country/:year", (req, res) => getOneHandler(db, req, res));

        // Lógica de independencia: V2 es escritura, V1 es SOLO LECTURA
        if (base === BASE_URL_API_V2) {
            app.post(vBase, (req, res) => postHandler(db, req, res));
            app.put(vBase + "/:country/:year", (req, res) => putHandler(db, req, res));
            app.delete(vBase + "/:country/:year", (req, res) => deleteOneHandler(db, req, res));
            app.delete(vBase, (req, res) => deleteAllHandler(db, req, res));
        } else {
            // Bloqueo v1
            const error405 = (req, res) => res.status(405).json({ error: "Method Not Allowed: v1 es solo lectura" });
            app.post(vBase, error405);
            app.put(vBase + "/:country/:year", error405);
            app.delete(vBase + "/:country/:year", error405);
            app.delete(vBase, error405);
        }
        
        // Bloqueos de seguridad generales
        app.put(vBase, (req, res) => res.status(405).json({ error: "Method Not Allowed" }));
        app.post(vBase + "/:country/:year", (req, res) => res.status(405).json({ error: "Method Not Allowed" }));
    });
}