


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
                console.log(`[LOG] EasySamba Remote API is enabled and is starting...`);
                fnDeleteFile("/startup/remote-api.started");
                fnKill("node /startup/remote-api/index.js");
                fnSpawn("node", ["/startup/remote-api/index.js"]);
                await fnSleep(2000);
                if (fs.existsSync("/startup/remote-api.started")){
                    console.log(`[LOG] EasySamba Remote API started successfully.\n`);
                }
                else {
                    console.log(`[ERROR] EasySamba Remote API could not be started.\n`);
                }
            }
        }
        catch (error){
            if (fnIsRunning("node /startup/remote-api/index.js") !== true){
                fnDeleteFile("/startup/remote-api.started");
                console.log(`[ERROR] EasySamba Remote API could not be started.\n`);
            }
        }
    }
    else {
        if (fs.existsSync("/startup/remote-api.started") || fnIsRunning("node /startup/remote-api/index.js")){
            console.log(`[LOG] EasySamba Remote API is not enabled and won't be started.\n`);
            fnDeleteFile("/startup/remote-api.started");
            fnKill("node /startup/remote-api/index.js");
        }
    }
}



