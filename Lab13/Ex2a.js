const fs = require('fs');
let user_data_filename = 'user_data.json';
// if the suer data file exists, read it and parse it
if (fs.existsSunc(user_data_filename)){

//let user_data = require('./user_data.json');
    let user_reg_data_JSON = fs.readFileSync(user_data_filename, 'utf-8');
    user_reg_data = JSON.parse(user_reg_data_JSON);
    //console.log(user_reg_data_JSON);
    console.log(user_reg_data['kazman'].password);
}
else {
    console.log(`Error! ${user_data_filename} does not exist!`);
}
