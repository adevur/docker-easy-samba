


// exports
module.exports = fnGetConfigDir;



// dependencies
const fs = require("fs");
const assert = require("assert");



// FUNCTION: fnGetConfigDir()
// OUTPUT: a string that contains the path to easy-samba configuration files,
//   that can only be "/share/config", at the moment
function fnGetConfigDir(){
    try {
        assert( fs.existsSync("/startup/configdir.json") );
        const path = JSON.parse( fs.readFileSync("/startup/configdir.json", "utf8") );
        assert( path === "/share/config" );
        return path;
    }
    catch (error){
        return "/share/config";
    }

    return "/share/config";
}
