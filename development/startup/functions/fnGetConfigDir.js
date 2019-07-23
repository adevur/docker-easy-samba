


// exports
module.exports = fnGetConfigDir;



// dependencies
const fs = require("fs");
const assert = require("assert");



// FUNCTION: fnGetConfigDir()
// OUTPUT: a string that contains the path to easy-samba configuration files,
//   that can be either "/share" or "/share/config"
function fnGetConfigDir(){
    try {
        assert( fs.existsSync("/startup/configdir.json") );
        const path = JSON.parse( fs.readFileSync("/startup/configdir.json", "utf8") );
        assert( path === "/share" || path === "/share/config" );
        return path;
    }
    catch (error){
        try {
            assert( fs.existsSync("/share/config.json") !== true );
            assert( fs.existsSync("/share/config.gen.js") !== true );
            assert( fs.existsSync("/share/remote-api.json") !== true );
            assert( fs.existsSync("/share/config/config.json") || fs.existsSync("/share/config/config.gen.js") || fs.existsSync("/share/config/remote-api.json") );
            return "/share/config";
        }
        catch (error){
            return "/share";
        }
    }

    return "/share";
}
