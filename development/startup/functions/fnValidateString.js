


// exports
module.exports = fnValidateString;



// dependencies
// N/A



// FUNCTION: fnValidateString()
// INPUT: "str" is the string to validate; "chars" is an array that contains the allowed chars in "str"
// OUTPUT: true in case of success, otherwise false
// PURPOSE: check if "str" contains only chars included in "chars" array
//   if an element of "chars" is a two-char string (e.g. "az"), it means "from 'a' to 'z'"
// EXAMPLE:
//   fnValidateString("Hello-World", ["az", "AZ", "09", "-"]) === true
//   fnValidateString("Hello World!", ["az", "AZ", "09", "-"]) === false
function fnValidateString(str, chars){
    return str.split("").every((c) => {
        let result = false;

        chars.forEach((char) => {
            if (char.length === 1){
                result = (c === char) ? true : result;
            }
            else {
                result = (c.charCodeAt(0) >= char.charCodeAt(0) && c.charCodeAt(0) <= char.charCodeAt(1)) ? true : result;
            }
        });

        return result;
    });
}
