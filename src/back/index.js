import dataStore from 'nedb';



let BASE_URL_API = "/api/v1";
let db = new dataStore();


 export function loadBackEnd(app){

    let contacts = [
        { name: "Celia", phone: 6789898 },
        { name: "Elena", phone: 6789898 },
        { name: "Julio", phone: 6789898 }
    ];


    db.insert(contacts);




    app.get(BASE_URL_API + "/contacts", (req, res) => {

        db.find({}, (err, contacts) => {
                let jsonData = JSON.stringify(contacts.map((c) =>{
                    delete c._id; return c;
                }), null,2);
                console.log(`JSON Data to be sent: ${jsonData}`);
                res.send(jsonData);
        })


    
        
    });


    app.post(BASE_URL_API + "/contacts", (req, res) => {
        let newContact= req.body;
        db.find({name:contacts})

        console.log(`New contact received: ${JSON.stringify(newContact, null,2)}`);
        db.insert(newContact);
        res.sendStatus(201,"CREATED");
        
    });




}



