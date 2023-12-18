const express = require("express");
var session = require('express-session');
var cookieParser = require('cookie-parser');
const app = express();
const qs = require("qs");
const fs = require("fs");
const products = require(__dirname + "/products.json");
const querystring = require('querystring');

app.use(cookieParser());

app.use(session({
    secret: 'secret-key', 
    resave: true,
    saveUninitialized: true
}));

// Function to check if the quantities entered are whole numbers, negative values, and/or a number and not a string; Taken from labs
function isNonNegInt(quantities, returnErrors) {
	errors = []; // assume no errors at first
	if (quantities === '') {
        return returnErrors ? errors : true; // If the input is an empty string, it's considered valid (no action needed).
    }
	if (Number(quantities) != quantities) errors.push(" Not a number"); // Check if string is a number
	if (quantities < 0) errors.push(" Negative value"); // Check to see if it is a non-negative value
	if (parseInt(quantities) != quantities) errors.push(" Not an integer"); // Check to see if it is an integer

	// Determine the return value and store it in 'result', then return that result.
	let result = returnErrors ? errors : errors.length == 0;
	return result;
}

// Routing

// Middleware that helps in parsing incoming requests with URL-encoded payloads.
app.use(express.urlencoded({extended: true}));

// Logs every request made to the server
app.all("*", function (request, response, next) {
	console.log(request.method + " to path " + request.path);
	next();
});

// Test if sessions are working
app.get('/test-session', function (req, res) {
    if (!req.session.views) {
        req.session.views = 1;
    } else {
        req.session.views++;
    }
    res.send(`Number of views: ${req.session.views}`);
});

// Sends the JSON products data as a JavaScript file to the client.
app.get("/products.js", function (request, response, next) {
	response.type(".js");
	let products_str = `var products = ${JSON.stringify(products)};`;
	response.send(products_str);
});

// Route for 'bottoms' category products
app.get('/products/bottoms', function (request, response) {
    response.json(products.bottoms);
});

// Route for 'tops' category products
app.get('/products/tops', function (request, response) {
    response.json(products.tops);
});

// Route for 'accessories' category products
app.get('/products/accessories', function (request, response) {
    response.json(products.accessories);
});

// Handling of the form submission, validates quantities, and redirects to the invoice or back to the form with errors.
app.post("/process_form", function (request, response) {
	console.log("in process_form", request.body);

	let errors = {}; // Object to store errors
	let totalQuantity = 0; // To check if any quantity is selected
	let validItems = {}; // Object to store items with valid quantities

	// Got loop from previous labs and modified
	for (let i in products) {
		let qty = request.body["quantity" + i];

		// Continue over if there's a textbox with 0 quantity.
		if (qty == 0) {
			continue;
		}
		if (qu)
		// If the quantity is valid and non-zero, add it to the validItems object.
		if (isNonNegInt(qty) && Number(qty) > 0) {
			validItems["quantity" + i] = qty;
		}
		// If the quantity is NOT valid or non-zero, add to errors object
		if (!isNonNegInt(qty) || !(Number(qty) > 0)) {
			errors[
				"quantity" + i
			] = `Quantity for ${products[i].name} is not valid (Not a number or is a negative value)`;
		}

		totalQuantity += Number(qty); // Add up all quantities

		// IR3: Check that the quantity entered does not exceed the quantity available as currently available on the server. If it does, change the frame for the textbox to red and display a message “We don’t have xx available.” and reduce the input to the quantity available (replace the input).

		// Check if quantity does not exceed available quantity
		if (Number(qty) > products[i].quantity_available) {
			errors[
				"quantity" + i
			] = `We don't have ${qty} of ${products[i].name} available. Only ${products[i].quantity_available} left.`; // Add error string to errors indicating current stock is less than attempted purchase.

			validItems["quantity" + i] = products[i].quantity_available; // Set input text to current max quantity available.
		}
		// Update the inventory if the purchase is valid
		if (
			isNonNegInt(qty) &&
			Number(qty) > 0 &&
			Number(qty) <= products[i].quantity_available
		) {
			products[i].quantity_available -= Number(qty); // Subtract the purchased quantity from the available quantity
			console.log(
				`Quantity${i} Updated Stock: `,
				products[i].quantity_available
			);
		}
	}
	// If no quantity is selected or all input fields are zero, then add the error string.
	if (totalQuantity === 0) {
		errors["totalQuantity"] =
			"No quantities selected. Please select at least one item.";
	}

	// Converts the request body into a URL-encoded query string.
	let qstr = qs.stringify(validItems);

	console.log("Valid Items: ", validItems);
	console.log("Errors: ", errors);

	// If there are no errors, store the validated items and redirect to login
	if (Object.keys(validItems).length > 0 && Object.keys(errors).length === 0) {
		// Serialize the valid items into a query string
		let qstr = qs.stringify(validItems);
		// Store the product details temporarily
		tempProductDetails = qstr;
		// Redirect to the login page with the items as part of the query string
		response.redirect(`/login.html?${qstr}`);
	} else {
		// If there are errors, redirect back to the products display page with error details
		response.redirect(`products_display.html?error=${JSON.stringify(errors)}`);
	}
});

