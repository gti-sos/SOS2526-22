


import dataStore from 'nedb';
const BASE_URL_API = "/api/v1";
 let db = new dataStore();

export function loadBackEnd(app) {

    // Documentación
    app.get(`${BASE_URL_API}/global-agriculture-climate-impacts/docs`, (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52404851/2sBXiertqM"); 
    });

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

    const campos = ["country","year","crop_type","average_temperature_c","total_precipitation_mm"];

    // LoadInitialData
    app.get(`${BASE_URL_API}/global-agriculture-climate-impacts/loadInitialData`, (req, res) => {
        db.find({}, (err, docs) => {
            if (docs.length === 0) {
                db.insert(initialData, (err, newDocs) => {
                    const resultado = newDocs.map(d => {
                        delete d._id;
                        return d;
                    });
                    res.status(200).json(resultado);
                });
            } else {
                const resultado = docs.map(d => {
                    delete d._id;
                    return d;
                });
                res.status(200).json(resultado);
            }
        });
    });

    // GET lista completa + paginación
    app.get(`${BASE_URL_API}/global-agriculture-climate-impacts`, (req, res) => {
        const page = parseInt(req.query.page);
        const items = parseInt(req.query.items);

        if (isNaN(page) || isNaN(items)) {
            return db.find({}, (err, docs) => {
                const resultado = docs.map(({ _id, ...rest }) => rest);
                res.status(200).json(resultado);
            });
        }

        const pageNum = Math.max(1, page);
        const limitNum = Math.max(1, items);
        const skipNum = (pageNum - 1) * limitNum;

        db.count({}, (err, totalCount) => {
            if (err) return res.status(500).json({ error: "Error en la base de datos" });

            db.find({})
                .skip(skipNum)
                .limit(limitNum)
                .exec((err, data) => {
                    if (err) return res.status(500).json({ error: "Error al acceder a los datos" });

                    const resultado = data.map(({ _id, ...rest }) => rest);
                    res.status(200).json({
                        data: resultado,
                        total_items: totalCount,
                        pagina_actual: pageNum,
                        items_por_pagina: limitNum,
                        total_paginas: Math.ceil(totalCount / limitNum)
                    });
                });
        });
    });

    // GET recurso específico (country + year)
    app.get(`${BASE_URL_API}/global-agriculture-climate-impacts/:country/:year`, (req, res) => {
        const { country, year } = req.params;

        db.find({ country, year: parseInt(year) }, (err, docs) => {
            if (docs.length === 0) return res.status(404).json({ error: "NOT FOUND: No se encontró recurso" });

            const recurso = docs[0];
            delete recurso._id;
            res.status(200).json(recurso);
        });
    });

    // GET filtros por query (country, year, from, to)
app.get(`${BASE_URL_API}/global-agriculture-climate-impacts/filters`, (req, res) => {
    const query = {};
    for(const key of Object.keys(req.query)) {
        if(key === "year" || key === "average_temperature_c" || key === "total_precipitation_mm") {
            query[key] = parseInt(req.query[key]);
        } else {
            query[key] = req.query[key]; // texto sin minúsculas forzado
        }
    }

    db.find(query, (err, docs) => {
        if(err) return res.status(500).json({ error: "Error al buscar en DB" });
        const resultado = docs.map(({_id, ...rest}) => rest);
        res.status(200).json(resultado);
    });
});




    // POST nuevo recurso
    app.post(`${BASE_URL_API}/global-agriculture-climate-impacts`, (req, res) => {
        const newData = req.body;
        const keys = Object.keys(newData);

        const hasAllKeys = campos.every(c => keys.includes(c));
        const sameLength = keys.length === campos.length;

        if (!hasAllKeys || !sameLength) return res.status(400).json({ error: "BAD REQUEST: JSON incompleto o incorrecto" });

        newData.year = parseInt(newData.year);
        newData.average_temperature_c = Number(newData.average_temperature_c);
        newData.total_precipitation_mm = Number(newData.total_precipitation_mm);

        db.find({ country: newData.country, year: newData.year }, (err, docs) => {
            if (docs.length > 0) return res.status(409).json({ error: "CONFLICT: Recurso ya existe" });

            db.insert(newData, (err, doc) => {
                delete doc._id;
                res.status(201).json(doc);
            });
        });
    });

    // PUT recurso específico
    app.put(`${BASE_URL_API}/global-agriculture-climate-impacts/:country/:year`, (req, res) => {
        const { country, year } = req.params;
        const updatedData = req.body;
        const keys = Object.keys(updatedData);

        const hasAllKeys = campos.every(c => keys.includes(c));
        const sameLength = keys.length === campos.length;

        if (!hasAllKeys || !sameLength) return res.status(400).json({ error: "BAD REQUEST: JSON incompleto o incorrecto" });
        if (updatedData.country !== country || parseInt(updatedData.year) !== parseInt(year)) return res.status(400).json({ error: "BAD REQUEST: country o year no coincide con URL" });

        db.update({ country, year: parseInt(year) }, { $set: updatedData }, {}, (err, numReplaced) => {
            if (numReplaced === 0) return res.status(404).json({ error: "NOT FOUND: No existe recurso" });
            res.status(200).json({ message: "OK: Recurso actualizado correctamente" });
        });
    });

    // DELETE recurso específico
    app.delete(`${BASE_URL_API}/global-agriculture-climate-impacts/:country/:year`, (req, res) => {
        const { country, year } = req.params;

        db.remove({ country, year: parseInt(year) }, {}, (err, numRemoved) => {
            if (numRemoved === 0) return res.status(404).json({ error: "NOT FOUND: No existe recurso" });
            res.status(200).json({ message: "OK: Recurso eliminado correctamente" });
        });
    });

    // DELETE todos los recursos
    app.delete(`${BASE_URL_API}/global-agriculture-climate-impacts`, (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            res.status(200).json({ message: "OK: Todos los datos eliminados" });
        });
    });

    // Métodos no permitidos para lista
    app.all(`${BASE_URL_API}/global-agriculture-climate-impacts`, (req, res, next) => {
        const allowed = ["GET","POST","DELETE"];
        if (!allowed.includes(req.method)) return res.status(405).json({ error: "Method Not Allowed" });
        next();
    });

    // Métodos no permitidos para recurso específico
    app.all(`${BASE_URL_API}/global-agriculture-climate-impacts/:country/:year`, (req, res, next) => {
        const allowed = ["GET","PUT","DELETE"];
        if (!allowed.includes(req.method)) return res.status(405).json({ error: "Method Not Allowed" });
        next();
    });
}