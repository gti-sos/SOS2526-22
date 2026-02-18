// Datos de ejemplo
const datos = [
  { year: 2001, country: "India", region: "West Bengal", crop_type: "Corn", average_temperature_c: 155, total_precipitation_mm: 44706 },
  { year: 2024, country: "China", region: "North", crop_type: "Corn", average_temperature_c: 323, total_precipitation_mm: 291357 },
  { year: 2001, country: "France", region: "Ile-de-France", crop_type: "Wheat", average_temperature_c: 2111, total_precipitation_mm: 130174 },
  { year: 2001, country: "Canada", region: "Prairies", crop_type: "Coffee", average_temperature_c: 2785, total_precipitation_mm: 115436 }
  // Puedes agregar más filas si quieres
];

// Elegir la región que quieres analizar
const regionElegida = "North";

// Filtrar por región
const datosFiltrados = datos.filter(item => item.region === regionElegida);

// Extraer valores numéricos
const valores = datosFiltrados.map(item => item.average_temperature_c);

// Calcular media
const media = valores.reduce((acc, val) => acc + val, 0) / valores.length;

console.log(`La media de average_temperature_c para la región ${regionElegida} es: ${media}`);

