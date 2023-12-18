
// script for when page loads on product pages. Includes user info and data validation as well as error handling
window.onload = function() {
    // Handle errors related to product quantities and availability
    let params = new URLSearchParams(window.location.search);
    let errorMessagesString = params.get('errors');
    let errorProductID = params.get('errorProduct');

    if (errorProductID && errorMessagesString) {
        // Parse the error messages from the query string
        let errorMessages = JSON.parse(decodeURIComponent(errorMessagesString));

        // Iterate over each error message and apply necessary changes to the input fields
        Object.keys(errorMessages).forEach(productName => {
            // Find the quantity input field for the errorProductID
            let quantityInput = document.querySelector(`input[name='quantity_${errorProductID}']`);
            if (quantityInput) {
                // Highlight the input field in red
                quantityInput.style.borderColor = "red";

                // Extract and update the input field with the maximum available quantity
                let errorMessage = errorMessages[productName];
                let availableQuantityMatch = errorMessage.match(/Only (\d+) left/);
                if (availableQuantityMatch) {
                    let availableQuantity = availableQuantityMatch[1];
                    quantityInput.value = availableQuantity;
                }
            }
        });

        // Display an alert with all error messages
        alert(Object.values(errorMessages).join("\n"));
    }

    // Fetch and display session data (such as login status and cart count)
    fetchSessionData();
};

function setUsername(data) {
    const usernameElement = document.getElementById('username');
    if (data.isLoggedIn) {
        usernameElement.innerText = `Username: ${data.username}`;
    } else {
        usernameElement.innerText = 'Username: Not logged in';
    }
}

function fetchSessionData() {
    console.log("Function executed"); // Line for debugging
    fetch('/session-data')
        .then(response => response.json())
        .then(data => {
            // Update the DOM element with session data
            // Display "Not logged in" or "Logged in as: [username]"
            const loginStatusElement = document.getElementById('loginStatus');
            if (data.isLoggedIn) {
                loginStatusElement.innerText = `Logged in as: ${data.username}`;
            } else {
                loginStatusElement.innerText = 'Not logged in';
            }
            
            // Update cart count display
            document.getElementById('cartCount').innerText = `Items in Cart: ${data.cartCount}`;
        });
        const dataElement = document.getElementById('data');
        dataElement.dataset.username = data.username;
    setUsername(data);
}

// Go back to last visited page
function goBack() {
    window.history.back();
} 
