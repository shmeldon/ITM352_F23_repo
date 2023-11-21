const express = require("express");
const app = express();

const products = require(__dirname + "/products.json");
const qs = require("qs");

// Function to check if the quantities entered are whole numbers, negative values, and/or a number and not a string; Taken from labs
function isNonNegInt(quantities, returnErrors) {
	errors = []; // assume no errors at first
	if (Number(quantities) != quantities) errors.push(" Not a number"); // Check if string is a number
	if (quantities < 0) errors.push(" Negative value"); // Check to see if it is a non-negative value
	if (parseInt(quantities) != quantities) errors.push(" Not an integer"); // Check to see if it is an integer

	// Determine the return value and store it in 'result', then return that result.
	let result = returnErrors ? errors : errors.length == 0;
	return result;
}

//routing

//middleware that helps in parsing incoming requests with URL-encoded payloads.
app.use(express.urlencoded({extended: true}));

//logs every request made to the server
app.all("*", function (request, response, next) {
	console.log(request.method + " to path " + request.path);
	next();
});

//Sends the JSON products data as a JavaScript file to the client.
app.get("/products.js", function (request, response, next) {
	response.type(".js");
	let products_str = `var products = ${JSON.stringify(products)};`;
	response.send(products_str);
});

//Handling of the form submission, validates quantities, and redirects to the invoice or back to the form with errors.
app.post("/process_form", function (request, response) {
	console.log("in process_form", request.body);

	let errors = {}; // Object to store errors
	let totalQuantity = 0; // To check if any quantity is selected
	let validItems = {}; //Objest to store items with valid quantities

	// Got loop from previous labs and modified
	for (let i in products) {
		let qty = request.body["quantity" + i];

		// Continue over if there's a textbox with 0 quantity.
		if (qty == 0) {
			continue;
		}
		// If the quantity is valid and non-zero, add it to the validItems object.
		if (isNonNegInt(qty) && Number(qty) > 0) {
			validItems["quantity" + i] = qty;
		}
		// If the quantity is NOT valid or non-zero, add to errors object
		if (!isNonNegInt(qty) | (!Number(qty) > 0)) {
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
			console.log(`Quantity${i} Updated Stock: `, products[i].quantity_available);
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

	// if valid, create invoice. Revised code from ChatGpt
	if (Object.keys(validItems).length > 0 && Object.keys(errors).length === 0) {
		response.redirect(`invoice.html?purchase_submit=true&${qstr}`); //redirects the user to 'invoice.html' with the query string appended.
	}
	// if not valid, send back to products display page. Passes errors back as well.
	else {
		response.redirect(`products_display.html?error=${JSON.stringify(errors)}`);
	}
});

// Serve static files from the 'public' directory
app.use(express.static(__dirname + "/public"));

// Stats the server on port 8080
app.listen(8080, () => console.log(`listening on port 8080`));
