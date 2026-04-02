import dataStore from 'nedb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL_API = "/api/v1";
const BASE_URL_API_V2 = "/api/v2";

// Base de datos única 
const db = new dataStore({ 
    filename: path.join(__dirname, '../../data/dataEMM.db'), 
    autoload: true 
});

export function loadBackEnd(app) {

    // ------------- DOCS (ambas versiones) -------------
    app.get(BASE_URL_API + "/ozone-depleting-substance-consumptions/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52404851/2sBXiertqM"); 
    });
    app.get(BASE_URL_API_V2 + "/ozone-depleting-substance-consumptions/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52404851/2sBXihrYaP"); 
    });

    // Datos iniciales (los mismos que tenías)
    const initialDataElena = [
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

    const campos = [
        "country", "code", "year", "methyl_chloroform", 
        "methyl_bromide", "hcfc", "carbon_tetrachloride", 
        "halon", "cfc"
    ];

    // ------------- FUNCIONES AUXILIARES -------------
    function loadInitialDataHandler(req, res) {
        db.find({}, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error en la base de datos" });
            if (docs.length === 0) {
                db.insert(initialDataElena, (err, newDocs) => {
                    if (err) return res.status(500).json({ error: err.message });
                    const result = newDocs.map(({ _id, ...rest }) => rest);
                    res.status(200).json(result);
                });
            } else {
                const result = docs.map(({ _id, ...rest }) => rest);
                res.status(200).json(result);
            }
        });
    }

    function getAllHandler(req, res) {
        const query = {};
        if (req.query.country) query.country = req.query.country.toLowerCase();
        if (req.query.code) query.code = req.query.code.toLowerCase();
        if (req.query.year) query.year = parseInt(req.query.year);
        if (req.query.methyl_chloroform) query.methyl_chloroform = Number(req.query.methyl_chloroform);
        if (req.query.methyl_bromide) query.methyl_bromide = Number(req.query.methyl_bromide);
        if (req.query.hcfc) query.hcfc = Number(req.query.hcfc);
        if (req.query.carbon_tetrachloride) query.carbon_tetrachloride = Number(req.query.carbon_tetrachloride);
        if (req.query.halon) query.halon = Number(req.query.halon);
        if (req.query.cfc) query.cfc = Number(req.query.cfc);

        const page = parseInt(req.query.page);
        const items = parseInt(req.query.items);
        const from = req.query.from ? parseInt(req.query.from) : null;
        const to = req.query.to ? parseInt(req.query.to) : null;

        db.find(query, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error en la base de datos" });

            let filtered = docs;
            if (from !== null) filtered = filtered.filter(d => d.year >= from);
            if (to !== null) filtered = filtered.filter(d => d.year <= to);

            const results = filtered.map(({ _id, ...rest }) => rest);

            if (isNaN(page) || isNaN(items)) {
                res.status(200).json(results);
            } else {
                const pageNum = Math.max(1, page);
                const limitNum = Math.max(1, items);
                const skipNum = (pageNum - 1) * limitNum;
                const paginated = results.slice(skipNum, skipNum + limitNum);
                res.status(200).json({
                    data: paginated,
                    total_items: results.length,
                    pagina_actual: pageNum,
                    items_por_pagina: limitNum,
                    total_paginas: Math.ceil(results.length / limitNum)
                });
            }
        });
    }

    function getOneHandler(req, res) {
        const { country, year } = req.params;
        db.find({ country: country, year: parseInt(year) }, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error en la base de datos" });
            if (docs.length === 0) {
                res.status(404).json({ error: "NOT FOUND: No se encontraron recursos" });
            } else {
                const recurso = docs[0];
                delete recurso._id;
                res.status(200).json(recurso);
            }
        });
    }

    function getByCountryHandler(req, res) {
        const country = req.params.country.toLowerCase();
        const from = req.query.from ? parseInt(req.query.from) : null;
        const to = req.query.to ? parseInt(req.query.to) : null;

        db.find({ country: country }, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error en la base de datos" });

            let filtered = docs;
            if (from !== null) filtered = filtered.filter(d => d.year >= from);
            if (to !== null) filtered = filtered.filter(d => d.year <= to);

            const results = filtered.map(({ _id, ...rest }) => rest);
            res.status(200).json(results);
        });
    }

    function getFiltersHandler(req, res) {
        const { country, year, from, to } = req.query;
        let query = {};
        if (country) query.country = country.toLowerCase();
        if (year) query.year = parseInt(year);

        db.find(query, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error en la base de datos" });
            let results = docs;
            if (from) results = results.filter(d => d.year >= parseInt(from));
            if (to) results = results.filter(d => d.year <= parseInt(to));
            const result = results.map(({ _id, ...rest }) => rest);
            res.status(200).json(result);
        });
    }

    function getFieldHandler(req, res) {
        const field = req.params.field;
        db.find({}, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error en la base de datos" });
            if (docs.length === 0) return res.status(200).json([]);
            if (!docs[0].hasOwnProperty(field)) {
                return res.status(404).json({ error: "NOT FOUND: Field not found" });
            }
            const resultado = docs.map(item => item[field]);
            res.status(200).json(resultado);
        });
    }

    // ------------- RUTAS PARA V1 (solo lectura) -------------
    const v1Base = BASE_URL_API + "/ozone-depleting-substance-consumptions";

    app.get(v1Base + "/loadInitialData", loadInitialDataHandler);
    app.get(v1Base, getAllHandler);
    app.get(v1Base + "/filters", getFiltersHandler);
    app.get(v1Base + "/:country/:year", getOneHandler);

    // PRIMERO la ruta de campo, pero solo si el parámetro es un campo conocido
    app.get(v1Base + "/:field", (req, res, next) => {
        if (campos.includes(req.params.field)) {
            return getFieldHandler(req, res);
        } else {
            next();
        }
    });

    // DESPUÉS la ruta de país
    app.get(v1Base + "/:country", getByCountryHandler);

    // Bloquear métodos de escritura en v1
    app.post(v1Base, (req, res) => res.status(405).json({ error: "Method Not Allowed: v1 es solo lectura" }));
    app.put(v1Base, (req, res) => res.status(405).json({ error: "Method Not Allowed: v1 es solo lectura" }));  // NUEVA
    app.post(v1Base + "/:country/:year", (req, res) => res.status(405).json({ error: "Method Not Allowed: v1 es solo lectura" }));  // NUEVA
    app.put(v1Base + "/:country/:year", (req, res) => res.status(405).json({ error: "Method Not Allowed: v1 es solo lectura" }));
    app.delete(v1Base + "/:country/:year", (req, res) => res.status(405).json({ error: "Method Not Allowed: v1 es solo lectura" }));
    app.delete(v1Base, (req, res) => res.status(405).json({ error: "Method Not Allowed: v1 es solo lectura" }));


    // Control de métodos no permitidos en v1 (solo GET)
    app.all(v1Base, (req, res, next) => {
        if (!['GET'].includes(req.method)) {
            return res.status(405).json({ error: "Method Not Allowed (solo GET en v1)" });
        }
        next();
    });
    app.all(v1Base + "/:country/:year", (req, res, next) => {
        if (!['GET'].includes(req.method)) {
            return res.status(405).json({ error: "Method Not Allowed (solo GET en v1)" });
        }
        next();
    });
    app.all(v1Base + "/:country", (req, res, next) => {
        if (!['GET'].includes(req.method)) {
            return res.status(405).json({ error: "Method Not Allowed (solo GET en v1)" });
        }
        next();
    });

    // ------------- RUTAS PARA V2 (lectura/escritura) -------------
    const v2Base = BASE_URL_API_V2 + "/ozone-depleting-substance-consumptions";

    // Las rutas GET de v2 son iguales que las de v1 pero apuntan a la misma base de datos
    app.get(v2Base + "/loadInitialData", loadInitialDataHandler);
    app.get(v2Base, getAllHandler);
    app.get(v2Base + "/filters", getFiltersHandler);
    app.get(v2Base + "/:country/:year", getOneHandler);

    // Ruta de campo para v2
    app.get(v2Base + "/:field", (req, res, next) => {
        if (campos.includes(req.params.field)) {
            return getFieldHandler(req, res);
        } else {
            next();
        }
    });

    // Ruta de país para v2
    app.get(v2Base + "/:country", getByCountryHandler);

    // POST crear (v2)
    app.post(v2Base, (req, res) => {
        const newData = req.body;
        const requestKeys = Object.keys(newData);
        const hasRequiredKeys = campos.every(key => requestKeys.includes(key));
        const hasSameLength = requestKeys.length === campos.length;

        if (!hasRequiredKeys || !hasSameLength) {
            return res.status(400).json({ error: "BAD REQUEST: El JSON no tiene la estructura de campos esperada" });
        }

        newData.year = parseInt(newData.year);
        newData.methyl_chloroform = Number(newData.methyl_chloroform);
        newData.methyl_bromide = Number(newData.methyl_bromide);
        newData.hcfc = Number(newData.hcfc);
        newData.carbon_tetrachloride = Number(newData.carbon_tetrachloride);
        newData.halon = Number(newData.halon);
        newData.cfc = Number(newData.cfc);

        db.find({ country: newData.country, year: newData.year }, (err, docs) => {
            if (err) return res.status(500).json({ error: "Error en la base de datos" });
            if (docs.length > 0) {
                return res.status(409).json({ error: "CONFLICT: El recurso ya existe para ese país y año" });
            } else {
                db.insert(newData, (err, doc) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.status(201).json({ message: "Recurso creado correctamente" });
                });
            }
        });
    });

    // PUT actualizar (v2)
    app.put(v2Base + "/:country/:year", (req, res) => {
        const { country, year } = req.params;
        const updatedData = req.body;

        const requestKeys = Object.keys(updatedData);
        const hasRequiredKeys = campos.every(key => requestKeys.includes(key));
        const hasSameLength = requestKeys.length === campos.length;

        if (!hasRequiredKeys || !hasSameLength) {
            return res.status(400).json({ error: "BAD REQUEST: El JSON no tiene la estructura de campos esperada" });
        }

        if (updatedData.country.toLowerCase() !== country.toLowerCase() || parseInt(updatedData.year) !== parseInt(year)) {
            return res.status(400).json({ error: "BAD REQUEST: El país o el año no coinciden con la URL" });
        }

        db.update(
            { country: country, year: parseInt(year) },
            { $set: updatedData },
            {},
            (err, numReplaced) => {
                if (err) return res.status(500).json({ error: "Error en la base de datos" });
                if (numReplaced === 0) {
                    return res.status(404).json({ error: "NOT FOUND: No existe el recurso" });
                } else {
                    res.status(200).json({ message: "OK: Recurso actualizado correctamente" });
                }
            }
        );
    });

    // DELETE individual (v2)
    app.delete(v2Base + "/:country/:year", (req, res) => {
        const { country, year } = req.params;
        db.remove({ country: country, year: parseInt(year) }, {}, (err, numRemoved) => {
            if (err) return res.status(500).json({ error: "Error en la base de datos" });
            if (numRemoved === 0) {
                res.status(404).json({ error: "NOT FOUND: No se encuentra el recurso a borrar" });
            } else {
                res.status(200).json({ message: "OK: Recurso eliminado correctamente" });
            }
        });
    });

    // DELETE todos (v2)
    app.delete(v2Base, (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) return res.status(500).json({ error: "Error al eliminar todos los datos" });
            res.status(200).json({ message: "OK: Todos los datos han sido eliminados" });
        });
    });

    // Control de métodos no permitidos en v2
    app.all(v2Base, (req, res, next) => {
        const allowed = ["GET", "POST", "DELETE"];
        if (!allowed.includes(req.method)) {
            return res.status(405).json({ error: "Method Not Allowed (No se permite PUT sobre la lista)" });
        }
        next();
    });
    app.all(v2Base + "/:country/:year", (req, res, next) => {
        const allowed = ["GET", "PUT", "DELETE"];
        if (!allowed.includes(req.method)) {
            return res.status(405).json({ error: "Method Not Allowed (No se permite POST sobre un recurso concreto)" });
        }
        next();
    });
    app.all(v2Base + "/:country", (req, res, next) => {
        const allowed = ["GET"];
        if (!allowed.includes(req.method)) {
            return res.status(405).json({ error: "Method Not Allowed (solo GET en /:country)" });
        }
        next();
    });
}