


// exports
module.exports = fnIsValidPath;



// dependencies
// N/A



// FUNCTION: fnIsValidPath()
// INPUT: "str" is the string to validate
// OUTPUT: true in case "str" is a valid filesystem path, otherwise false
// PURPOSE: check that a given string is a valid filesystem path
//   it doesn't check if "str" exists on disk, that's not its purpose
// EXPLAIN: a valid path is a string that can contain every Unicode char except for "/" and "\0"
//   also, "str" cannot be "." or ".."
//   max length of directory name must be 255 chars
function fnIsValidPath(str){
    // "str" cannot contain "/" and "\0" chars
    if (str.substring(7).includes("/") || str.substring(7).includes("\u0000")){
        return false;
    }

    // max length 255 chars
    if (str.substring(7).length > 255){
        return false;
    }

    // "str" cannot be "/share/." or "/share/.."
    if (str === "/share/." || str === "/share/.."){
        return false;
    }

    return true;
}
