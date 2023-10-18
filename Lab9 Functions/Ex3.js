attributes  =  "Sheldon;21;21.5;20.5";
let pieces = attributes.split(';');

for (let part of pieces) {
    console.log(`${part} is type ${typeof part}`);
}

let invert = pieces.join(',');
console.log(invert);