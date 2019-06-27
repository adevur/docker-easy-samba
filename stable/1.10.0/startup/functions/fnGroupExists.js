


// exports
module.exports = fnGroupExists;



// dependencies
const fnListGroups = require("/startup/functions/fnListGroups.js");



// FUNCTION: fnGroupExists()
// INPUT: "name" is the group to check
// OUTPUT: true in case the group exists, otherwise false
// PURPOSE: check if a given group exists in the OS
function fnGroupExists(name){
    return fnListGroups().includes(name);
}
