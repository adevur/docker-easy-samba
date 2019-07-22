


// exports
module.exports = fnDeleteFile;



// dependencies
const fs = require("fs");
const assert = require("assert");



// FUNCTION: fnDeleteFile()
// INPUT: "path" of the file to delete
// OUTPUT: true in case of success, otherwise false
// PURPOSE: delete a file
function fnDeleteFile(path){
    try {
        fs.unlinkSync(path);
        assert( fs.existsSync(path) !== true );
        return true;
    }
    catch (error){
        return false;
    }
}
