

//INDIVIDUAL JULIO

const datosJulio = [
    { country: "Afghanistan", year: 1990, savanna_fire: 14.7237, forest_fire: 0.0557, crop_residues: 205.6077, rice_cultivation: 686, drained_organic: 0, pesticides_manufacturing: 11.807483, food_transport: 63.1152 },
    { country: "Afghanistan", year: 1992, savanna_fire: 14.7237, forest_fire: 0.0557, crop_residues: 196.5341, rice_cultivation: 686, drained_organic: 0, pesticides_manufacturing: 11.712073, food_transport: 53.317 },
    { country: "Albania", year: 1990, savanna_fire: 5.5561, forest_fire: 7.0253, crop_residues: 59.2391, rice_cultivation: 23.52, drained_organic: 110.5705, pesticides_manufacturing: 2, food_transport: 46.9645 },
    { country: "Algeria", year: 1990, savanna_fire: 55.6487, forest_fire: 89.0459, crop_residues: 164.2776, rice_cultivation: 4.312, drained_organic: 0, pesticides_manufacturing: 104, food_transport: 1584.441 },
    { country: "Andorra", year: 2011, savanna_fire: 0, forest_fire: 0, crop_residues: 0, rice_cultivation: 926.342278, drained_organic: 0, pesticides_manufacturing: 11.481085, food_transport: 40.4723 },
    { country: "Bangladesh", year: 1993, savanna_fire: 21.0797, forest_fire: 123.4557, crop_residues: 2144.7412, rice_cultivation: 27569.2659, drained_organic: 18069.5813, pesticides_manufacturing: 39, food_transport: 242.2912 },
    { country: "Barbados", year: 2014, savanna_fire: 0.04, forest_fire: 0, crop_residues: 0.0074, rice_cultivation: 246.407276, drained_organic: 0, pesticides_manufacturing: 18, food_transport: 45.1852 },
    { country: "Cabo Verde", year: 2020, savanna_fire: 0, forest_fire: 0, crop_residues: 0.6426, rice_cultivation: 246.407276, drained_organic: 0, pesticides_manufacturing: 0, food_transport: 20.7055 },
    { country: "Cambodia", year: 1990, savanna_fire: 1201.9436, forest_fire: 4992.8835, crop_residues: 286.9735, rice_cultivation: 8105.6525, drained_organic: 0, pesticides_manufacturing: 13.022934, food_transport: 110.9521 },
    { country: "Comoros", year: 2005, savanna_fire: 3.1239, forest_fire: 36.5227, crop_residues: 2.3846, rice_cultivation: 117.6, drained_organic: 0, pesticides_manufacturing: 0, food_transport: 8.5726 }
];

function calcularMediaJulio(paisElegido) {
    const filtrados = datosJulio.filter(item => item.country === paisElegido);
    if (filtrados.length === 0) return 0;

    const valores = filtrados.map(item => item.savanna_fire);
    const suma = valores.reduce((acc, val) => acc + val, 0);
    return suma / valores.length;
}

const JMV_API_URL = BASE_URL_API + "/co2-emission-gap-among-countries-clustering-pca";
let agriFoodEmissions = []; 

app.get(JMV_API_URL + "/loadInitialData", (req, res) => {
    if (agriFoodEmissions.length === 0) {
        agriFoodEmissions = [...datosJulio]; 
        res.status(200).json(agriFoodEmissions);
    } else {
        res.status(409).send("BAD REQUEST: El array ya tiene datos.");
    }
});

app.get(JMV_API_URL, (req, res) => {
    res.status(200).json(agriFoodEmissions);
});

// POST a la lista (Punto 11.b.i.2 y 3 - Errores 409 y 400)
app.post(JMV_API_URL, (req, res) => {
    const newData = req.body;

    // 1. Validación (Punto 11.b.i.3): ¿Faltan campos o no son números?
    if (!newData.country || !newData.year || 
        newData.savanna_fire === undefined || newData.forest_fire === undefined ||
        newData.crop_residues === undefined || newData.rice_cultivation === undefined ||
        newData.drained_organic === undefined || newData.pesticides_manufacturing === undefined ||
        newData.food_transport === undefined) {
        
        return res.status(400).send("BAD REQUEST: Faltan campos obligatorios o el formato es incorrecto.");
    }

    // 2. Comprobar duplicados (Punto 11.b.i.2): Error 409
    const exists = agriFoodEmissions.some(item => 
        item.country.toLowerCase() === newData.country.toLowerCase() && 
        item.year === parseInt(newData.year)
    );

    if (exists) {
        res.status(409).send("CONFLICT: El recurso ya existe."); 
    } else {
        agriFoodEmissions.push(newData);
        res.status(201).send("CREATED"); 
    }
});

// POST individual no permitido
app.post(JMV_API_URL + "/:country/:year", (req, res) => {
    res.status(405).json({
        error: "Method Not Allowed: No se permite POST sobre un recurso concreto."
    });
});

app.get(JMV_API_URL + "/:country/:year", (req, res) => {
    const { country, year } = req.params;
    const recurso = agriFoodEmissions.find(item => 
        item.country.toLowerCase() === country.toLowerCase() && 
        item.year === parseInt(year)
    );

    if (!recurso) {
        res.status(404).json({ error: "Recurso no encontrado" });
    } else {
        res.status(200).json(recurso);
    }
});

app.put(JMV_API_URL + "/:country/:year", (req, res) => {
    const { country, year } = req.params;
    const updatedData = req.body;
    const intYear = parseInt(year);

    // Comprobamos si el ID de la URL coincide con el ID del cuerpo (JSON)
    if (updatedData.country && updatedData.country.toLowerCase() !== country.toLowerCase() ||
        updatedData.year && parseInt(updatedData.year) !== intYear) {
        
        return res.status(400).send("BAD REQUEST: El ID del recurso no coincide con el del cuerpo.");
    }

    const index = agriFoodEmissions.findIndex(item => 
        item.country.toLowerCase() === country.toLowerCase() && 
        item.year === intYear
    );

    if (index === -1) {
        res.status(404).json({ error: "No se encontró el dato para actualizar" });
    } else {
        agriFoodEmissions[index] = { ...agriFoodEmissions[index], ...updatedData };
        res.status(200).json(agriFoodEmissions[index]);
    }
});

app.delete(JMV_API_URL + "/:country/:year", (req, res) => {
    const { country, year } = req.params;
    const index = agriFoodEmissions.findIndex(item => 
        item.country.toLowerCase() === country.toLowerCase() && 
        item.year === parseInt(year)
    );

    if (index === -1) {
        res.status(404).json({ error: "Recurso no encontrado para borrar" });
    } else {
        agriFoodEmissions.splice(index, 1);
        res.status(200).json({ message: "Recurso eliminado" });
    }
});

app.delete(JMV_API_URL, (req, res) => {
    agriFoodEmissions = [];
    res.status(200).json({ message: "Lista vaciada correctamente" });
});

app.get("/samples/JMV", (req, res) => {
    const pais = "Afghanistan";
    const media = calcularMediaJulio(pais);
    res.send(`La media de savanna_fire para ${pais} es: ${media}`);
});
