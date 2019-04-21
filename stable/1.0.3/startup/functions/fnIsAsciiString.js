


// exports
module.exports = fnIsAsciiString;



// dependencies
// N/A



// FUNCTION: fnIsAsciiString()
// INPUT: "str" is the string to check
// OUTPUT: true in case "str" is a string made of only ASCII chars, otherwise false
// PURPOSE: check if a string only contains ASCII characters
function fnIsAsciiString(str){
    // check that every char in "str" has a code between 0 and 127
    return str.split("").every((c) => {
        const charcode = c.charCodeAt(0);
        return (charcode >= 0 && charcode <= 127);
    });
}
