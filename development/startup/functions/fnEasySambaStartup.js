


// exports
module.exports = fnEasySambaStartup;



// dependencies
const fs = require("fs");
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");
const fnGetVersion = require("/startup/functions/fnGetVersion.js");
const fnListUsers = require("/startup/functions/fnListUsers.js");



// FUNCTION: fnEasySambaStartup()
// INPUT: N/A
// OUTPUT: N/A
async function fnEasySambaStartup(){
    console.log("------ EASY-SAMBA STARTUP ------");

    // display version information
    const version = fnGetVersion();
    console.log(`[LOG] you're using easy-samba version '${version.version}' from '${version.branch}' branch.`);

    // delete "/startup/remote-api.started"
    fnDeleteFile("/startup/remote-api.started");

    // delete "/startup/easy-samba.running"
    fnDeleteFile("/startup/easy-samba.running");
    
    // in case of first startup, save a list of container's OS native users
    if (fs.existsSync("/startup/first_startup") === true){
        fnWriteFile("/startup/native_users.json", JSON.stringify(fnListUsers()));
        fnDeleteFile("/startup/first_startup");
    }
    
    console.log("------ EASY-SAMBA STARTUP COMPLETE ------\n");
}



