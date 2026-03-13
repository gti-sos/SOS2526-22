// src/back/indexCLS.js - Backend individual de Celia


import dataStore from "nedb";

const BASE_URL_API = "/api/v1/global-agriculture-climate-impacts";
let db = new dataStore();

export function loadBackEnd(app){

app.get(BASE_URL_API + "/docs",(req,res)=>{
res.redirect("https://documenter.getpostman.com/view/52404852/2sBXiesEcp");
});


const campos=[
"country",
"year",
"crop_type",
"average_temperature_c",
"total_precipitation_mm"
];


let initialData=[
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


// LOAD INITIAL DATA
app.get(BASE_URL_API + "/loadInitialData",(req,res)=>{

db.count({},(err,docs)=>{

if(count===0){

db.insert(initialData,(err,newDocs)=>{

let data=newDocs.map(c=>{
delete c._id
return c
})

res.status(200).json(data)

})

}else{

let data=docs.map(c=>{
delete c._id
return c
})

res.status(200).json(data)

}

})

});


// GET COLECCION (BUSQUEDAS + PAGINACION)

app.get(BASE_URL_API,(req,res)=>{

let query={...req.query}

const limit=parseInt(query.limit)
const offset=parseInt(query.offset)||0

delete query.limit
delete query.offset

db.find(query,(err,docs)=>{

let results=docs

if(!isNaN(limit)){
results=docs.slice(offset,offset+limit)
}

results=results.map(c=>{
delete c._id
return c
})

res.status(200).json(results)

})

});


// GET RECURSO

app.get(BASE_URL_API + "/:country/:year",(req,res)=>{

const country=req.params.country
const year=parseInt(req.params.year)

db.find({country:country,year:year},(err,docs)=>{

if(docs.length===0){

res.status(404).json({error:"NOT FOUND"})

}else{

let recurso=docs[0]
delete recurso._id

res.status(200).json(recurso)

}

})

});


// POST

app.post(BASE_URL_API,(req,res)=>{

const newData=req.body
const requestKeys=Object.keys(newData)

const hasRequiredKeys=campos.every(k=>requestKeys.includes(k))
const hasSameLength=requestKeys.length===campos.length

if(!hasRequiredKeys || !hasSameLength){

return res.status(400).json({error:"BAD REQUEST: estructura incorrecta"})

}

db.find({country:newData.country,year:newData.year},(err,docs)=>{

if(docs.length>0){

return res.status(409).json({error:"CONFLICT: recurso ya existe"})

}else{

db.insert(newData,(err,doc)=>{

delete doc._id

res.status(201).json(doc)

})

}

})

});


// PUT

app.put(BASE_URL_API + "/:country/:year",(req,res)=>{

const country=req.params.country
const year=parseInt(req.params.year)

const updatedData=req.body

const requestKeys=Object.keys(updatedData)

const hasRequiredKeys=campos.every(k=>requestKeys.includes(k))
const hasSameLength=requestKeys.length===campos.length

if(!hasRequiredKeys || !hasSameLength){

return res.status(400).json({error:"BAD REQUEST: estructura incorrecta"})

}

if(updatedData.country!==country || parseInt(updatedData.year)!==year){

return res.status(400).json({error:"BAD REQUEST: id no coincide con URL"})

}

db.update(
{country:country,year:year},
{$set:updatedData},
{},
(err,numUpdated)=>{

if(numUpdated===0){

res.status(404).json({error:"NOT FOUND"})

}else{

res.status(200).json({message:"OK"})

}

})

});


// DELETE RECURSO

app.delete(BASE_URL_API + "/:country/:year",(req,res)=>{

const country=req.params.country
const year=parseInt(req.params.year)

db.remove({country:country,year:year},{},(err,numRemoved)=>{

if(numRemoved===0){

res.status(404).json({error:"NOT FOUND"})

}else{

res.status(200).json({message:"OK deleted"})

}

})

});


// DELETE COLECCION

app.delete(BASE_URL_API,(req,res)=>{

db.remove({}, {multi:true},(err)=>{

res.status(200).json({message:"All data deleted"})

})

});


// METODOS NO PERMITIDOS

app.all(BASE_URL_API,(req,res,next)=>{

const allowed=["GET","POST","DELETE"]

if(!allowed.includes(req.method)){
return res.status(405).json({error:"Method Not Allowed"})
}

next()

})

app.all(BASE_URL_API + "/:country/:year",(req,res,next)=>{

const allowed=["GET","PUT","DELETE"]

if(!allowed.includes(req.method)){
return res.status(405).json({error:"Method Not Allowed"})
}

next()

})

}