// Login
// IR4 Keep track of the number of times a user logged in and the last time they logged in. When they login display this information. (will comment "IR4" next to code meant for this requirement)

// Load existing user data or create an empty object if the file does not exist
let user_data = {};
const user_data_file = __dirname + "/user_data.json";
if (fs.existsSync(user_data_file)) {
	user_data = JSON.parse(fs.readFileSync(user_data_file, "utf-8"));
}

// Function to register a new user
function registerUser(email, password, name) {
	user_data[email.toLowerCase()] = {
		name,
		password,
		loginCount: 0, // Initialize login count
		lastLogin: "", // Initialize last login time
	};
	fs.writeFileSync(user_data_file, JSON.stringify(user_data));
}

// Function to validate user registration
function validateRegistration(email, password, name, confirmPassword) {
	let errors = {};

	// Initialize variables to empty strings if they are undefined. Avoids undefined errors.
	email = email || "";
	password = password || "";
	name = name || "";

	// Email validation regex. Got idea for RegEx from Alanna Mellor assignment2. Checks if email is in valid format.
	const emailRegex = /^[a-zA-Z0-9._]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;

	// Check if the email is valid
	if (!email || !emailRegex.test(email)) {
		errors.email = "Invalid email format";
	}

	// Check if the email address is already registered
	if (user_data.hasOwnProperty(email.toLowerCase())) {
		errors.email =
			"The email you have entered already exists, please sign in or use a different email";
	}

	// Password validation
	//IR2**************
	const passwordRegex =
		/^(?=.*[0-9])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-])[^\s]{10,16}$/; // Regular expression for 10-16 characters as well as one special character and number
	if (!passwordRegex.test(password)) {
		errors.password =
			"Password must be between 10 to 16 characters and must contain at least one digit (number) and one special character.";
	}

	// Confirm Password validation
	if (password !== confirmPassword) {
		errors.confirmPassword = "Passwords do not match";
	}

	// Full Name validation
	const nameRegex = /^[A-Za-z\s]{2,30}$/; // Regex for name (only letters and spaces, 2-30 characters)
	if (!nameRegex.test(name)) {
		errors.name = "Full name must be between 2 to 30 letters";
	}
	return errors;
}

// Function to validate user login attempts
function checkLogin(email, password) {
	let user_email = email.toLowerCase();
	if (user_data.hasOwnProperty(user_email)) {
		if (user_data[user_email].password === password) {
			return {success: true};
		} else {
			return {success: false, message: "Wrong password"};
		}
	} else {
		return {success: false, message: "User does not exist"};
	}
}
// Login processing
app.post("/process_login", function (request, response) {
    let loginResult = checkLogin(request.body.email, request.body.password);

    if (loginResult.success) {
        let userEmail = request.body.email.toLowerCase();

        // Update login count and last login time
        if (!user_data[userEmail].loginCount) {
            user_data[userEmail].loginCount = 0;
        }
        user_data[userEmail].loginCount++;
        user_data[userEmail].lastLogin = new Date().toLocaleString();

        // Save the updated user data
        fs.writeFileSync(user_data_file, JSON.stringify(user_data));

        // Save login information in the session
        request.session.isLoggedIn = true;
        request.session.username = user_data[userEmail].name;

        // Redirect to index.html after successful login
        response.redirect('/index.html');
    } else {
        // Construct the return URL with error message
        let returnUrl = "/login.html?error=" + encodeURIComponent(loginResult.message);
        returnUrl += "&email=" + encodeURIComponent(request.body.email);
        response.redirect(returnUrl);
    }
});

