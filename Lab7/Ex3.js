require("./products_data.js");

let number_products = 5; 
let product_number = 1;

for (
  let product_number = 1;
  eval("typeof name" + product_number) != "undefined";
  product_number++
) {
 /*   if (product_number > number_products / 2) {
        console.log("Don't ask for anything else!")
        process.exit(1)
    }
  if (
    product_number > number_products * 0.25 &&
    product_number < number_products * 0.75
  ) {
    console.log(`${eval("name" + product_number)} is sold out!`);
    continue;
  }
  */
  console.log(`${product_number}. ${eval("name" + product_number)}`);
}
console.log('That\'s all!');