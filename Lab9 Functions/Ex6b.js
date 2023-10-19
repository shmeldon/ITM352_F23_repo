
function isNonNegInt(q, returnErrors = false) {
    errors = [];
    if(Number(q) != q) errors.push('Not a number!');
    if(q < 0) errors.push('Negative value!');
    if(parseInt(q) != q) errors.push('Not an integer!');
    return returnErrors ? errors : (errors.length == 0);
}

attributes  =  "Dan;50;50.5;-49.5";
let pieces = attributes.split(';');

pieces.forEach((item, index) => {
    console.log(`part ${index} is ${(isNonNegInt(item) ? 'a' : 'not a')} quantity`);
});
