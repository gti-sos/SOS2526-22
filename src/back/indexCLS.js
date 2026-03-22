import dataStore from 'nedb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL_API = "/api/v1";

// Inicialización de la base de datos NeDB
const dbV1 = new dataStore({ 
    filename: path.join(__dirname, '../../data/dataCLS-v1.db'), 
    autoload: true 
});

export function loadBackEnd(app) {

    // Datos iniciales para loadInitialData
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

    const camposObligatorios = ["country", "year", "crop_type", "average_temperature_c", "total_precipitation_mm"];

    const resourcePath = BASE_URL_API + "/global-agriculture-climate-impacts";

    // 1. RECURSO LOAD INITIAL DATA (Corregido para evitar Error 500)
   app.get(resourcePath + "/loadInitialData", (req, res) => {
        // 1. Vaciamos la base de datos por completo
        dbV1.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) return res.status(500).json({ error: "Error al vaciar la base de datos" });

            // 2. Creamos una copia limpia para evitar problemas de referencia
            const dataToInsert = JSON.parse(JSON.stringify(initialData));

            // 3. Insertamos los datos
            dbV1.insert(dataToInsert, (err, newDocs) => {
                if (err) {
                    console.error("DETALLE DEL ERROR EN CONSOLA:", err); // MIRA TU TERMINAL AQUÍ
                    return res.status(500).json({ error: "Insert error", detalle: err.message });
                }
                
                // 4. Devolvemos los datos sin el _id para que el test no se queje
                const cleanDocs = newDocs.map(d => {
                    const { _id, ...rest } = d;
                    return rest;
                });
                res.status(200).json(cleanDocs);
            });
        });
    });

    // 2. GET ALL (Con búsqueda, paginación y filtros)
    app.get(resourcePath, (req, res) => {
        let query = {};
        
        // Filtros exactos
        if (req.query.country) query.country = req.query.country;
        if (req.query.year) query.year = parseInt(req.query.year);
        if (req.query.crop_type) query.crop_type = req.query.crop_type;

        // Filtros de rango (from/to)
        if (req.query.from || req.query.to) {
            query.year = {};
            if (req.query.from) query.year.$gte = parseInt(req.query.from);
            if (req.query.to) query.year.$lte = parseInt(req.query.to);
        }

        // Paginación (CRÍTICO para que pase el test de limit)
        let offset = parseInt(req.query.offset) || 0; 
        let limit = parseInt(req.query.limit) || 1000; // Si no hay limit, ponemos uno grande

        // 2. Aplicamos skip y limit en la consulta de NeDB
        dbV1.find(query).skip(offset).limit(limit).exec((err, docs) => {
            if (err) {
                return res.status(500).json({ error: "Error en la base de datos" });
            }
            
            // Limpiamos los documentos para quitar el _id
        const result = docs.map(({ _id, ...rest }) => rest);
        
        // 3. Enviamos la respuesta (ahora sí vendrán solo 2 si limit=2)
        res.status(200).json(result);
        });
    });

    // 3. POST (Añadir recurso)
    app.post(resourcePath, (req, res) => {
        const newData = req.body;
        const keys = Object.keys(newData);

        // Validar formato
        if (keys.length !== camposObligatorios.length || !camposObligatorios.every(k => keys.includes(k))) {
            return res.status(400).json({ error: "BAD REQUEST: Formato incorrecto" });
        }

        newData.year = parseInt(newData.year);

        // Comprobar si ya existe (Conflict)
        dbV1.findOne({ country: newData.country, year: newData.year }, (err, doc) => {
            if (doc) return res.status(409).json({ error: "CONFLICT: Ya existe el recurso" });
            
            dbV1.insert(newData, (err, inserted) => {
                const { _id, ...rest } = inserted;
                res.status(201).json(rest);
            });
        });
    });

    // 4. GET ONE (Recurso específico por país y año)
    app.get(resourcePath + "/:country/:year", (req, res) => {
        const country = req.params.country;
        const year = parseInt(req.params.year);

        dbV1.findOne({ country: new RegExp("^" + country + "$", "i"), year: year }, (err, doc) => {
            if (!doc) return res.status(404).json({ error: "NOT FOUND" });
            const { _id, ...rest } = doc;
            res.status(200).json(rest);
        });
    });

    // 5. PUT (Actualizar recurso específico)
    app.put(resourcePath + "/:country/:year", (req, res) => {
        const countryReq = req.params.country;
        const yearReq = parseInt(req.params.year);
        const updatedData = req.body;

        // Comprobamos que el ID de la URL coincide con el Body
        if (updatedData.country !== countryReq || parseInt(updatedData.year) !== yearReq) {
            return res.status(400).json({ error: "BAD REQUEST: El ID no coincide" });
        }

        dbV1.update({ country: countryReq, year: yearReq }, { $set: updatedData }, {}, (err, numReplaced) => {
            if (numReplaced === 0) return res.status(404).json({ error: "NOT FOUND" });
            res.status(200).json(updatedData); // Devolvemos el objeto para el test de Postman
        });
    });

    // 6. DELETE ONE
    app.delete(resourcePath + "/:country/:year", (req, res) => {
        const country = req.params.country;
        const year = parseInt(req.params.year);

        dbV1.remove({ country: new RegExp("^" + country + "$", "i"), year: year }, {}, (err, numRemoved) => {
            if (numRemoved === 0) return res.status(404).json({ error: "NOT FOUND" });
            res.status(200).json({ message: "OK" });
        });
    });

    // 7. DELETE ALL
    app.delete(resourcePath, (req, res) => {
        dbV1.remove({}, { multi: true }, (err) => {
            res.status(200).json({ message: "OK" });
        });
    });

    // 8. MÉTODOS NO PERMITIDOS
    app.post(resourcePath + "/:country/:year", (req, res) => res.sendStatus(405));
    app.put(resourcePath, (req, res) => res.sendStatus(405));

}