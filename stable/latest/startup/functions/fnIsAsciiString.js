


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
    let i = 0;
    while (i < str.length){
        if (str.charCodeAt(i) < 0 || str.charCodeAt(i) > 127){
            return false;
        }
        i++;
    }

    return true;
}
