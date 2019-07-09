


// exports
module.exports = fnIsValidPassword;



// dependencies
const fnIsString = require("/startup/functions/fnIsString.js");
const fnIsPrintableString = require("/startup/functions/fnIsPrintableString.js");



// FUNCTION: fnIsValidPassword()
// INPUT: "password" is a javascript object
// OUTPUT: true in case of success, otherwise false
// PURPOSE: this function returns true in case "password" is a valid Linux password
//   EXPLAIN: "password" must a string, must have a minimum length of 1 char,
//     and can only contain printable ASCII chars
function fnIsValidPassword(password){
    // "password" must be a string, of minimum 1 char, made entirely of printable ASCII chars
    return (fnIsString(password) && password.length >= 1 && fnIsPrintableString(password));
}
