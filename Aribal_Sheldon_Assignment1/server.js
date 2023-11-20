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
    console.log('in process_form', request.body);
    
    let errors = {}; // Object to store errors
    let totalQuantity = 0; // To check if any quantity is selected
    let validItems = {};

    // Got loop from previous labs and modified
    for (let i in products) {
        let qty = request.body['quantity' + i];

        // Continue over if there's a textbox with 0 quantity. 
        if (qty == 0) {
            continue;
        }
        if (isNonNegInt(qty) && Number(qty) > 0) {
            // If the quantity is valid and non-zero, add it to the filteredItems object.
            validItems['quantity' + i] = qty;
        }
        totalQuantity += Number(qty); // Add up all quantities

        // Check if quantity does not exceed available quantity
        if (Number(qty) > products[i].availableQuantity) {
            errors['quantity' + i] = `Quantity for ${products[i].name} exceeds available stock.`;
        }
    }
    if (totalQuantity === 0) {
        errors['totalQuantity'] = 'No quantities selected. Please select at least one item.';
    }

    // Converts the request body into a URL-encoded query string. 
    let qstr = qs.stringify(validItems);

        // if valid, create invoice. Revised code from ChatGpt
        if (Object.keys(errors).length === 0) {
            response.redirect(`invoice.html?${qstr}`);
        }

    
        // if not valid, send back to products display page. Passes errors back as well. 
        else {
            response.redirect(`products_display.html?error=${JSON.stringify(errors)}`);
        }
    }
 );

app.get('/test', function (request, response, next) {
    response.send('in route GET to /test');
});

app.use(express.static(__dirname + '/public'));

app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback