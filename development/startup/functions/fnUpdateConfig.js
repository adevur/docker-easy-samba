


// exports
module.exports = fnUpdateConfig;



// dependencies
const fs = require("fs");
const { spawnSync } = require("child_process");
const assert = require("assert");
const fnCleanUpUsers = require("/startup/functions/fnCleanUpUsers.js");
const fnValidateConfig = require("/startup/functions/fnValidateConfig.js");
const fnCreateUsers = require("/startup/functions/fnCreateUsers.js");
const fnCreateShares = require("/startup/functions/fnCreateShares.js");
const fnGenSmbConf = require("/startup/functions/fnGenSmbConf.js");
const fnSleep = require("/startup/functions/fnSleep.js");
const fnIsRunning = require("/startup/functions/fnIsRunning.js");
const fnKill = require("/startup/functions/fnKill.js");
const fnSpawn = require("/startup/functions/fnSpawn.js");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");



// FUNCTION: fnUpdateConfig()
// INPUT: "config", as parsed from fnLoadConfig() earlier
// OUTPUT: true in case of success, otherwise false
async function fnUpdateConfig(config){
    let errorMsg = undefined;

    // remove all non-native users from container's OS and from SAMBA
    //   EXPLAIN: non-native users are the users that aren't included
    //     in a standard CentOS installation;
    //     this is needed in case easy-samba container is restarted:
    //     this way, we'll first clean up all users created by easy-samba earlier
    try {
        assert( fnCleanUpUsers() );
    }
    catch (error){
        console.log(`[ERROR] it's not been possible to clean up existing users.`);
        return false;
    }
    
    // check if configuration file's syntax is correct
    errorMsg = "UNKNOWN ERROR";
    try {
        errorMsg = fnValidateConfig(config);
        assert( errorMsg === true );
        console.log(`[LOG] easy-samba configuration syntax is correct.`);
    }
    catch (error){
        console.log(`[ERROR] easy-samba configuration syntax is not correct: ${errorMsg}.`);
        return false;
    }

    // reset permissions of "/share"
    // HOW: setfacl -R -bn /share && chmod -R a+rX /share
    try {
        spawnSync("setfacl", ["-R", "-bn", "/share"], { stdio: "ignore" });
        spawnSync("chmod", ["-R", "a+rX", "/share"], { stdio: "ignore" });
        console.log(`[LOG] permissions of '/share' have been correctly reset.`);
    }
    catch (error){
        console.log(`[ERROR] permissions of '/share' could not be reset.`);
        return false;
    }
    
    // set permissions of "/share"
    // EXPLAIN: at first, we set that "/share" and all its children are owned by root:root
    //   and that only root can read or make changes to them
    // HOW:
    //   chown -R root:root /share
    //   setfacl -R -m 'u::rwx,g::rwx,o::x' /share
    //   setfacl -R -dm 'u::rwx,g::rwx,o::x' /share
    try {
        spawnSync("chown", ["-R", "root:root", "/share"], { stdio: "ignore" });
        spawnSync("setfacl", ["-R", "-m", "u::rwx,g::rwx,o::x", "/share"], { stdio: "ignore" });
        spawnSync("setfacl", ["-R", "-dm", "u::rwx,g::rwx,o::x", "/share"], { stdio: "ignore" });
        console.log(`[LOG] permissions of '/share' have been correctly set.`);
    }
    catch (error){
        console.log(`[ERROR] permissions of '/share' could not be set.`);
        return false;
    }

    // add the users in the container's OS and in SAMBA
    errorMsg = "UNKNOWN ERROR";
    try {
        errorMsg = fnCreateUsers(config["users"]);
        assert( errorMsg === true );
        console.log(`[LOG] users have been correctly created.`);
    }
    catch (error){
        console.log(`[ERROR] users could not be created: ${errorMsg}.`);
        return false;
    }

    // create the shares (if they don't exist) and set the correct ACLs for them
    errorMsg = "UNKNOWN ERROR";
    try {
        errorMsg = fnCreateShares(config["shares"]);
        assert( errorMsg === true );
        console.log(`[LOG] shares have been correctly created.`);
    }
    catch (error){
        console.log(`[ERROR] shares could not be created: ${errorMsg}.`);
        return false;
    }

    // generate the SAMBA server configuration and write it to "/etc/samba/smb.conf"
    try {
        const smbconf = fnGenSmbConf(config);
        assert( fnWriteFile("/etc/samba/smb.conf", smbconf) );
        console.log(`[LOG] '/etc/samba/smb.conf' has been correctly generated and written.`);
    }
    catch (error){
        console.log(`[ERROR] '/etc/samba/smb.conf' could not be generated or written.`);
        return false;
    }

    // run nmbd and smbd daemons
    console.log(`[LOG] starting 'nmbd' and 'smbd' daemons...`);
    fnStartDaemons();

    // wait 2 seconds...
    await fnSleep(2000);

    // script has been executed, now the SAMBA server is ready
    console.log(`[LOG] SAMBA server is now ready.`);

    return true;
}



function fnStartDaemons(){
    fnKill("/usr/sbin/smbd --foreground --no-process-group");
    fnKill("/usr/sbin/nmbd --foreground --no-process-group");

    // start "nmbd" daemon
    fnSpawn("/usr/sbin/nmbd", ["--foreground", "--no-process-group"]);

    // start "smbd" daemon
    fnSpawn("/usr/sbin/smbd", ["--foreground", "--no-process-group"]);
}



