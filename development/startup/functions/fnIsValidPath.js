


// exports
module.exports = fnIsValidPath;



// dependencies
const fnValidateString = require("/startup/functions/fnValidateString.js");



// FUNCTION: fnIsValidPath()
// INPUT: "str" is the string to validate
// OUTPUT: true in case "str" is a valid filesystem path, otherwise false
// PURPOSE: check that a given string is a valid filesystem path
//   it doesn't check if "str" exists on disk, that's not its purpose
// EXPLAIN: for now, a "valid" path means that path must be alphanumeric (e.g. "/share/hello", "/share/hi3", "/share/123", ...)
// TODO: use less restrictive rules (e.g. allow for "/share/hello world", "/share/this-is-a-folder.d", ...)
function fnIsValidPath(str){
    return fnValidateString(str.substring(7), ["az", "AZ", "09"]);
}
