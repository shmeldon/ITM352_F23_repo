require("./products_data.js");


let number_products = 5;
let product_number = 1;


while(product_number <= number_products) {
   console.log(`${product_number}. ${eval('name' + product_number)}`);
   product_number++;
}