// Process User Registration
app.post("/register_user", function (request, response) {
    // Create an object to store registration errors
    let registration_errors = {};

    // Extract user registration data from the request
    let name = request.body.name;
    let email = request.body.email.toLowerCase(); // Convert email to lowercase for consistency
    let password = request.body.password;
    let confirm_password = request.body.confirm_password;

    // Check if the email is already registered
    if (user_data.hasOwnProperty(email)) {
        registration_errors.email_exists = "This email is already registered. Please use a different email.";
    }

    // Check if the password and confirm password match
    if (password !== confirm_password) {
        registration_errors.password_mismatch = "Passwords do not match. Please confirm your password correctly.";
    }

    // Validate the password length (e.g., minimum 6 characters)
    if (password.length < 6) {
        registration_errors.password_length = "Password should be at least 6 characters long.";
    }

    // If there are any registration errors, redirect back to the registration page with error messages
    if (Object.keys(registration_errors).length > 0) {
        // Construct the return URL with error messages and previously entered data
        let returnUrl = "/register.html?";

        for (let error in registration_errors) {
            returnUrl += `&${error}=${encodeURIComponent(registration_errors[error])}`;
        }

        returnUrl += `&name=${encodeURIComponent(name)}`;
        returnUrl += `&email=${encodeURIComponent(email)}`;

        response.redirect(returnUrl);
    } else {
        // Registration successful - create a new user object
        user_data[email] = {
            name: name,
            password: password,
            loginCount: 0,
            lastLogin: null
        };

        // Save the updated user data to a file (you may need to add this part)
        // fs.writeFileSync(user_data_file, JSON.stringify(user_data));

        // Redirect to index.html after successful registration
        response.redirect('/index.html');
    }
});


// Serve static files from the 'public' directory
app.use(express.static(__dirname + "/public"));

// Start the server on port 8080
app.listen(8080, () => console.log(`listening on port 8080`)); 

// Assignment 3 code

// Process and validate tops items that get added to cart from tops_display.html
app.post("/add-to-cart-tops", function (request, response) {
    let product_id = request.body.product_id;
    let quantity = parseInt(request.body[`quantity_${product_id}`]);
    let product = products.tops.find(top => top.product_id === product_id);
    let errors = {};

    // Initialize total quantity for all products
    let totalQuantity = 0;

    if (!product) {
        // Handle case where product is not found
        return response.redirect(`/tops_display.html?error=Product not found&errorProduct=${product_id}`);
    }

    // Check if quantity is NaN or not a valid number
    if (isNaN(quantity) || !isNonNegInt(quantity)) {
        // Handle case where no valid quantity is entered
        errors[product.name] = `Invalid quantity entered`; 
        return response.redirect(`/tops_display.html?${querystring.stringify({ errors: JSON.stringify(errors), errorProduct: product_id })}`);
    }

    if (quantity > product.quantity_available) {
        // Handle quantity exceeding availability
        errors[product.name] = `The quantity selected for exceeds the available quantity. Only ${product.quantity_available} left.`;
        return response.redirect(`/tops_display.html?${querystring.stringify({ errors: JSON.stringify(errors), errorProduct: product_id })}`);
    }

    // Initialize the cart if it doesn't exist
    if (!request.session.cart) {
        request.session.cart = {};
    }

    // Add valid quantities to the session cart
    if (!request.session.cart[product_id]) {
        request.session.cart[product_id] = {
            'item': 'tops',
            'quantity': quantity,
            'image': product.image
        };
    } else {
        request.session.cart[product_id].quantity += quantity;
    }

    // Update total quantity
    totalQuantity += quantity;

    // Update the inventory if the purchase is valid
    if (isNonNegInt(quantity) && quantity > 0 && quantity <= product.quantity_available) {
        product.quantity_available -= quantity;
    }

    // Check if total quantity is zero
    if (totalQuantity === 0) {
        errors["totalQuantity"] = "No quantities selected. Please select at least one item.";
        return response.redirect(`/tops_display.html?${querystring.stringify({ errors: JSON.stringify(errors), errorProduct: product_id })}`);
    }

    // Redirect to the cart page if no errors and display errors if there are any
    if (Object.keys(errors).length > 0) {
        return response.redirect(`/tops_display.html?${querystring.stringify({ errors: JSON.stringify(errors), errorProduct: product_id })}`);
    } else {
        response.redirect(`/cart.html?product_id=${product_id}&quantity=${quantity}`);
    }
});

