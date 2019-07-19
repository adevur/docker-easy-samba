


// exports
module.exports = fnEasySambaStartup;



// dependencies
const fs = require("fs");
const fnIsRunning = require("/startup/functions/fnIsRunning.js");
const fnSleep = require("/startup/functions/fnSleep.js");
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const fnGetVersion = require("/startup/functions/fnGetVersion.js");
const fnSpawn = require("/startup/functions/fnSpawn.js");



// FUNCTION: fnEasySambaStartup()
// INPUT: N/A
// OUTPUT: N/A
async function fnEasySambaStartup(){
    // display version information
    const version = fnGetVersion();
    console.log(`[LOG] you're using easy-samba version '${version.version}' from '${version.branch}' branch.`);

    // start EasySamba Remote API daemon
    //   only in case "/share/config.json" and "/share/config.gen.js" files are missing
    if (fs.existsSync("/share/config.json") !== true && fs.existsSync("/share/config.gen.js") !== true){
        try {
            if (fnIsRunning("node /startup/remote-api/index.js") !== true){
                fnDeleteFile("/startup/remote-api.started");
                fnSpawn("node", ["/startup/remote-api/index.js"]);
                await fnSleep(2000);
            }
            console.log((fs.existsSync("/startup/remote-api.started")) ? `[LOG] EasySamba Remote API started successfully.` : `[ERROR] it's not been possible to start EasySamba Remote API.`);
        }
        catch (error){
            console.log(`[ERROR] it's not been possible to start EasySamba Remote API.`);
        }
    }
    else {
        console.log(`[LOG] EasySamba Remote API is disabled.`);
    }

    // delete "/startup/easy-samba.running"
    fnDeleteFile("/startup/easy-samba.running");
}



