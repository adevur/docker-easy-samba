


// exports
module.exports = fnIsArray;



// dependencies
// N/A



// FUNCTION: fnIsArray()
// INPUT: "input" is the input to validate
// OUTPUT: true in case "input" is an array, otherwise false
// PURPOSE: check that a given javascript object is a valid array
function fnIsArray(input){
    return Array.isArray(input);
}
