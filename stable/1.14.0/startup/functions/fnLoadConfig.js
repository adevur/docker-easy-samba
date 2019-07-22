


// exports
module.exports = fnLoadConfig;



// dependencies
const fs = require("fs");



// FUNCTION: fnLoadConfig()
// OUTPUT: the content of the config file, already parsed; it returns false in case of errors
// PURPOSE: load the configuration file
function fnLoadConfig(){
    // if there's a "/share/config.json" file, try to read from it
    if (fs.existsSync("/share/config.json")){
        try {
            const raw = fs.readFileSync("/share/config.json", "utf8");
            const parsed = JSON.parse(raw);
            return { config: parsed, rawConfig: raw };
        }
        catch (error){
            return { config: false, rawConfig: false };
        }
    }
    // otherwise, try to read from "/share/remote-api.config.json",
    //   in case "/share/config.gen.js" is missing and Remote API is running
    else if (fs.existsSync("/share/config.gen.js") !== true && fs.existsSync("/startup/remote-api.started")) {
        try {
            const raw = fs.readFileSync("/share/remote-api.config.json", "utf8");
            const parsed = JSON.parse(raw);
            return { config: parsed, rawConfig: raw };
        }
        catch (error){
            return { config: false, rawConfig: false };
        }
    }

    return { config: false, rawConfig: false };
}



