let year = 2001;
let day = 12;
let month = 12;

let lastTwoDigits = parseInt(year.toString().slice(2));

let step2 = parseInt(lastTwoDigits / 4);
let step3 = lastTwoDigits + step2;
let step4 = 5;
let step6 = step4 + step3;
let step7 = step6 + day;
let step8 = step7;
let final = step8 - 1;

if (final > 7) {
    final = final % 7; 
}

console.log(final);  
