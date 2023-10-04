require("./products_data.js");

let number_products = 5;
let product_number = 1;

for(let product_number = 0 < number_product, product_number++) {
    if (product_number > number_products * 0.25 && product_number < number_products * 0.75) {
        console.log(`${eval('name' + product_number)} is sold out!`);
        continue;
    }
    console.log(`${product_number}. ${eval('name' + product_number)}`);
    if (product_number > number_products / 2) {
        process.exit(1);
    }
}
console.log('That\'s all we have!')