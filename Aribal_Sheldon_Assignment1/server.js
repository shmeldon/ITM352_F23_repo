const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));

app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path + 'with qs ' + JSON.stringify(request.query)) ;
    next(); 
});

const products = require(__dirname + '/product_data.json');

app.get("/product_data.js", function (request, response, next) {
   response.type('.js');
   let products_str = `var products = ${JSON.stringify(products)};`;
   response.send(products_str);
});

app.post("/process_form", function (request, response) {
    console.log('in process+form', request.body);
    
    for (let i in product_data) {
        let q = request.body['quantity' + i];
        // validate quantities 
        let errors = {}; //assume no errors
        //check if nonnegint
        if (isNonNegInt(qty) === false) {
            errors['quantity0'] = isNonNegInt(qty, true);
        }
        
        let qstr = qs.stringify(request.body)

        // if valid, create invoice
        if (Object.entries(errors.length === 0)) {
            response.redirect(`invoice.html${qstr}`);
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