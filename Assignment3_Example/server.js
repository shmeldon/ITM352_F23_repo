/* I, Alanna Mellor, am the author of this code. The following program is a simple server designed to serve an eccomerce website. 
The server recieves data from a products_display.html page and validates the data entered by the user. If the data passes all validations, the user is redirected to a login.html page. If the data fails validation, the user remains on the products_display page and is informed of the errors.*/



var express = require('express');
var app = express();
const querystring = require('querystring');
var session = require('express-session');

const nodemailer = require('nodemailer');

// express middleware the automatically de-codes data encoded in a post request and allows it to be accessed through request.body
app.use(express.urlencoded({ extended: true }));

app.use(session({ secret: "MySecretKey", resave: true, saveUninitialized: true }));

var cookieParser = require('cookie-parser');
app.use(cookieParser());


// stores product json data in server memory undet the variable name 'products' and maes it accessible through the root directory and the following json file path
var products = require(__dirname + '/product_data.json');



// Set up session middleware
app.use(
   session({
      secret: 'secretkeyyy',
      resave: false,
      saveUninitialized: true
   })
);


// function to check is quantities entered are (1) whole numbers, (2) not negative, and (3) a number and not a word or character; taken from previous labs
function isNonNegInt(quantities, returnErrors) {
   errors = []; // assume no errors at first
   if (Number(quantities) != quantities) errors.push(' Not a number'); // Check if string is a number value
   if (quantities < 0) errors.push(' Negative value'); // Check if it is non-negative
   if (parseInt(quantities) != quantities) errors.push(' Not an integer'); // Check that it is an integer


   var returnErrors = returnErrors ? errors : (errors.length == 0);
   return (returnErrors);
};

// Routing 

// monitor all requests; this manages what is output in the console for all requests
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);

   // initialize an object to store the cart in the session
   if (typeof request.session['cart'] == 'undefined') {
      request.session['cart'] = {};
   }
   // initialize an object to store the login data in the session
   if (typeof request.session['login'] == 'undefined') {
      request.session['login'] = {};
   }

   // set flag, assume user is not logged in; if the session has the username, then change flag to true
   if (typeof request.session.login.username == 'undefined') {
      request.session.login.loggedIn = false;
   } else {
      request.session.login.loggedIn = true;
   }
   next();
});
// when the server recieves a GET request for "/product_data.js", the server will respong in javascript with a string of data provided by the JSON file
app.get("/product_data.js", function (request, response, next) {
   response.type('.js');
   var products_str = `var products = ${JSON.stringify(products)};\n`;
   response.send(products_str);
});

// Login 
// load file system (fs) interface
var fs = require('fs');

// read user_data file and parse into an object
var filename = __dirname + '/user_data.json';
var user_data_object_JSON = fs.readFileSync(filename, 'utf-8');
var user_data = JSON.parse(user_data_object_JSON);

//route for when users log in; direct to cart page if successful
app.post("/login", function (request, response) {

   // Process login form POST and redirect to logged in page if ok, back to login page if not

   // assign variables to collect the values entered into the username and password fields
   var username = request.body[`uname`].toLowerCase();
   var password = request.body[`psw`];

   // assign empty variable to collect error; alert of incorrect password, or prompt user to create an account if username does not exist 
   var error_check = [];

   // check that all fields have been filled out
   if (username.length == 0 || password.length == 0) {
      error_check.push('Please fill out all fields');
      response.redirect('./login.html?' + querystring.stringify({ error_check: `${JSON.stringify(error_check)}` }));
   }

   // if username does not exist, redirect back to login.html, pass error via query string
   if (!user_data.hasOwnProperty(`${username}`)) {
      error_check.push(`The email you've entered does not exist, please create a new account`);
      response.redirect('./login.html?' + querystring.stringify({ error_check: `${JSON.stringify(error_check)}` }));
   }

   // if username does exist, but password does match, redict back to login.html, pass error via query string
   if (user_data.hasOwnProperty(`${username}`) && password !== user_data[username][`password`]) {
      error_check.push(`Incorrect password for ${username}`);
      response.redirect('./login.html?' + querystring.stringify({ error_check: `${JSON.stringify(error_check)}` }));
   }

   //check if the username exists in the user_data file and that the password matches appropriately
   if (user_data.hasOwnProperty(`${username}`) && password == user_data[username][`password`]) {

      // store the user data in the session
      if (!request.session.login) {
         request.session.login = {};
      }

      // set the flag to indicate that the user is logged in
      request.session.login.loggedIn = true;

      // Store the login email in the session
      request.session.login.username = username;

      console.log(request.session.login);
      response.redirect('./cart.html');
   }
});

