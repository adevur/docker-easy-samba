


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
        const raw = fs.readFileSync(path, "utf8");
        const parsed = JSON.parse(raw);
        return { config: parsed, rawConfig: raw };
    }
    catch (error){
        return { config: false, rawConfig: false };
    }
}



