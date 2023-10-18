function isNonNegInt(q, returnErrors = false) {
  errors = []; // assume no errors at first
  if (Number(q) != q) errors.push("Not a number!"); // Check if string is a number value
  if (q < 0) errors.push("Negative value!"); // Check if it is non-negative
    if (parseInt(q) != q) errors.push("Not an integer!"); // Check that it is an integer
    return returnErrors ? errors : errors.length == 0;
}


attributes = "Sheldon;21;21.5;20.5";
let pieces = attributes.split(";");

for (let part of pieces) {
  console.log(`${part} is a quantity ${isNonNegInt(part, true)}`);
}
