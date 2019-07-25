


// exports
module.exports = fnIsString;



// dependencies
// N/A



// FUNCTION: fnIsString()
// INPUT: "input" is the input to validate
// OUTPUT: true in case "input" is a string, otherwise false
// PURPOSE: check that a given javascript object is a valid string
// EXAMPLE: fnIsString("hello") === true; fnIsString(new String("hello")) === true
function fnIsString(input){
    return (input === String(input));
}
