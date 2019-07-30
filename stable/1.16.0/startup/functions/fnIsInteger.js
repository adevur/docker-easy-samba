


// exports
module.exports = fnIsInteger;



// dependencies
// N/A



// FUNCTION: fnIsInteger()
// INPUT: "input" is the input to validate
// OUTPUT: true in case "input" is an integer, otherwise false
// PURPOSE: check that a given Javascript object is a valid integer
// EXAMPLE: fnIsInteger(123) === true; fnIsInteger(NaN) === false
function fnIsInteger(input){
    return ( input !== undefined && input === parseInt(String(input), 10) && Number.isNaN(input) !== true );
}
