


// exports
module.exports = fnStartRemoteAPI;



// dependencies
const fs = require("fs");
const fnIsRunning = require("/startup/functions/fnIsRunning.js");
const fnSleep = require("/startup/functions/fnSleep.js");
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const fnSpawn = require("/startup/functions/fnSpawn.js");
const fnKill = require("/startup/functions/fnKill.js");



// FUNCTION: fnStartRemoteAPI()
// INPUT: N/A
// OUTPUT: N/A
async function fnStartRemoteAPI(){
    if (fs.existsSync("/share/config.json") !== true && fs.existsSync("/share/config.gen.js") !== true){
        try {
            if (fs.existsSync("/startup/remote-api.started") !== true || fnIsRunning("node /startup/remote-api/index.js") !== true){
                fnDeleteFile("/startup/remote-api.started");
                fnKill("node /startup/remote-api/index.js");
                fnSpawn("node", ["/startup/remote-api/index.js"]);
                await fnSleep(2000);
            }
        }
        catch (error){
            // do nothing
        }
    }
    else {
        fnDeleteFile("/startup/remote-api.started");
        fnKill("node /startup/remote-api/index.js");
    }
}



