


// exports
module.exports = fnStartRemoteAPI;



// dependencies
const fs = require("fs");
const log = require("/startup/functions/fnLog.js")("/share/logs/easy-samba.logs");
const fnIsRunning = require("/startup/functions/fnIsRunning.js");
const fnSleep = require("/startup/functions/fnSleep.js");
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const fnSpawn = require("/startup/functions/fnSpawn.js");
const fnKill = require("/startup/functions/fnKill.js");
const CFG = require("/startup/functions/fnGetConfigDir.js")();



// FUNCTION: fnStartRemoteAPI()
// INPUT: N/A
// OUTPUT: N/A
async function fnStartRemoteAPI(){
    if (fs.existsSync(`${CFG}/config.json`) !== true && fs.existsSync(`${CFG}/config.gen.js`) !== true && fs.existsSync(`${CFG}/remote-api.json`)){
        try {
            if (fnIsRunning("node /startup/remote-api/index.js") !== true){
                log(`[LOG] EasySamba Remote API is enabled and is starting...`);
                fnSpawn("node", ["/startup/remote-api/index.js"]);
                await fnSleep(2000);
                log("");
            }
        }
        catch (error){
            if (fnIsRunning("node /startup/remote-api/index.js") !== true){
                log(`[ERROR] EasySamba Remote API could not be started.\n`);
            }
        }
    }
    else {
        if (fnIsRunning("node /startup/remote-api/index.js")){
            log(`[LOG] EasySamba Remote API is not enabled and won't be started.\n`);
            fnKill("node /startup/remote-api/index.js");
        }
    }
}



