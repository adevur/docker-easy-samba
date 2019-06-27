


// exports
module.exports = fnIsValidUsername;



// dependencies
const fnValidateString = require("/startup/functions/fnValidateString.js");
const fnIsString = require("/startup/functions/fnIsString.js");



// FUNCTION: fnIsValidUsername()
// INPUT: "username" is the javascript object to validate
// OUTPUT: true in case "username" is a valid UNIX username, otherwise false
// PURPOSE: check that a given string is a valid UNIX username
// EXPLAIN: for this script, valid username rules are:
//   username must have a length of minimum 1 char and maximum 31 chars
//   username must start with a lowercase letter or an underscore
//   username body can contain lowercase letters, digits, underscores and hyphens
//   username last char can also be a dollar sign
function fnIsValidUsername(username){
    // username must be a string
    if (fnIsString(username) !== true){
        return false;
    }

    // username must have a length of minimum 1 char and maximum 31 chars
    if (username.length < 1 || username.length > 31){
        return false;
    }

    // username must start with a lowercase letter or an underscore
    if (fnValidateString(username.charAt(0), ["az", "_"]) !== true){
        return false;
    }

    // username last char must be a lowercase letter, a digit, an underscore, a hyphen or a dollar sign
    if (fnValidateString(username.charAt(username.length - 1), ["az", "09", "_", "-", "$"]) !== true){
        return false;
    }

    // username body (except first and last char) must contain lowercase letters, digits, underscores or hyphens
    if (username.length > 2 && fnValidateString(username.substring(1).slice(0, -1), ["az", "09", "_", "-"]) !== true){
        return false;
    }

    return true;
}
