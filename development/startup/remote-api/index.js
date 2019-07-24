


// dependencies
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const fnStartServer = require("/startup/remote-api/fnStartServer.js");



fnMain().then(() => {
    fnDeleteFile("/startup/remote-api.started");
    process.exit(1);
}).catch((error) => {
    fnDeleteFile("/startup/remote-api.started");
    process.exit(1);
});



async function fnMain(){
    // start the API server
    await fnStartServer();
}



