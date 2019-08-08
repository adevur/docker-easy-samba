


// exports
module.exports = fnCheckNetBIOSname;



// dependencies
const fnValidateString = require("/startup/functions/fnValidateString.js");



// FUNCTION: fnCheckNetBIOSname()
// INPUT: "name": name to validate
// OUTPUT: true in case the name is valid, otherwise false
// PURPOSE: check that a given name is a valid NetBIOS Name
// SOURCE: https://en.wikipedia.org/wiki/NetBIOS#NetBIOS_name
function fnCheckNetBIOSname(name){
    // minimum length: 1 character, maximum length: 15 characters
    if (name.length < 1 || name.length > 15){
        return false;
    }

    // first character must be alphanumeric
    if (fnValidateString(name.charAt(0), ["az", "AZ", "09"]) !== true){
        return false;
    }

    // last character must be alphanumeric
    if (fnValidateString(name.charAt(name.length - 1), ["az", "AZ", "09"]) !== true){
        return false;
    }

    // "name" cannot be made entirely of digits
    if (fnValidateString(name, ["09"]) === true){
        return false;
    }

    // if "name" has more than two characters, all of them (except first and last) may be alphanumeric or hyphen
    if (name.length > 2 && fnValidateString(name.substring(1).slice(0, -1), ["az", "AZ", "09", "-"]) !== true){
        return false;
    }

    return true;
}
