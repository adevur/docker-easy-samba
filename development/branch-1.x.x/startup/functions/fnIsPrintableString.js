


// exports
module.exports = fnIsPrintableString;



// dependencies
// N/A



// FUNCTION: fnIsPrintableString()
// INPUT: "str" is the string to check
// OUTPUT: true in case "str" is a string made of only printable ASCII chars, otherwise false
// PURPOSE: check if a string only contains printable ASCII characters
//   HINT: ASCII printable chars have a code from 32 to 126
function fnIsPrintableString(str){
    // check that every char in "str" has a code between 32 and 126
    return str.split("").every((c) => {
        const charcode = c.charCodeAt(0);
        return (charcode >= 32 && charcode <= 126);
    });
}
