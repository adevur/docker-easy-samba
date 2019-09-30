


// exports
module.exports = fnEasySambaStartup;



// dependencies
const fs = require("fs");
const log = require("/startup/functions/fnLog.js")("/share/config/easy-samba.logs");
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");
const fnGetVersion = require("/startup/functions/fnGetVersion.js");
const fnListUsers = require("/startup/functions/fnListUsers.js");
const fnGetConfigDir = require("/startup/functions/fnGetConfigDir.js");
const fnKill = require("/startup/functions/fnKill.js");



// FUNCTION: fnEasySambaStartup()
// INPUT: N/A
// OUTPUT: N/A
function fnEasySambaStartup(){
    log("\n");
    log("------ EASY-SAMBA STARTUP ------");

    // display version information
    const version = fnGetVersion();
    log(`[LOG] you're using easy-samba version '${version.version}' from '${version.branch}' branch.`);

    // kill existing processes
    fnKill("node /share/config/config.gen.js");
    fnKill("/usr/sbin/smbd --foreground --no-process-group");
    fnKill("/usr/sbin/nmbd --foreground --no-process-group");
    fnKill("node /startup/remote-api/index.js");

    // delete "/startup/remote-api.started"
    fnDeleteFile("/startup/remote-api.started");

    // delete "/startup/easy-samba.running"
    fnDeleteFile("/startup/easy-samba.running");
    
    // delete "/startup/configdir.json"
    fnDeleteFile("/startup/configdir.json");
    
    // delete "/startup/easy-samba.stop"
    fnDeleteFile("/startup/easy-samba.stop");
    
    // delete "/startup/easy-samba.pause"
    fnDeleteFile("/startup/easy-samba.pause");
    
    // in case of first startup, save a list of container's OS native users
    if (fs.existsSync("/startup/native_users.json") !== true){
        fnWriteFile("/startup/native_users.json", JSON.stringify(fnListUsers()));
    }

    // get config dir
    const configdir = fnGetConfigDir();
    fnWriteFile("/startup/configdir.json", JSON.stringify(configdir));
    log(`[LOG] easy-samba configuration files are located at '${configdir}'.`);
    
    log("------ EASY-SAMBA STARTUP COMPLETE ------\n");
}



