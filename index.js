<<<<<<< HEAD
let cool= require ("cool-ascii-faces"); 

let express = require('express');

const app = express();

app.get('/cool', (req, res) => {
  res.send(`<html><body><h1> 
     ${cool()} 
     </h1></body></html>`);
})

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})
=======
let express = require('express');

let bodyParser= require('body-parser')

let BASE_URL_API = "/api/v1";

let PORT = process.env.PORT || 3000;

const app = express();

app.use("/", express.static("./static"));
app.use(bodyParser.json());


let contacts = [
    { name: "Celia", phone: 6789898 },
    { name: "Elena", phone: 6789898 },
    { name: "Julio", phone: 6789898 }
];

app.get(BASE_URL_API + "/contacts", (req, res) => {
    let jsonData = JSON.stringify(contacts, null,2);
    console.log(`JSON Data to be sent: ${jsonData}`);
    res.send(jsonData);
    
});


app.post(BASE_URL_API + "/contacts", (req, res) => {
    let newContact= req.body;
    console.log(`New contact received: ${JSON.stringify(newContact, null,2)}`);
    contacts.push(newContact);
    res.sendStatus(201,"CREATED");
    
});




app.listen(PORT , () => {
    console.log(`Server is running on ${PORT}`);
});
>>>>>>> bd84c62 (api)
