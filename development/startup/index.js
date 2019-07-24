


// dependencies
const fnEasySambaStartup = require("/startup/functions/fnEasySambaStartup.js");
const fnEasySambaLoop = require("/startup/functions/fnEasySambaLoop.js");



// call the main function of this script
//  fnMain() should never terminate (in case it does, we log an error message)
fnMain().then(() => {
    console.log(`[ERROR] easy-samba terminated for unknown reasons.`);
    process.exit(1);
}).catch((error) => {
    console.log(`[ERROR] script has failed for unknown reasons.`);
    console.log(`[DEBUG] DETAILS ABOUT THE ERROR:`, error);
    process.exit(1);
});



async function fnMain(){
    // handle SIGTERM signals in case someone tries to stop this script
    process.on("SIGTERM", () => {
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