// Registration

//store a 'succesful login' variable that will display when the user successfully creates a new account
var successful_login = []

// the following is inspired by assignment 2 code examples
app.post('/registration.html', function (request, response) {
   // process a simple register form
   username = request.body.email.toLowerCase();

   var reg_errors = []; // an empty error to store errors; intended to be passed back to registration page via query string

   // check that all required fields have been filled out
   if (request.body.email == '' || request.body.name == '' || request.body.password == '' || request.body.repeat_password == '') {
      reg_errors.push('Please fill out all fields');
      response.redirect('./registration.html?' + querystring.stringify({ ...request.body, reg_errors: `${JSON.stringify(reg_errors)}` }));

   }

   // Check if the email address is in the correct format; provided by chapt gpt
   function validateEmail(email) {
      // Regular expression to validate email address
      const regex = /^[a-zA-Z0-9._]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;
      return regex.test(String(email).toLowerCase());
   }

   // Check if the email address is already taken
   if (!validateEmail(request.body.email)) {
      reg_errors.push('Please enter a valid email address');
   } else if (user_data.hasOwnProperty(request.body.email.toLowerCase())) {
      reg_errors.push('This email address is already registered. Please use a different email address');
   }

   // Check if password is between 10 and 16 characters long
   if (request.body.password.length < 10 || request.body.password.length > 16) {
      reg_errors.push('Password must be between 10 and 16 characters long');
   }

   // Check if password contains spaces
   if (/\s/.test(request.body.password)) {
      reg_errors.push('Password cannot contain spaces');
   }

   // Check if password and confirm password match
   if (request.body.password !== request.body.repeat_password) {
      reg_errors.push('Passwords do not match.');
   }

   // if validations pass, write new user data to users_data.json file; heavily inspired by Assignment 2 example codes
   if (Object.keys(reg_errors).length == 0) {
      user_data[username] = {};
      user_data[username].name = request.body.name;
      user_data[username].password = request.body.password;
      user_data[username].last_login = '';
      user_data[username].login_count = 0;
      fs.writeFileSync(filename, JSON.stringify(user_data));

      // push this to display when the user return to login after successfully registering a new account 
      successful_login.push(`Your account has been registered!`)
      response.redirect('./login.html?' + querystring.stringify({ successful_login: `${JSON.stringify(successful_login)}` }));
   } else if (reg_errors.length > 0) {

      //make user stay if registration page if there are errors. Pass errors via query string
      response.redirect('./registration.html?' + querystring.stringify({ ...request.body, reg_errors: `${JSON.stringify(reg_errors)}` }));
   }

});

// clear registration errors from query string after the user gets an alert and hits "ok"
app.get('/registration.html', function (request, response) {
   response.sendFile(__dirname + '/public' + '/registration.html');
});

/* enable server to respond to requests for static files (files that are not intended to have any server-processing); files must be located in a directory called "public"; the following uses the Express static middleware component */
app.use(express.static(__dirname + '/public'));

// starts the server; outputs the port in console
app.listen(8080, () => console.log(`listening on port 8080`))

//adding code for assignment3

// set a rout to put product_key in query string every time a user directs to a product page
// using this site for help: https://www.thequantizer.com/javascript-json-get-value-by-key/

