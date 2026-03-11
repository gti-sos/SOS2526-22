/////INDIVIDUAL ELENA 
import dataStore from 'nedb';
const BASE_URL_API = "/api/v1";
 let db = new dataStore();

export function loadBackEnd(app) {


    app.get("/api/v1/ozone-depleting-substance-consumptions/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52404851/2sBXiertqM"); 
    });

    
    let initialDataElena = [
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

    // Carga de datos iniciales
    app.get(BASE_URL_API + "/ozone-depleting-substance-consumptions/loadInitialData", (req, res) => {
        db.find({}, (err, docs) => {
            // Si la base de datos está vacía, insertamos los datos iniciales
            if (docs.length === 0) {
                db.insert(initialDataElena, (err, newDocs) => {
                    let jsonData = JSON.stringify(newDocs.map((c) => {
                        delete c._id; 
                        return c;
                    }), null, 2);
                    res.status(200).send(jsonData);
                });
            } else {
                // Si ya hay datos, devolvemos los existentes
                let jsonData = JSON.stringify(docs.map((c) => {
                    delete c._id;
                    return c;
                }), null, 2);

                res.status(200).send(jsonData);
            }
        });
    });

    // GET de la lista completa 
    app.get(BASE_URL_API + "/ozone-depleting-substance-consumptions", (req, res) => {
        
        db.find({}, (err, docs) => {
            let jsonData = JSON.stringify(docs.map((c) => {
                delete c._id; 
                return c;
            }), null, 2);

            res.status(200).send(jsonData);
        });
    });


    // GET de un recurso específico (País y Año)
    app.get(`${BASE_URL_API}/ozone-depleting-substance-consumptions/:country/:year`, (req, res) => {
        const { country, year } = req.params;

        db.find({ country: country, year: parseInt(year) }, (err, docs) => {
            
            if (docs.length === 0) {
                res.status(404).json({ error: "NOT FOUND: No se encontraron recursos" });
            } else {
                let jsonData = JSON.stringify(docs.map((c) => {
                    delete c._id; 
                    return c;
                }), null, 2); 
                
                res.status(200).send(jsonData);
            }
        });
    });

    // GET con filtros usando NeDB
    app.get(`${BASE_URL_API}/ozone-depleting-substance-consumptions/filters`, (req, res) => {
        const { country, year, from, to } = req.query;

        let query = {};
        
        if (country) {
            query.country = country.toLowerCase();
        }
        if (year) {
            query.year = parseInt(year);
        }

        db.find(query, (err, docs) => {
            let results = docs;

            if (from) {
                results = results.filter(d => d.year >= parseInt(from));
            }
            if (to) {
                results = results.filter(d => d.year <= parseInt(to));
            }

            let jsonData = JSON.stringify(results.map((c) => {
                delete c._id; 
                return c;
            }), null, 2);

            res.status(200).send(jsonData);
        });
    });


    // GET por campo específico 
    app.get(BASE_URL_API + "/ozone-depleting-substance-consumptions/:field", (req, res) => {
        const field = req.params.field;

        db.find({}, (err, docs) => {
            
            // Vemos si la base de datos está vacía
            if (docs.length === 0) {
                return res.status(200).send(JSON.stringify([], null, 2));
            }

            // Vemos si el campo existe en el primer objeto recuperado
            if (!docs[0].hasOwnProperty(field)) {
                return res.status(404).json({ error: "NOT FOUND: Field not found" });
            }

        
            const resultado = docs.map(item => item[field]);

            let jsonData = JSON.stringify(resultado, null, 2);
            res.status(200).send(jsonData);
        });
    });


    // POST para agregar un nuevo dato (NeDB)
    app.post(`${BASE_URL_API}/ozone-depleting-substance-consumptions`, (req, res) => {
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

        // 3. Comprobar si el recurso ya existe 
        db.find({ country: newData.country, year: newData.year }, (err, docs) => {
            if (docs.length > 0) {
                return res.status(409).json({ error: "CONFLICT: El recurso ya existe para ese país y año" });
            } else {
                // 4. Si no existe, lo insertamos
                db.insert(newData, (err, doc) => {
                    delete doc._id;
                    let jsonData = JSON.stringify(doc, null, 2);
                    
                    res.status(201).send(jsonData);
                });
            }
        });
    });

    

    // PUT para actualizar un recurso específico 
  
    app.put(`${BASE_URL_API}/ozone-depleting-substance-consumptions/:country/:year`, (req, res) => {
        const { country, year } = req.params;
        const updatedData = req.body;

        const requestKeys = Object.keys(updatedData);

        // Comprobamos que están todas las necesarias Y que no hay ninguna extra
        const hasRequiredKeys = campos.every(key => requestKeys.includes(key));
        const hasSameLength = requestKeys.length === campos.length;

        if (!hasRequiredKeys || !hasSameLength) {
            return res.status(400).json({ error: "BAD REQUEST: El JSON no tiene la estructura de campos esperada" });
        }

        if (updatedData.country.toLowerCase() !== country.toLowerCase() || parseInt(updatedData.year) !== parseInt(year)) {
            return res.status(400).json({ error: "BAD REQUEST: El país o el año no coinciden con la URL" });
        }

        // Actualizamos la base de datos
        db.update(
            { country: country, year: parseInt(year) },
            { $set: updatedData },
            {},
            (err, numReplaced) => {
                if (numReplaced === 0) {
                    return res.status(404).json({ error: "NOT FOUND: No existe el recurso" });
                } else {
                    res.status(200).json({ message: "OK: Recurso actualizado correctamente" });
                }
            }
        );
    });



    // DELETE de un recurso específico 
    app.delete(`${BASE_URL_API}/ozone-depleting-substance-consumptions/:country/:year`, (req, res) => {
        const { country, year } = req.params;

        db.remove({ country: country, year: parseInt(year) }, {}, (err, numRemoved) => {
            
            if (numRemoved === 0) {
                res.status(404).json({ error: "NOT FOUND: No se encuentra el recurso a borrar" });
            } else {
                res.status(200).json({ message: "OK: Recurso eliminado correctamente" });
            }
        });
    });

    // DELETE de todos los recursos
    app.delete(`${BASE_URL_API}/ozone-depleting-substance-consumptions`, (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            res.status(200).json({ message: "OK: Todos los datos han sido eliminados" });
        });
    });



    // Control de métodos no permitidos para la ruta base
    app.all(`${BASE_URL_API}/ozone-depleting-substance-consumptions`, (req, res, next) => {
        const allowed = ["GET", "POST", "DELETE"];
        if (!allowed.includes(req.method)) {
            return res.status(405).json({ error: "Method Not Allowed (No se permite PUT sobre la lista)" });
        }
        next();
    });

    // Control de métodos no permitidos para recursos concretos
    app.all(`${BASE_URL_API}/ozone-depleting-substance-consumptions/:country/:year`, (req, res, next) => {
        const allowed = ["GET", "PUT", "DELETE"];
        if (!allowed.includes(req.method)) {
            return res.status(405).json({ error: "Method Not Allowed (No se permite POST sobre un recurso concreto)" });
        }
        next();
    });
}