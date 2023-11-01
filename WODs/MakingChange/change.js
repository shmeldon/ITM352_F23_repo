let total = 190; 
let totalCents = total;

let q = (total - (total % 25)) / 25;
total = total % 25;

let d = (total - (total % 10)) / 10;
total = total % 10;

let n = (total - (total % 5)) / 5;
total = total % 5;

let p = total; 

console.log(`Change for ${totalCents} pennies: ${q} quarters, ${d} dimes, ${n} nickels, ${p} pennies`);