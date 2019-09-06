


// exports
module.exports = fnSecureStringCompare;



// dependencies
const fnIsString = require("/startup/functions/fnIsString.js");



// FUNCTION: fnSecureStringCompare()
// INPUT: "str1" and "str2" are the strings to compare
// OUTPUT: true in case "str1" and "str2" are identical, otherwise false
// PURPOSE: check that two given strings are equal, in a secure way against timing attacks
function fnSecureStringCompare(str1, str2){
    if ([str1, str2].every(fnIsString) !== true){
        return false;
    }
    
    let s1 = str2.split("");
    let s2 = str2.split("");
    
    s1 = s1.map((e, i) => {
        return str1.split("")[i];
    });
    
    let result = (str1.length === str2.length);
    
    s1.forEach((e, i) => {
        result = (e !== s2[i]) ? false : result;
    });
    
    return result;
}