// Process and validate light tote items that get added to cart from light_totes.html
app.post("/add_to_cart_light", function (request, response) {
   var quantities = {};

   //assign an empty array to collect all values of the textboxes; use to check that at least texbox has a value
   var all_textboxes = [];

   //assign a variable to collect all errors
   var errors_array = [];

   // run a for loop to collect the values of all of the textboxes and store them in an array
   for (let i = 0; i < products.light_totes.length; i++) {
      all_textboxes.push(request.body[`${products.light_totes[i].name}.quantities`]);
   }


   // use an arrow function; call each element of the array as a parameter, then check that "every" element is equal to an empty string. I learned this by RTFM (A LOT of outside research)
   if (all_textboxes.every(element => element === '')) {
      errors_array.push('Please enter at least one quantity');
      response.redirect('./light_totes.html?' + querystring.stringify({ errors_array: `${JSON.stringify(errors_array)}` }));
   }

   // Loop through the products and get the quantities from the request body
   for (let i = 0; i < products.light_totes.length; i++) {
      var quantity = request.body[`${products.light_totes[i].name}.quantities`];

      // assign a variable to the name of each product -- to be used if there is an error; will alert user where the error occured
      var name = products.light_totes[i].name;

      // assign variable to images
      var image = products.light_totes[i].img;

      // assign a variable which calls the function "isNonNegInt"; this function checks if to see if the user has input a string, negtive number, or decimal
      let errors = isNonNegInt(quantity, true);

      // assign a variable to the quantity available for each product
      var qa = products.light_totes[i].quantityAvailable;

      //if there's an empty textbox, let the loop continue
      if (quantity == 0) {
         continue;
      }

      if (errors.length > 0) {
         errors_array.push(`Invalid Quantity for ${products.light_totes[i].name}`);
      }
      // if the user selects more quantities than are available, push an error into the errors_array
      if (quantity > qa) {
         errors_array.push(`The quantity that you have selected for ${name} exceeds the quantity that we have available`);
      }



      if (errors_array.length == 0) {
         if (quantity) {
            quantities[products.light_totes[i].name] = parseInt(quantity);
         }
         if (!request.session.cart) {
            request.session.cart = {};
         }
         // Store the item data in the session
         var item = 'light_totes';

         if (request.session.cart.item) {
            request.session.cart.item = request.session.cart.item + ',' + item;
         } else {
            request.session.cart.item = [];
            request.session.cart.item = item;
         }

         if (request.session.cart.name) {
            request.session.cart.name = request.session.cart.name + ',' + name;
         } else {
            request.session.cart.name = [];
            request.session.cart.name = name;
         }

         if (request.session.cart.quantities) {
            request.session.cart.quantities = request.session.cart.quantities + ',' + quantity;
         } else {
            request.session.cart.quantities = {};
            request.session.cart.quantities = quantity;
         }
         if (request.session.cart.image) {
            request.session.cart.image = request.session.cart.image + ',' + image;
         } else {
            request.session.cart.image = {};
            request.session.cart.image = image;
         }

         // Assignment 3 IR7: update cart count to reflect that item is in a users cart
         for (let i = 0; i < products.light_totes.length; i++) {
            var quantity = request.body[`${products.light_totes[i].name}.quantities`];

            //if there's a quantity is 0, skip it
            if (quantity == 0) {
               continue;
            }
            products.light_totes[i].cartCount += parseInt(quantity);
         }
         console.log(request.session);
         response.redirect('/cart.html');
      } else {
         response.redirect('./light_totes.html?' + querystring.stringify({ errors_array: `${JSON.stringify(errors_array)}` }));
      }
   }
});



