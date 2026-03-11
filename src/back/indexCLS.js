// src/back/indexCLS.js - Backend individual de Celia
import express from "express";

export function loadBackEnd(app) {
  const BASE_URL_API = "/api/v1";

  // Datos iniciales de tu API
  let globalAgricultureData = [
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

  // Redirigir a la documentación de Postman
  app.get(`${BASE_URL_API}/global-agriculture-climate-impacts/docs`, (req, res) => {
    res.redirect("https://documenter.getpostman.com/view/52404852/2sBXiertz6");
  });

  // Cargar datos iniciales
  app.get(`${BASE_URL_API}/global-agriculture-climate-impacts/loadInitialData`, (req, res) => {
    res.status(200).json(globalAgricultureData);
  });

  // GET con filtros
  app.get(`${BASE_URL_API}/global-agriculture-climate-impacts`, (req, res) => {
    const { country, year, from, to } = req.query;
    let results = [...globalAgricultureData];

    if (country) results = results.filter(d => d.country.toLowerCase() === country.toLowerCase());
    if (year) results = results.filter(d => d.year === parseInt(year));
    if (from) results = results.filter(d => d.year >= parseInt(from));
    if (to) results = results.filter(d => d.year <= parseInt(to));

    res.status(200).json(results);
  });

  // GET específico (objeto)
  app.get(`${BASE_URL_API}/global-agriculture-climate-impacts/:country/:year`, (req, res) => {
    const country = req.params.country;
    const year = Number(req.params.year);
    const result = globalAgricultureData.find(item => item.country.toLowerCase() === country.toLowerCase() && item.year === year);

    if (!result) return res.status(404).json({ error: "Dato no encontrado" });
    res.status(200).json(result);
  });

  // POST
  app.post(`${BASE_URL_API}/global-agriculture-climate-impacts`, (req, res) => {
    const newData = req.body;
    newData.year = Number(newData.year);
    newData.average_temperature_c = Number(newData.average_temperature_c);
    newData.total_precipitation_mm = Number(newData.total_precipitation_mm);

    if (!newData.country || !newData.year || !newData.crop_type || isNaN(newData.average_temperature_c) || isNaN(newData.total_precipitation_mm)) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const exists = globalAgricultureData.some(item => item.country.toLowerCase() === newData.country.toLowerCase() && item.year === newData.year);
    if (exists) return res.status(409).json({ error: "El dato ya existe" });

    globalAgricultureData.push(newData);
    res.status(201).json(newData);
  });

  // PUT
  app.put(`${BASE_URL_API}/global-agriculture-climate-impacts/:country/:year`, (req, res) => {
    const country = req.params.country.toLowerCase();
    const year = Number(req.params.year);
    const updatedData = req.body;

    const index = globalAgricultureData.findIndex(item => item.country.toLowerCase() === country && item.year === year);
    if (index === -1) return res.status(404).json({ error: "Dato no encontrado" });

    if (updatedData.country && updatedData.country.toLowerCase() !== country) return res.status(400).json({ error: "Country no coincide con la URL" });
    if (updatedData.year && Number(updatedData.year) !== year) return res.status(400).json({ error: "Year no coincide con la URL" });

    globalAgricultureData[index] = { ...globalAgricultureData[index], ...updatedData };
    res.status(200).json(globalAgricultureData[index]);
  });

  // DELETE específico
  app.delete(`${BASE_URL_API}/global-agriculture-climate-impacts/:country/:year`, (req, res) => {
    const country = req.params.country.toLowerCase();
    const year = Number(req.params.year);

    const index = globalAgricultureData.findIndex(item => item.country.toLowerCase() === country && item.year === year);
    if (index === -1) return res.status(404).json({ error: "Dato no encontrado" });

    globalAgricultureData.splice(index, 1);
    res.status(200).json({ message: "Dato eliminado" });
  });

  // DELETE todos
  app.delete(`${BASE_URL_API}/global-agriculture-climate-impacts`, (req, res) => {
    globalAgricultureData = [];
    res.status(200).json({ message: "Todos los datos eliminados" });
  });

  // Restricciones de métodos
  app.all(`${BASE_URL_API}/global-agriculture-climate-impacts`, (req, res, next) => {
    const allowed = ["GET", "POST", "DELETE"];
    if (!allowed.includes(req.method)) return res.status(405).json({ error: "Method Not Allowed" });
    next();
  });

  app.all(`${BASE_URL_API}/global-agriculture-climate-impacts/:country/:year`, (req, res, next) => {
    const allowed = ["GET", "PUT", "DELETE"];
    if (!allowed.includes(req.method)) return res.status(405).json({ error: "Method Not Allowed" });
    next();
  });
}