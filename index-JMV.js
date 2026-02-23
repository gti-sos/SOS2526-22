// Datos
const datos = [
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

// Elegir pais
const pais = "Afghanistan";

// seleccionamos las filas de Afghanistan
const datosFiltrados = datos.filter(item => item.country === pais);

// extraemos los valores de 'savanna_fire'
const valores = datosFiltrados.map(item => item.savanna_fire);

// calculamos la media
const media = valores.reduce((acc, val) => acc + val, 0) / valores.length;

// Mostrar el resultado por consola
console.log(`La media de savanna_fire para ${pais} es: ${media}`);