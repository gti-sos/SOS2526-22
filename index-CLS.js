// Datos de ejemplo
const datos = [
  { year: 2001, country: "India", region: "West Bengal", crop_type: "Corn", average_temperature_c: 155, total_precipitation_mm: 44706 },
  { year: 2024, country: "China", region: "North", crop_type: "Corn", average_temperature_c: 323, total_precipitation_mm: 291357 },
  { year: 2001, country: "France", region: "Ile-de-France", crop_type: "Wheat", average_temperature_c: 2111, total_precipitation_mm: 130174 },
  { year: 2001, country: "Canada", region: "Prairies", crop_type: "Coffee", average_temperature_c: 2785, total_precipitation_mm: 115436 },
  { year: 2010, country: "Brazil", region: "Sao Paulo", crop_type: "Soy", average_temperature_c: 24.6, total_precipitation_mm: 1420.5 },
  { year: 2015, country: "United States", region: "California", crop_type: "Almond", average_temperature_c: 18.9, total_precipitation_mm: 800.3 },
  { year: 2018, country: "Australia", region: "New South Wales", crop_type: "Wheat", average_temperature_c: 22.4, total_precipitation_mm: 950.8 },
  { year: 2012, country: "Germany", region: "Bavaria", crop_type: "Barley", average_temperature_c: 16.7, total_precipitation_mm: 1100.2 },
  { year: 2019, country: "Mexico", region: "Jalisco", crop_type: "Corn", average_temperature_c: 25.3, total_precipitation_mm: 980.4 },
  { year: 2020, country: "Argentina", region: "Pampas", crop_type: "Soy", average_temperature_c: 23.1, total_precipitation_mm: 1200.6 },

  { year: 2016, country: "China", region: "South", crop_type: "Rice", average_temperature_c: 28.4, total_precipitation_mm: 1800.9 },
  { year: 2013, country: "India", region: "Punjab", crop_type: "Wheat", average_temperature_c: 26.2, total_precipitation_mm: 1020.3 },
  { year: 2017, country: "France", region: "Normandy", crop_type: "Corn", average_temperature_c: 19.4, total_precipitation_mm: 1250.7 },
  { year: 2021, country: "Canada", region: "Ontario", crop_type: "Corn", average_temperature_c: 17.6, total_precipitation_mm: 980.1 },
  { year: 2022, country: "Brazil", region: "Minas Gerais", crop_type: "Coffee", average_temperature_c: 21.8, total_precipitation_mm: 1350.4 }
  // Puedes agregar más filas si quieres
];

// Elegir la región que quieres analizar
const countryElegido = "China";

// Filtrar por región
const datosFiltrados = datos.filter(item => item.country === countryElegido);


// Extraer valores numéricos
const valores = datosFiltrados.map(item => item.average_temperature_c);

// Calcular media
const media = valores.reduce((acc, val) => acc + val, 0) / valores.length;

console.log(`La media de average_temperature_c para el country ${countryElegido} es: ${media}`);