// Process and validate heavy tote items that get added to cart from heavy_totes.html
app.post("/add_to_cart_heavy", function (request, response) {
   var quantities = {};

   //assign an empty array to collect all values of the textboxes; use to check that at least texbox has a value
   var all_textboxes = [];

   //assign a variable to collect all errors
   var errors_array = [];

   // run a for loop to collect the values of all of the textboxes and store them in an array
   for (let i = 0; i < products.heavy_totes.length; i++) {
      all_textboxes.push(request.body[`${products.heavy_totes[i].name}.quantities`]);

   }


   // use an arrow function; call each element of the array as a parameter, then check that "every" element is equal to an empty string. I learned this by RTFM (A LOT of outside research)
   if (all_textboxes.every(element => element === '')) {
      errors_array.push('Please enter at least one quantity');
      response.redirect('./heavy_totes.html?' + querystring.stringify({ errors_array: `${JSON.stringify(errors_array)}` }));
   }

   // Loop through the products and get the quantities from the request body
   for (let i = 0; i < products.heavy_totes.length; i++) {
      var quantity = request.body[`${products.heavy_totes[i].name}.quantities`];

      // assign a variable to the name of each product -- to be used if there is an error; will alert user where the error occured
      var name = products.heavy_totes[i].name;

      // assign variable to images
      var image = products.heavy_totes[i].img;

      // assign a variable which calls the function "isNonNegInt"; this function checks if to see if the user has input a string, negtive number, or decimal
      let errors = isNonNegInt(quantity, true);

      // assign a variable to the quantity available for each product
      var qa = products.heavy_totes[i].quantityAvailable;

      //if there's an empty textbox, let the loop continue
      if (quantity == 0) {
         continue;
      }

      if (errors.length > 0) {
         errors_array.push(`Invalid Quantity for ${products.heavy_totes[i].name}`);
      }
      // if the user selects more quantities than are available, push an error into the errors_array
      if (quantity > qa) {
         errors_array.push(`The quantity that you have selected for ${name} exceeds the quantity that we have available`);
      }



      if (errors_array.length == 0) {
         if (quantity) {
            quantities[products.heavy_totes[i].name] = parseInt(quantity);
         }
         if (!request.session.cart) {
            request.session.cart = {};
         }
         // Store the item data in the session
         var item = 'heavy_totes';

         if (request.session.cart.item) {
            request.session.cart.item = request.session.cart.item + ',' + item;
         } else {
            request.session.cart.item = [];
            request.session.cart.item = item;
         }

         if (request.session.cart.name) {
            request.session.cart.name = request.session.cart.name + ',' + name;
         } else {
            request.session.cart.name = [];
            request.session.cart.name = name;
         }

         if (request.session.cart.quantities) {
            request.session.cart.quantities = request.session.cart.quantities + ',' + quantity;
         } else {
            request.session.cart.quantities = {};
            request.session.cart.quantities = quantity;
         }
         if (request.session.cart.image) {
            request.session.cart.image = request.session.cart.image + ',' + image;
         } else {
            request.session.cart.image = {};
            request.session.cart.image = image;
         }
         // Assignment 3 IR7: update cart count to reflect that item is in a users cart
         for (let i = 0; i < products.heavy_totes.length; i++) {
            var quantity = request.body[`${products.heavy_totes[i].name}.quantities`];

            //if there's a quantity is 0, skip it
            if (quantity == 0) {
               continue;
            }
            products.heavy_totes[i].cartCount += parseInt(quantity);
         }
         console.log(request.session);
         response.redirect('/cart.html');
      } else {
         response.redirect('./heavy_totes.html?' + querystring.stringify({ errors_array: `${JSON.stringify(errors_array)}` }));
      }
   }
});




