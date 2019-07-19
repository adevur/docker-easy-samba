


// exports
module.exports = fnEasySambaStartup;



// dependencies
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const fnGetVersion = require("/startup/functions/fnGetVersion.js");



// FUNCTION: fnEasySambaStartup()
// INPUT: N/A
// OUTPUT: N/A
async function fnEasySambaStartup(){
    // display version information
    const version = fnGetVersion();
    console.log(`[LOG] you're using easy-samba version '${version.version}' from '${version.branch}' branch.`);

    // delete "/startup/remote-api.started"
    fnDeleteFile("/startup/remote-api.started");

    // delete "/startup/easy-samba.running"
    fnDeleteFile("/startup/easy-samba.running");
}



