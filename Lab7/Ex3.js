require("./products_data.js");

let number_products = 5; // this variable may become unnecessary
let product_number = 1;

// Only the condition in the for loop is changed
for (
  let product_number = 1;
  eval("typeof name" + product_number) != "undefined";
  product_number++
) {
  if (
    product_number > number_products * 0.25 &&
    product_number < number_products * 0.75
  ) {
    console.log(`${eval("name" + product_number)} is sold out!`);
    continue;
  }
  console.log(`${product_number}. ${eval("name" + product_number)}`);
}
