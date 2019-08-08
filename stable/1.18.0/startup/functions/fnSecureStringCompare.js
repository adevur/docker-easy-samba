


// exports
module.exports = fnSecureStringCompare;



// dependencies
const fnIsString = require("/startup/functions/fnIsString.js");



// FUNCTION: fnSecureStringCompare()
// INPUT: "str1" and "str2" are the strings to compare
// OUTPUT: true in case "str1" and "str2" are identical, otherwise false
// PURPOSE: check that two given strings are equal, in a secure way against timing attacks
function fnSecureStringCompare(str1, str2){
    let s1 = str1;
    let s2 = str2;

    if ([s1, s2].every(fnIsString) !== true){
        return false;
    }
    
    let result = true;
    
    if (s1.length !== s2.length){
        result = false;
        s1 = (s1.length < s2.length) ? s1.padStart(s2.length, " ") : s1;
        s2 = (s2.length < s1.length) ? s2.padStart(s1.length, " ") : s2;
    }
    
    s1.split("").forEach((e, i) => {
        result = (e !== s2.split("")[i]) ? false : result;
    });
    
    return result;
}