// Process and validate backpack items that get added to cart from backpacks.html
app.post("/add_to_cart_back", function (request, response) {
   var quantities = {};

   //assign an empty array to collect all values of the textboxes; use to check that at least texbox has a value
   var all_textboxes = [];

   //assign a variable to collect all errors
   var errors_array = [];

   // run a for loop to collect the values of all of the textboxes and store them in an array
   for (let i = 0; i < products.backpacks.length; i++) {
      all_textboxes.push(request.body[`${products.backpacks[i].name}.quantities`]);

   }


   // use an arrow function; call each element of the array as a parameter, then check that "every" element is equal to an empty string. I learned this by RTFM (A LOT of outside research)
   if (all_textboxes.every(element => element === '')) {
      errors_array.push('Please enter at least one quantity');
      response.redirect('./backpacks.html?' + querystring.stringify({ errors_array: `${JSON.stringify(errors_array)}` }));
   }

   // Loop through the products and get the quantities from the request body
   for (let i = 0; i < products.backpacks.length; i++) {
      var quantity = request.body[`${products.backpacks[i].name}.quantities`];

      // assign a variable to the name of each product -- to be used if there is an error; will alert user where the error occured
      var name = products.backpacks[i].name;

      // assign variable to images
      var image = products.backpacks[i].img;

      // assign a variable which calls the function "isNonNegInt"; this function checks if to see if the user has input a string, negtive number, or decimal
      let errors = isNonNegInt(quantity, true);

      // assign a variable to the quantity available for each product
      var qa = products.backpacks[i].quantityAvailable;

      //if there's an empty textbox, let the loop continue
      if (quantity == 0) {
         continue;
      }

      if (errors.length > 0) {
         errors_array.push(`Invalid Quantity for ${products.backpacks[i].name}`);
      }
      // if the user selects more quantities than are available, push an error into the errors_array
      if (quantity > qa) {
         errors_array.push(`The quantity that you have selected for ${name} exceeds the quantity that we have available`);
      }



      if (errors_array.length == 0) {
         for (let i in products) {
            // assign the quantities selected by user to quantity_selected attribute for each object
            products[i].quantity_selected += Number(request.body[`quantities${i}`]);
         }

         if (quantity) {
            quantities[products.backpacks[i].name] = parseInt(quantity);
         }
         if (!request.session.cart) {
            request.session.cart = {};
         }
         // Store the item data in the session
         var item = 'backpacks';

         if (request.session.cart.item) {
            request.session.cart.item = request.session.cart.item + ',' + item;
         } else {
            request.session.cart.item = [];
            request.session.cart.item = item;
         }

         if (request.session.cart.name) {
            request.session.cart.name = request.session.cart.name + ',' + name;
         } else {
            request.session.cart.name = [];
            request.session.cart.name = name;
         }

         if (request.session.cart.quantities) {
            request.session.cart.quantities = request.session.cart.quantities + ',' + quantity;
         } else {
            request.session.cart.quantities = {};
            request.session.cart.quantities = quantity;
         }
         if (request.session.cart.image) {
            request.session.cart.image = request.session.cart.image + ',' + image;
         } else {
            request.session.cart.image = {};
            request.session.cart.image = image;
         }

         // Assignment 3 IR7: update cart count to reflect that item is in a users cart
         for (let i = 0; i < products.backpacks.length; i++) {
            var quantity = request.body[`${products.backpacks[i].name}.quantities`];

            //if there's a quantity is 0, skip it
            if (quantity == 0) {
               continue;
            }
            products.backpacks[i].cartCount += parseInt(quantity);
         }
         console.log(request.session);
         response.redirect('/cart.html');
      } else {
         response.redirect('./backpacks.html?' + querystring.stringify({ errors_array: `${JSON.stringify(errors_array)}` }));
      }
   }
});



// add route to make session data available to html cart file
app.get('/get_cart', function (request, response) {

   if (request.session.cart) {
      cartData = request.session.cart;
   }
   response.json(cartData);

});

//update cart quantities if user desires
//i wrote majority of this code, though for the part that deletes the item, name, and quantity from the session when 0 is entered, I referenced chatgpt
app.post('/update_cart', function (request, response) {
   // Retrieve the updated quantities from the form submission
   var body = request.body;
   var input_quantities = Array.isArray(body.quantities) ? body.quantities : [body.quantities];
   var cart = request.session.cart;

   // Convert input_quantities to an array of numbers if needed
   if (typeof input_quantities === 'number') {
      input_quantities = [input_quantities];
   }
   var items = cart.item.split(',');
   var names = cart.name.split(',');
   var quantities = cart.quantities.split(',');
   var images = cart.image.split(',');

   var updatedItems = [];
   var updatedNames = [];
   var updatedQuantities = [];
   var updatedImages = [];

   for (var i = 0; i < input_quantities.length; i++) {
      var newQuantity = parseInt(input_quantities[i]);

      if (newQuantity > 0) {
         var itemName = names[i];

         updatedItems.push(items[i]);
         updatedNames.push(itemName);
         updatedQuantities.push(newQuantity);
         updatedImages.push(images[i]);
      }
      
       // Update cartCount for heavy totes
       for (var j = 0; j < products.heavy_totes.length; j++) {
         if (products.heavy_totes[j].name === itemName) {
            products.heavy_totes[j].cartCount = newQuantity;
         }
      }
      // Update cartCount for light totes
      for (var j = 0; j < products.light_totes.length; j++) {
         if (products.light_totes[j].name === itemName) {
            products.light_totes[j].cartCount = newQuantity;
         }
      }
      // Update cartCount for backpacks
      for (var j = 0; j < products.backpacks.length; j++) {
         if (products.backpacks[j].name === itemName) {
            products.backpacks[j].cartCount = newQuantity;
         }
      }
   }

   cart.item = updatedItems.join(',');
   cart.name = updatedNames.join(',');
   cart.quantities = updatedQuantities.join(',');
   cart.image = updatedImages.join(',');

   // Assign variable to message that will alert the user that the cart has been updated successfully
   var message = 'Your cart has been updated successfully!';

   response.redirect('/cart.html?' + querystring.stringify({ message: `${JSON.stringify(message)}` }));
});



