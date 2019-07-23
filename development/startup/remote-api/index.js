


// dependencies
const fnSleep = require("/startup/functions/fnSleep.js");
const fnStartServer = require("/startup/remote-api/fnStartServer.js");



fnMain().then(() => {
    process.exit(1);
}).catch((error) => {
    process.exit(1);
});



async function fnMain(){
    // start the API server
    while (true){
        try {
            await fnStartServer();
        }
        catch (error){
            // do nothing
        }
        // in case of errors, re-try in 10 seconds
        await fnSleep(10000);
    }
}



