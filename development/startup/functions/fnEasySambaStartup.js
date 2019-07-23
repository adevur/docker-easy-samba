


// exports
module.exports = fnEasySambaStartup;



// dependencies
const fs = require("fs");
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");
const fnGetVersion = require("/startup/functions/fnGetVersion.js");
const fnListUsers = require("/startup/functions/fnListUsers.js");
const fnGetConfigDir = require("/startup/functions/fnGetConfigDir.js");
const fnKill = require("/startup/functions/fnKill.js");



// FUNCTION: fnEasySambaStartup()
// INPUT: N/A
// OUTPUT: N/A
async function fnEasySambaStartup(){
    console.log("------ EASY-SAMBA STARTUP ------");

    // display version information
    const version = fnGetVersion();
    console.log(`[LOG] you're using easy-samba version '${version.version}' from '${version.branch}' branch.`);

    // get config dir
    fnDeleteFile("/startup/configdir.json");
    const configdir = fnGetConfigDir();
    fnWriteFile("/startup/configdir.json", JSON.stringify(configdir));
    console.log(`[LOG] easy-samba configuration files are located at "${configdir}".`);

    // kill existing processes
    fnKill("node /share/config.gen.js");
    fnKill("node /share/config/config.gen.js");
    fnKill("/usr/sbin/smbd --foreground --no-process-group");
    fnKill("/usr/sbin/nmbd --foreground --no-process-group");
    fnKill("node /startup/remote-api/index.js");

    // delete "/startup/remote-api.started"
    fnDeleteFile("/startup/remote-api.started");

    // delete "/startup/easy-samba.running"
    fnDeleteFile("/startup/easy-samba.running");
    
    // in case of first startup, save a list of container's OS native users
    if (fs.existsSync("/startup/native_users.json") !== true){
        fnWriteFile("/startup/native_users.json", JSON.stringify(fnListUsers()));
    }
    
    console.log("------ EASY-SAMBA STARTUP COMPLETE ------\n");
}



