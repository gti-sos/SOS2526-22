const Datastore = require("nedb");

let BASE_URL = "/api/v1/global-agriculture-climate-impacts";

let db = new Datastore({
    filename:"global-agriculture-climate-impacts.db",
    autoload:true
});

module.exports = function(app){


// LOAD INITIAL DATA

app.get(BASE_URL + "/loadInitialData",(req,res)=>{

const initialData = [
{ country:"Spain",year:2020,crop_type:"Wheat",average_temperature_c:20,total_precipitation_mm:500 },
{ country:"France",year:2020,crop_type:"Corn",average_temperature_c:19,total_precipitation_mm:450 },
{ country:"Germany",year:2020,crop_type:"Barley",average_temperature_c:17,total_precipitation_mm:480 },
{ country:"Italy",year:2020,crop_type:"Soy",average_temperature_c:21,total_precipitation_mm:470 },
{ country:"Portugal",year:2020,crop_type:"Rice",average_temperature_c:22,total_precipitation_mm:460 },
{ country:"Greece",year:2020,crop_type:"Olive",average_temperature_c:25,total_precipitation_mm:430 },
{ country:"Norway",year:2020,crop_type:"Barley",average_temperature_c:10,total_precipitation_mm:300 },
{ country:"Sweden",year:2020,crop_type:"Wheat",average_temperature_c:11,total_precipitation_mm:310 },
{ country:"Finland",year:2020,crop_type:"Corn",average_temperature_c:8,total_precipitation_mm:290 },
{ country:"Poland",year:2020,crop_type:"Soy",average_temperature_c:16,total_precipitation_mm:320 }
];

db.count({},(err,count)=>{

if(count===0){
db.insert(initialData);
return res.status(201).json(initialData);
}

res.sendStatus(200);

});

});


// GET COLLECTION

app.get(BASE_URL,(req,res)=>{

let query={};

if(req.query.country) query.country=req.query.country;
if(req.query.year) query.year=Number(req.query.year);

let limit=parseInt(req.query.limit);
let offset=parseInt(req.query.offset);

db.find(query,{_id:0})
.skip(offset||0)
.limit(limit||0)
.exec((err,data)=>{

res.status(200).json(data);

});

});


// GET RESOURCE

app.get(BASE_URL+"/:country/:year",(req,res)=>{

let country=req.params.country;
let year=Number(req.params.year);

db.findOne({country:country,year:year},{_id:0},(err,data)=>{

if(!data) return res.sendStatus(404);

res.status(200).json(data);

});

});


// POST

app.post(BASE_URL,(req,res)=>{

let newData=req.body;

if(!newData.country || !newData.year){
return res.sendStatus(400);
}

db.findOne({country:newData.country,year:newData.year},(err,data)=>{

if(data) return res.sendStatus(409);

db.insert(newData,(err,newDoc)=>{

delete newDoc._id;

res.status(201).json(newDoc);

});

});

});


// PUT

app.put(BASE_URL+"/:country/:year",(req,res)=>{

let country=req.params.country;
let year=Number(req.params.year);

db.update(
{country:country,year:year},
{$set:req.body},
{},
(err,numUpdated)=>{

if(numUpdated===0) return res.sendStatus(404);

res.sendStatus(200);

});

});


// DELETE RESOURCE

app.delete(BASE_URL+"/:country/:year",(req,res)=>{

let country=req.params.country;
let year=Number(req.params.year);

db.remove({country:country,year:year},{},(err,numRemoved)=>{

if(numRemoved===0) return res.sendStatus(404);

res.sendStatus(200);

});

});


// DELETE COLLECTION

app.delete(BASE_URL,(req,res)=>{

db.remove({}, {multi:true}, ()=>{

res.sendStatus(200);

});

});


// DOCS

app.get(BASE_URL+"/docs",(req,res)=>{

res.redirect("AQUI_TU_LINK_DE_POSTMAN");

});

};