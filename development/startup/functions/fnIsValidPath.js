


// exports
module.exports = fnIsValidPath;



// dependencies
const fnValidateString = require("/startup/functions/fnValidateString.js");



// FUNCTION: fnIsValidPath()
// INPUT: "str" is the string to validate
// OUTPUT: true in case "str" is a valid filesystem path, otherwise false
// PURPOSE: check that a given string is a valid filesystem path
//   it doesn't check if "str" exists on disk, that's not its purpose
// EXPLAIN: a valid path is a string that can contain every Unicode char except for "/" and "\0"
//   also, "str" cannot be "." or ".."
//   max length of directory name must be 255 chars
// FIXME: currently, only alphanumeric ASCII chars are permitted, due to problems with "/etc/samba/smb.conf" generation
function fnIsValidPath(str){
    // "str" cannot be empty
    if (str.length === 0){
        return false;
    }

    // FIXME: TEMPORARY
    if (fnValidateString(str, ["az", "AZ", "09"]) !== true){
        return false;
    }

    // "str" cannot contain "/" and "\0" chars
    if (str.includes("/") || str.includes("\u0000")){
        return false;
    }

    // max length 255 chars
    if (str.length > 255){
        return false;
    }

    // "str" cannot be "." or ".."
    if (str === "." || str === ".."){
        return false;
    }

    return true;
}