// Add to Cart for Bottoms
app.post("/add-to-cart-bottoms", function (request, response) {
    let product_id = request.body.product_id;
    let quantity = parseInt(request.body[`quantity_${product_id}`]);
    let product = products.bottoms.find(bottom => bottom.product_id === product_id);
    let errors = {};

    // Initialize total quantity for all products
    let totalQuantity = 0;

    if (!product) {
        // Handle case where product is not found
        return response.redirect(`/bottoms_display.html?error=Product not found&errorProduct=${product_id}`);
    }

    // Check if quantity is NaN or not a valid number
    if (isNaN(quantity) || !isNonNegInt(quantity)) {
        // Handle case where no valid quantity is entered
        errors[product.name] = `Invalid quantity entered`; 
        return response.redirect(`/bottoms_display.html?${querystring.stringify({ errors: JSON.stringify(errors), errorProduct: product_id })}`);
    }

    if (quantity > product.quantity_available) {
        // Handle quantity exceeding availability
        errors[product.name] = `The quantity selected for exceeds the available quantity. Only ${product.quantity_available} left.`;
        return response.redirect(`/bottoms_display.html?${querystring.stringify({ errors: JSON.stringify(errors), errorProduct: product_id })}`);
    }

    // Initialize the cart if it doesn't exist
    if (!request.session.cart) {
        request.session.cart = {};
    }

    // Add valid quantities to the session cart
    if (!request.session.cart[product_id]) {
        request.session.cart[product_id] = {
            'item': 'bottoms',
            'quantity': quantity,
            'image': product.image
        };
    } else {
        request.session.cart[product_id].quantity += quantity;
    }

    // Update total quantity
    totalQuantity += quantity;

    // Update the inventory if the purchase is valid
    if (isNonNegInt(quantity) && quantity > 0 && quantity <= product.quantity_available) {
        product.quantity_available -= quantity;
    }

    // Check if total quantity is zero
    if (totalQuantity === 0) {
        errors["totalQuantity"] = "No quantities selected. Please select at least one item.";
        return response.redirect(`/bottoms_display.html?${querystring.stringify({ errors: JSON.stringify(errors), errorProduct: product_id })}`);
    }

    // Redirect to the cart page if no errors and display errors if there are any
    if (Object.keys(errors).length > 0) {
        return response.redirect(`/bottoms_display.html?${querystring.stringify({ errors: JSON.stringify(errors), errorProduct: product_id })}`);
    } else {
        response.redirect(`/cart.html?product_id=${product_id}&quantity=${quantity}`);
    }
});

// Add to Cart for Accessories
app.post("/add-to-cart-accessories", function (request, response) {
    let product_id = request.body.product_id;
    let quantity = parseInt(request.body[`quantity_${product_id}`]);
    let product = products.accessories.find(accessory => accessory.product_id === product_id);
    let errors = {};

    // Initialize total quantity for all products
    let totalQuantity = 0;

    if (!product) {
        // Handle case where product is not found
        return response.redirect(`/accessories_display.html?error=Product not found&errorProduct=${product_id}`);
    }

    // Check if quantity is NaN or not a valid number
    if (isNaN(quantity) || !isNonNegInt(quantity)) {
        // Handle case where no valid quantity is entered
        errors[product.name] = `Invalid quantity entered`; 
        return response.redirect(`/accessories_display.html?${querystring.stringify({ errors: JSON.stringify(errors), errorProduct: product_id })}`);
    }

    if (quantity > product.quantity_available) {
        // Handle quantity exceeding availability
        errors[product.name] = `The quantity selected for exceeds the available quantity. Only ${product.quantity_available} left.`;
        return response.redirect(`/accessories_display.html?${querystring.stringify({ errors: JSON.stringify(errors), errorProduct: product_id })}`);
    }

    // Initialize the cart if it doesn't exist
    if (!request.session.cart) {
        request.session.cart = {};
    }

    // Add valid quantities to the session cart
    if (!request.session.cart[product_id]) {
        request.session.cart[product_id] = {
            'item': 'accessories',
            'quantity': quantity,
            'image': product.image
        };
    } else {
        request.session.cart[product_id].quantity += quantity;
    }

    // Update total quantity
    totalQuantity += quantity;

    // Update the inventory if the purchase is valid
    if (isNonNegInt(quantity) && quantity > 0 && quantity <= product.quantity_available) {
        product.quantity_available -= quantity;
    }

    // Check if total quantity is zero
    if (totalQuantity === 0) {
        errors["totalQuantity"] = "No quantities selected. Please select at least one item.";
        return response.redirect(`/accessories_display.html?${querystring.stringify({ errors: JSON.stringify(errors), errorProduct: product_id })}`);
    }

    // Redirect to the cart page if no errors and display errors if there are any
    if (Object.keys(errors).length > 0) {
        return response.redirect(`/accessories_display.html?${querystring.stringify({ errors: JSON.stringify(errors), errorProduct: product_id })}`);
    } else {
        response.redirect(`/cart.html?product_id=${product_id}&quantity=${quantity}`);
    }
});

// Route to fetch session data
app.get('/session-data', function (request, response) {
    // Check if the user is logged in
    let isLoggedIn = request.session.isLoggedIn || false;

    // Get the username from the session (if available)
    let username = request.session.username || '';

    // Get the cart count from the session (if available)
    let cartCount = request.session.cart ? Object.keys(request.session.cart).length : 0;

    // Create an object to hold the session data
    let sessionData = {
        isLoggedIn: isLoggedIn,
        username: username,
        cartCount: cartCount
    };

    // Send the session data as JSON
    response.json(sessionData);
});


