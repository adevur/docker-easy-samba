


// exports
module.exports = fnIsValidPath;



// dependencies
const fnStringContains = require("/startup/functions/fnStringContains.js");



// FUNCTION: fnIsValidPath()
// INPUT: "str" is the string to validate
// OUTPUT: true in case "str" is a valid samba path, otherwise false
// PURPOSE: check that a given string is a valid samba path
//   it doesn't check if "str" exists on disk, that's not its purpose
// EXPLAIN:
//   a valid path is a string that can contain every Unicode char except for:
//     "/", "\", "<", ">", ":", "\"", "|", "?", "*" and "\0"
//   "str" cannot contain any char with code between 1 and 31, or with code 127
//   also, "str" cannot be "." or ".."
//   max length of directory name must be 255 chars
// SOURCE: https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file
function fnIsValidPath(str){
    // "str" cannot be empty
    if (str.length === 0){
        return false;
    }

    // "str" cannot contain "/", "\", "<", ">", ":", "\"", "|", "?", "*" or "\0"
    if (fnStringContains(str, [`/`, `\\`, `<`, `>`, `:`, `"`, `|`, `?`, `*`, `\u0000`]) === true){
        return false;
    }

    // "str" cannot contain any char with code between 1 and 31, or with code 127
    if (fnStringContains(str, [`\u0001\u001F`, `\u007F`]) === true){
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



