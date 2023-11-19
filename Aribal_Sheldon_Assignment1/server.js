const express = require('express');
const app = express();

const products = require(__dirname + '/products.json');
const qs = require('qs');

// Function to check if the quantities entered are whole numbers, negative values, and/or a number and not a string; Taken from labs
function isNonNegInt(quantities, returnErrors) {
    errors = []; // assume no errors at first
    if (Number(quantities) != quantities) errors.push(' Not a number'); // Check if string is a number
    if (quantities < 0) errors.push(' Negative value'); // Check to see if it is a non-negative value
    if (parseInt(quantities) != quantities) errors.push(' Not an integer'); // Check to see if it is an integer
 
    // Determine the return value and store it in 'result', then return that result. 
    let result = returnErrors ? errors : (errors.length == 0);
    return (result);
 };
 
//routing

app.use(express.urlencoded({ extended: true }));

app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path);
    next(); 
});

app.get("/products.js", function (request, response, next) {
   response.type('.js');
   let products_str = `var products = ${JSON.stringify(products)};`;
   response.send(products_str);
});

app.post("/process_form", function (request, response) {
    console.log('in process+form', request.body);
    
    for (let i in products) {
        let qty = request.body['quantity' + i];
        
        // validate quantities 
        let errors = {}; //assume no errors
        //check if nonnegint
        if (isNonNegInt(qty) === false) {
            errors['quantity0'] = isNonNegInt(qty, true);
        }
        
        let qstr = qs.stringify(request.body)

        // if valid, create invoice
        if (Object.entries(errors.length === 0)) {
            response.redirect(`invoice.html?${qstr}`);
        }
        // check quanitity is available
    
        // not valid, send back to display product 
        else {
            response.redirect(`product_display.html`);
        }
    }
 });

app.get('/test', function (request, response, next) {
    response.send('in route GET to /test');
});

app.use(express.static(__dirname + '/public'));

app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback