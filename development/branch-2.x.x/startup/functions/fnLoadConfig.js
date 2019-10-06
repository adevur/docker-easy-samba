


// exports
module.exports = fnLoadConfig;



// dependencies
const fs = require("fs");
const fnIsRunning = require("/startup/functions/fnIsRunning.js");
const CFG = require("/startup/functions/fnGetConfigDir.js")();



// FUNCTION: fnLoadConfig()
// OUTPUT: the content of the config file, already parsed; it returns false in case of errors
// PURPOSE: load the configuration file
function fnLoadConfig(){
    // if there's a "config.json" file, try to read from it
    if (fs.existsSync(`${CFG}/config.json`)){
        try {
            const raw = fs.readFileSync(`${CFG}/config.json`, "utf8");
            const parsed = JSON.parse(raw);
            return { config: parsed, rawConfig: raw };
        }
        catch (error){
            return { config: false, rawConfig: false };
        }
    }
    // otherwise, try to read from "remote-api.config.json",
    //   in case "config.gen.js" is missing and Remote API is running
    else if (fs.existsSync(`${CFG}/config.gen.js`) !== true && fnIsRunning("node /startup/remote-api/index.js")) {
        try {
            const raw = fs.readFileSync(`${CFG}/remote-api.config.json`, "utf8");
            const parsed = JSON.parse(raw);
            return { config: parsed, rawConfig: raw };
        }
        catch (error){
            return { config: false, rawConfig: false };
        }
    }

    return { config: false, rawConfig: false };
}