// when user tries to purchase something, make sure they are logged in. If not, direct them to log in page, else, continue to invoice
app.get('/invoice', function (request, response) {

   console.log(request.session.login)
   // check if the user is already logged in
   if (request.session.login.loggedIn == false) {
      var login_message = 'Please log in to purchase';
      response.redirect('/login.html?' + querystring.stringify({ login_message: `${JSON.stringify(login_message)}` }));

   } else {
      // Assignment 3 IR7: update cart count to reflect that item is in a users cart; reset after user purchases
      var name = request.session.cart.name.split(',');
      var quantities = request.session.cart.quantities.split(',');

      // update cartCount for light totes
      for (let i = 0; i < products.light_totes.length; i++) {
         for (let j = 0; j < name.length; j++) {
            if (name[j] === products.light_totes[i].name) {
               var quantity = parseInt(quantities[j]);
               products.light_totes[i].cartCount -= quantity;

               // update total sold
               products.light_totes[i].total_sold += quantity;

               //update quantity available
               products.light_totes[i].quantityAvailable -= quantity;

            }
         }
      }

      // update cartCount for heavy totes
      for (let i = 0; i < products.heavy_totes.length; i++) {
         for (let j = 0; j < name.length; j++) {
            if (name[j] === products.heavy_totes[i].name) {
               var quantity = parseInt(quantities[j]);
               products.heavy_totes[i].cartCount -= quantity;
               products.heavy_totes[i].total_sold += quantity;
               products.heavy_totes[i].quantityAvailable -= quantity;
            }
         }
      }

      // update cartCount for backpacks
      for (let i = 0; i < products.backpacks.length; i++) {
         for (let j = 0; j < name.length; j++) {
            if (name[j] === products.backpacks[i].name) {
               var quantity = parseInt(quantities[j]);
               products.backpacks[i].cartCount -= quantity;

               //update total sold
               products.backpacks[i].total_sold += quantity;

               //update quantityAvailable
               products.backpacks[i].quantityAvailable -= quantity;
            }
         }
      }
      // skip the login process and redirect to the invoice page
      response.redirect('./invoice.html');
   }
});



// add route to make session data available to html cart file
app.get('/signed_in', function (request, response) {
   if (request.session.login) {
      login_status = request.session.login;
   }
   console.log(login_status);
   response.json(login_status);
});


//if user is logged in, let them have the option to logout. If they log out delete their login info
app.get('/clear_session', function (request, response) {
   delete request.session.login;
   console.log('User logged out.');
   response.redirect('index.html'); // Redirect the user to the desired page after logging out
});

//after user completes their purchase, empty thier cart, update total available
app.get('/clear_cart', function (request, response) {
   // upate quantity available and total sold after purchase is completed
   for (let i in products) {
      products[i].total_sold += products[i].quantity_selected;
      products[i].quantityAvailable -= products[i].quantity_selected;
   }
   delete request.session.cart;
   console.log('the cart has been emptied');
   response.redirect('index.html'); // Redirect the user to the desired page after logging out
});
