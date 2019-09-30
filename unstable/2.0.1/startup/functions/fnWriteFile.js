


// exports
module.exports = fnWriteFile;



// dependencies
const fs = require("fs");
const assert = require("assert");
const fnIsString = require("/startup/functions/fnIsString.js");



// FUNCTION: fnWriteFile()
// INPUT: "path" of the file to write, "data" to be written
// OUTPUT: true in case of success, otherwise false
// PURPOSE: write data to a file
function fnWriteFile(path, data = ""){
    try {
        assert( fnIsString(data) );
        fs.writeFileSync(path, data, { encoding: "utf8" });
        assert( fs.readFileSync(path, "utf8") === data );
        return true;
    }
    catch (error){
        return false;
    }
}
