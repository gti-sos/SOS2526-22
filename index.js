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