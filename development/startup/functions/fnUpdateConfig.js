


// exports
module.exports = fnUpdateConfig;



// dependencies
const fs = require("fs");
const { spawnSync } = require("child_process");
const fnCleanUpUsers = require("/startup/functions/fnCleanUpUsers.js");
const fnValidateConfig = require("/startup/functions/fnValidateConfig.js");
const fnCreateUsers = require("/startup/functions/fnCreateUsers.js");
const fnCreateShares = require("/startup/functions/fnCreateShares.js");
const fnGenSmbConf = require("/startup/functions/fnGenSmbConf.js");
const fnSleep = require("/startup/functions/fnSleep.js");
const fnIsRunning = require("/startup/functions/fnIsRunning.js");
const fnKill = require("/startup/functions/fnKill.js");
const fnSpawn = require("/startup/functions/fnSpawn.js");



// FUNCTION: fnUpdateConfig()
// INPUT: "config", as parsed from fnLoadConfig() earlier
// OUTPUT: true in case of success, otherwise false
async function fnUpdateConfig(config){
    // remove all non-native users from container's OS and from SAMBA
    //   EXPLAIN: non-native users are the users that aren't included
    //     in a standard CentOS installation;
    //     this is needed in case easy-samba container is restarted:
    //     this way, we'll first clean up all users created by easy-samba earlier
    const cleanUpUsers = fnCleanUpUsers();
    if (cleanUpUsers !== true){
        console.log(`[ERROR] it's not been possible to clean up existing users.`);
        return false;
    }
    
    // check if configuration file's syntax is correct
    const validateConfig = fnValidateConfig(config);
    if (validateConfig !== true){
        console.log(`[ERROR] easy-samba configuration syntax is not correct: ${validateConfig}.`);
        return false;
    }
    console.log(`[LOG] easy-samba configuration syntax is correct.`);

    // reset permissions of "/share"
    // HOW: setfacl -R -bn /share && chmod -R a+rX /share
    try {
        spawnSync("setfacl", ["-R", "-bn", "/share"], { stdio: "ignore" });
        spawnSync("chmod", ["-R", "a+rX", "/share"], { stdio: "ignore" });
    }
    catch (error){
        console.log(`[ERROR] permissions of '/share' could not be reset.`);
        return false;
    }
    console.log(`[LOG] permissions of '/share' have been correctly reset.`);
    
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
    }
    catch (error){
        console.log(`[ERROR] permissions of '/share' could not be set.`);
        return false;
    }
    console.log(`[LOG] permissions of '/share' have been correctly set.`);

    // add the users in the container's OS and in SAMBA
    const createUsers = fnCreateUsers(config["users"]);
    if (createUsers !== true){
        console.log(`[ERROR] users could not be created: ${createUsers}.`);
        return;
    }
    console.log(`[LOG] users have been correctly created.`);

    // create the shares (if they don't exist) and set the correct ACLs for them
    const createShares = fnCreateShares(config["shares"]);
    if (createShares !== true){
        console.log(`[ERROR] shares could not be created: ${createShares}.`);
        return false;
    }
    console.log(`[LOG] shares have been correctly created.`);

    // generate the SAMBA server configuration and write it to "/etc/samba/smb.conf"
    try {
        const smbconf = fnGenSmbConf(config);
        fs.writeFileSync("/etc/samba/smb.conf", smbconf);
    }
    catch (error){
        console.log(`[ERROR] '/etc/samba/smb.conf' could not be generated or written.`);
        return false;
    }
    console.log(`[LOG] '/etc/samba/smb.conf' has been correctly generated and written.`);

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
    if (fnIsRunning("/usr/sbin/nmbd --foreground --no-process-group") || fnIsRunning("/usr/sbin/smbd --foreground --no-process-group")){
        fnKill("/usr/sbin/smbd --foreground --no-process-group");
        fnKill("/usr/sbin/nmbd --foreground --no-process-group");
    }

    // start "nmbd" daemon
    fnSpawn("/usr/sbin/nmbd", ["--foreground", "--no-process-group"]);

    // start "smbd" daemon
    fnSpawn("/usr/sbin/smbd", ["--foreground", "--no-process-group"]);
}



