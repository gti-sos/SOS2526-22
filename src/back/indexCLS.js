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

    // ------------- FUNCIONES AUXILIARES -------------

    // Devuelve array de valores únicos para un campo (Búsqueda por colecciones)
    function getFieldHandler(db, fieldName, req, res) {
        // Si req no existe por algún motivo, evitamos el crash
        if (!req || !req.query) {
            return res.status(500).json({ error: "Objeto Request no recibido" });
        }

        const from = req.query.from ? parseFloat(req.query.from) : null;
        const to = req.query.to ? parseFloat(req.query.to) : null;

        db.find({}, { [fieldName]: 1, _id: 0 }, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error en BD" });
            
            let values = docs
                .map(d => d[fieldName])
                .filter(v => v !== undefined && v !== null);

            if (from !== null) values = values.filter(v => v >= from);
            if (to !== null) values = values.filter(v => v <= to);

            const uniqueValues = [...new Set(values)];
            res.status(200).json(uniqueValues);
        });
    }


    function loadInitialDataHandler(db, res) {
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.status(500).json({ error: "Error limpiando DB" });
            db.insert(JSON.parse(JSON.stringify(initialData)), (err) => {
                if (err) return res.status(500).json({ error: "Insert error" });
                db.persistence.compactDatafile();
                res.status(200).json({ message: "Datos cargados correctamente" });
            });
        });
    }

    function getAllHandler(db, req, res) {
        let query = {};
        if (req.query.country) query.country = req.query.country.toLowerCase();
        if (req.query.year) query.year = parseInt(req.query.year);
        if (req.query.crop_type) query.crop_type = req.query.crop_type.toLowerCase();

        // Parámetros de rango genéricos
        const from = req.query.from ? parseFloat(req.query.from) : null;
        const to = req.query.to ? parseFloat(req.query.to) : null;

        db.find(query, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error en BD" });

            let results = docs;

            // Filtramos por rango. 
            // Si la consulta viene de una columna numérica, filtramos por esa columna.
            // Por defecto, lo aplicamos a precipitación o temperatura si están presentes.
            if (from !== null) {
                results = results.filter(d => 
                    (d.total_precipitation_mm >= from) || (d.average_temperature_c >= from)
                );
            }
            if (to !== null) {
                results = results.filter(d => 
                    (d.total_precipitation_mm <= to) || (d.average_temperature_c <= to)
                );
            }

            let offset = parseInt(req.query.offset) || 0;
            let limit = parseInt(req.query.limit) || 1000;
            const paginated = results.slice(offset, offset + limit);

            res.status(200).json(paginated.map(({ _id, ...rest }) => rest)); 
        });
    }

    // ------------- ENRUTAMIENTO -------------
    [BASE_URL_API, BASE_URL_API_V2].forEach(base => {
        const vBase = base + "/global-agriculture-climate-impacts";
        const db = (base === BASE_URL_API) ? dbV1 : dbV2;

        // 1. CARGA INICIAL
        app.get(vBase + "/loadInitialData", (req, res) => loadInitialDataHandler(db, res));

       // 2. BUSQUEDA POR COLECCIONES (Ej: /api/v1/.../average_temperature_c)
        campos.forEach(campo => {
            // Fíjate que ahora pasamos (req, res) y se los damos a getFieldHandler
            app.get(`${vBase}/${campo}`, (req, res) => getFieldHandler(db, campo, req, res));
        });

        // 3. GET GENERAL (Colección completa con filtrado/paginación)
        app.get(vBase, (req, res) => getAllHandler(db, req, res));

        // 4. GET RECURSO ESPECÍFICO
        app.get(vBase + "/:country/:year", (req, res) => {
            const { country, year } = req.params;
            db.findOne({ country: country.toLowerCase(), year: parseInt(year) }, (err, doc) => {
                if (err) return res.status(500).json({ error: "Error en BD" });
                if (!doc) return res.status(404).json({ error: "NOT FOUND" });
                const { _id, ...rest } = doc;
                res.status(200).json(rest);
            });
        });

        // 5. LÓGICA DE ESCRITURA (POST, PUT, DELETE)
        if (base === BASE_URL_API_V2) {
            app.post(vBase, (req, res) => {
                const newData = req.body;
                if (!campos.every(key => Object.keys(newData).includes(key))) {
                    return res.status(400).json({ error: "BAD REQUEST: Estructura incorrecta" });
                }
                newData.country = newData.country.toLowerCase();
                newData.year = parseInt(newData.year);
                db.findOne({ country: newData.country, year: newData.year }, (err, doc) => {
                    if (doc) return res.status(409).json({ error: "CONFLICT: Ya existe" });
                    db.insert(newData, (err) => res.status(201).json({ message: "Creado" }));
                });
            });

            app.put(vBase + "/:country/:year", (req, res) => {
                const { country, year } = req.params;
                const updatedData = req.body;
                if (!updatedData.country || updatedData.country.toLowerCase() !== country.toLowerCase() || parseInt(updatedData.year) !== parseInt(year)) {
                    return res.status(400).json({ error: "BAD REQUEST: ID mismatch" });
                }
                db.update({ country: country.toLowerCase(), year: parseInt(year) }, { $set: updatedData }, {}, (err, num) => {
                    if (num === 0) return res.status(404).json({ error: "NOT FOUND" });
                    db.persistence.compactDatafile();
                    res.status(200).json({ message: "OK actualizado" });
                });
            });

            app.delete(vBase + "/:country/:year", (req, res) => {
                const { country, year } = req.params;
                db.remove({ country: country.toLowerCase(), year: parseInt(year) }, {}, (err, num) => {
                    if (num === 0) return res.status(404).json({ error: "NOT FOUND" });
                    db.persistence.compactDatafile(); // Forzar persistencia para tests
                    res.status(200).json({ message: "OK borrado" });
                });
            });

            app.delete(vBase, (req, res) => {
                db.remove({}, { multi: true }, () => {
                    db.persistence.compactDatafile();
                    res.status(200).json({ message: "OK todos borrados" });
                });
            });
        } else {
            // Respuestas para v1 (Lectura)
            const error405 = (req, res) => res.status(405).json({ error: "v1 es solo lectura" });
            app.post(vBase, error405);
            app.put(vBase + "/:country/:year", error405);
            app.delete(vBase + "/:country/:year", error405);
            app.delete(vBase, error405);
        }

        // 6. DOCUMENTACIÓN Y BLOQUEOS EXTRAS
        app.get(base + "/global-agriculture-climate-impacts/docs", (req, res) => {
            const url = base === BASE_URL_API ? "https://documenter.getpostman.com/view/52404852/2sBXiesEcp" : "https://documenter.getpostman.com/view/52404852/2sBXijHrA5";
            res.redirect(url);
        });
        app.put(vBase, (req, res) => res.status(405).json({ error: "Method Not Allowed" }));
        app.post(vBase + "/:country/:year", (req, res) => res.status(405).json({ error: "Method Not Allowed" }));
    });
}