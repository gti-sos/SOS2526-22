import Datastore from 'nedb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Datastore({ filename: path.join(__dirname, '../../data/dataJMV.db'), autoload: true });

const datosJulio = [
    { country: "Afghanistan", year: 1990, savanna_fire: 14.7237, forest_fire: 0.0557, crop_residues: 205.6077, rice_cultivation: 686, drained_organic: 0, pesticides_manufacturing: 11.807483, food_transport: 63.1152 },
    { country: "Afghanistan", year: 1992, savanna_fire: 14.7237, forest_fire: 0.0557, crop_residues: 196.5341, rice_cultivation: 686, drained_organic: 0, pesticides_manufacturing: 11.712073, food_transport: 53.317 },
    { country: "Albania", year: 1990, savanna_fire: 5.5561, forest_fire: 7.0253, crop_residues: 59.2391, rice_cultivation: 23.52, drained_organic: 110.5705, pesticides_manufacturing: 2, food_transport: 46.9645 },
    { country: "Algeria", year: 1990, savanna_fire: 55.6487, forest_fire: 89.0459, crop_residues: 164.2776, rice_cultivation: 4.312, drained_organic: 0, pesticides_manufacturing: 104, food_transport: 1584.441 },
    { country: "Andorra", year: 2011, savanna_fire: 0, forest_fire: 0, crop_residues: 0, rice_cultivation: 926.342278, drained_organic: 0, pesticides_manufacturing: 11.481085, food_transport: 40.4723 }
];

export function loadBackEnd(app) {
    const BASE_URL_API = "/api/v1";
    const JMV_API_URL = BASE_URL_API + "/co2-emission-gap-among-countries-clustering-pca";

    const cleanData = (data) => {
        if (Array.isArray(data)) {
            return data.map(d => { delete d._id; return d; });
        }
        if (data) delete data._id;
        return data;
    };

    app.get(JMV_API_URL + "/loadInitialData", (req, res) => {
        db.count({}, (err, count) => {
            if (count > 0) {
                return res.status(409).send("CONFLICT: La base de datos ya tiene datos.");
            }
            db.insert(datosJulio, (err) => {
                if (err) return res.sendStatus(500);
                res.status(200).json(cleanData(datosJulio));
            });
        });
    });

    app.get(JMV_API_URL, (req, res) => {
        let query = {};
        
        if (req.query.country) query.country = req.query.country;
        if (req.query.year) query.year = parseInt(req.query.year);
        if (req.query.savanna_fire) query.savanna_fire = parseFloat(req.query.savanna_fire);
        if (req.query.forest_fire) query.forest_fire = parseFloat(req.query.forest_fire);
        if (req.query.crop_residues) query.crop_residues = parseFloat(req.query.crop_residues);
        if (req.query.rice_cultivation) query.rice_cultivation = parseFloat(req.query.rice_cultivation);
        if (req.query.drained_organic) query.drained_organic = parseFloat(req.query.drained_organic);
        if (req.query.pesticides_manufacturing) query.pesticides_manufacturing = parseFloat(req.query.pesticides_manufacturing);
        if (req.query.food_transport) query.food_transport = parseFloat(req.query.food_transport);

        let offset = parseInt(req.query.offset) || 0;
        let limit = parseInt(req.query.limit) || 100;

        db.find(query).skip(offset).limit(limit).exec((err, data) => {
            if (err) return res.sendStatus(500);
            res.status(200).json(cleanData(data));
        });
    });

    app.post(JMV_API_URL, (req, res) => {
        const newData = req.body;   

        const requiredFields = ["country", "year", "savanna_fire", "forest_fire", "crop_residues", "rice_cultivation", "drained_organic", "pesticides_manufacturing", "food_transport"];
        if (!requiredFields.every(f => f in newData)) {
            return res.status(400).send("BAD REQUEST: Faltan campos obligatorios o el formato es incorrecto.");
        }

        db.findOne({ country: newData.country, year: parseInt(newData.year) }, (err, exists) => {
            if (exists) {
                return res.status(409).send("CONFLICT: El recurso ya existe.");
            }
            newData.year = parseInt(newData.year);
            db.insert(newData, (err) => {
                if (err) return res.sendStatus(500);
                res.sendStatus(201);
            });
        });
    });

    app.get(JMV_API_URL + "/:country/:year", (req, res) => {
        db.findOne({ country: req.params.country, year: parseInt(req.params.year) }, (err, data) => {
            if (err) return res.sendStatus(500);
            if (!data) return res.status(404).send("NOT FOUND: Recurso no encontrado.");
            res.status(200).json(cleanData(data));
        });
    });

    app.put(JMV_API_URL + "/:country/:year", (req, res) => {
        const { country, year } = req.params;
        const updatedData = req.body;

        if (updatedData.country !== country || parseInt(updatedData.year) !== parseInt(year)) {
            return res.status(400).send("BAD REQUEST: El ID del recurso no coincide con el del cuerpo.");
        }

        db.update({ country, year: parseInt(year) }, { $set: updatedData }, {}, (err, numReplaced) => {
            if (err) return res.sendStatus(500);
            if (numReplaced === 0) return res.status(404).send("NOT FOUND: No se encontró el dato para actualizar.");
            res.sendStatus(200);
        });
    });

    app.delete(JMV_API_URL + "/:country/:year", (req, res) => {
        db.remove({ country: req.params.country, year: parseInt(req.params.year) }, {}, (err, numRemoved) => {
            if (err) return res.sendStatus(500);
            if (numRemoved === 0) return res.status(404).send("NOT FOUND: Recurso no encontrado para borrar.");
            res.sendStatus(200);
        });
    });

    app.delete(JMV_API_URL, (req, res) => {
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.sendStatus(500);
            res.sendStatus(200);
        });
    });

    app.post(JMV_API_URL + "/:country/:year", (req, res) => {
        res.status(405).send("Method Not Allowed: No se permite POST sobre un recurso concreto.");
    });

    app.get(JMV_API_URL + "/docs", (req, res) => {
    res.redirect("https://documenter.getpostman.com/view/52411427/2sBXigNZgB");
});
}