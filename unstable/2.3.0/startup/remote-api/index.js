


// dependencies
const log = require("/startup/functions/fnLog.js")("/share/logs/remote-api.logs");
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const fnPrepareServer = require("/startup/remote-api/fnPrepareServer.js");



fnMain().then(() => {
    log("[ERROR] EasySamba Remote API crashed.");
    process.exit(1);
}).catch((error) => {
    log("[ERROR] EasySamba Remote API crashed.");
    process.exit(1);
});



async function fnMain(){
    // start the API server
    log("\n");
    await fnPrepareServer();
}



