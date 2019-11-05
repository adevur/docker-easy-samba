


// dependencies
const log = require("/startup/functions/fnLog.js")("/share/logs/easy-samba.logs");
const fnEasySambaStartup = require("/startup/functions/fnEasySambaStartup.js");
const fnEasySambaLoop = require("/startup/functions/fnEasySambaLoop.js");
const fnKill = require("/startup/functions/fnKill.js");



// call the main function of this script
//  fnMain() should never terminate (in case it does, we log an error message)
fnMain().then(() => {
    log(`[ERROR] easy-samba terminated for unknown reasons.`);
    process.exit(1);
}).catch((error) => {
    log(`[ERROR] script has failed for unknown reasons.`);
    log(`[DEBUG] DETAILS ABOUT THE ERROR:`, error);
    process.exit(1);
});



async function fnMain(){
    // handle SIGTERM signals in case someone tries to stop this script
    process.on("SIGTERM", () => {
        fnKill("/usr/sbin/smbd --foreground --no-process-group");
        fnKill("/usr/sbin/nmbd --foreground --no-process-group");
        fnKill(`node ${CFG}/config.gen.js`);
        fnKill("node /startup/remote-api/index.js");
        process.exit(0);
    });
    
    // handle uncaught exceptions
    process.on("uncaughtException", () => {
        process.exit(1);
    });
    
    // handle unhandled rejections
    process.on("unhandledRejection", () => {
        process.exit(1);
    });

    // easy-samba startup phase
    fnEasySambaStartup();

    // easy-samba loop
    await fnEasySambaLoop();

    return;
}





