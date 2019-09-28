


// dependencies
const log = require("/startup/functions/fnLog.js")("/share/config/remote-api.logs");
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const fnPrepareServer = require("/startup/remote-api/fnPrepareServer.js");



fnMain().then(() => {
    fnDeleteFile("/startup/remote-api.started");
    log("[ERROR] EasySamba Remote API crashed.");
    process.exit(1);
}).catch((error) => {
    fnDeleteFile("/startup/remote-api.started");
    log("[ERROR] EasySamba Remote API crashed.");
    process.exit(1);
});



async function fnMain(){
    // start the API server
    log("\n");
    await fnPrepareServer();
}



