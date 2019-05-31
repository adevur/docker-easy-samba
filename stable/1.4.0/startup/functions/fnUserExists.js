


// exports
module.exports = fnUserExists;



// dependencies
const fnListUsers = require("/startup/functions/fnListUsers.js");



// FUNCTION: fnUserExists()
// INPUT: "username" is the user to check
// OUTPUT: true in case the user exists, otherwise false
// PURPOSE: check if a given user exists in the OS
function fnUserExists(username){
    return fnListUsers().includes(username);
}
