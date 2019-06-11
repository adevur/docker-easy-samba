


// exports
module.exports = fnIsInteger;



// dependencies
const fnValidateString = require("/startup/functions/fnValidateString.js");



// FUNCTION: fnIsInteger()
// INPUT: "input" is the input to validate
// OUTPUT: true in case "input" is a string containing an integer, otherwise false
// PURPOSE: check that a given string is a non-negative integer
// EXAMPLE: fnIsInteger("123") === true; fnIsInteger("-3.2") === false
function fnIsInteger(input){
    return fnValidateString(input, ["09"]);
}
