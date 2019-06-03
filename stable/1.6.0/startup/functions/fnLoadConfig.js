


// exports
module.exports = fnLoadConfig;



// dependencies
const fs = require("fs");



// FUNCTION: fnLoadConfig()
// INPUT: "path": path of the configuration file
// OUTPUT: the content of the config file, already parsed; it returns false in case of errors
// PURPOSE: load the configuration file
function fnLoadConfig(path){
    try {
        return JSON.parse(fs.readFileSync(path, "utf8"));
    }
    catch (error){
        return false;
    }
}



