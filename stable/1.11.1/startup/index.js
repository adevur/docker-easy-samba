


// dependencies

// native Node.js modules
const { spawnSync, spawn } = require("child_process");
const fs = require("fs");

// external functions
const fnLoadConfig = require("/startup/functions/fnLoadConfig.js");
const fnValidateConfig = require("/startup/functions/fnValidateConfig.js");
const fnCreateUsers = require("/startup/functions/fnCreateUsers.js");
const fnCreateShares = require("/startup/functions/fnCreateShares.js");
const fnGenSmbConf = require("/startup/functions/fnGenSmbConf.js");
const fnSleep = require("/startup/functions/fnSleep.js");
const fnCleanUpUsers = require("/startup/functions/fnCleanUpUsers.js");
const fnIsRunning = require("/startup/functions/fnIsRunning.js");
const fnIsString = require("/startup/functions/fnIsString.js");

// global variables
let nmbd = undefined;
let smbd = undefined;
let nmbdRunning = false;
let smbdRunning = false;
let configgen = false;



// call the main function of this script
fnMain().catch((error) => {
    console.log(`[ERROR] script has failed for unknown reasons.`);
    console.log(`[DEBUG] DETAILS ABOUT THE ERROR:`, error);
});



async function fnMain(){
    // handle SIGTERM signals in case someone tries to stop this script
    process.on("SIGTERM", () => {
        process.exitCode = 0;
        process.exit();
    });

    // display version information
    try {
        const versionFile = fs.readFileSync("/startup/version.txt", "utf8").split("\n");
        const branch = versionFile[0].split("BRANCH: ")[1];
        const version = versionFile[1].split("VERSION: ")[1];
        console.log(`[LOG] you're using easy-samba version '${version}' from '${branch}' branch.`);
    }
    catch (error){
        console.log(`[WARNING] it's not been possible to display version information.`);
    }

    // start EasySamba Remote API daemon
    if (fnIsRunning("node /startup/remote-api/index.js") !== true && fs.existsSync("/share/config.json") !== true && fs.existsSync("/share/config.gen.js") !== true){
        try { fs.unlinkSync("/startup/remote-api.started"); } catch(error) {}

        spawn("node", ["/startup/remote-api/index.js"], { stdio: "ignore" })
            .on("error", () => {
                // do nothing
            })
            .on("exit", () => {
                // do nothing
            })
        ;

        await fnSleep(2000);

        console.log((fs.existsSync("/startup/remote-api.started")) ? `[LOG] EasySamba Remote API started successfully.` : `[ERROR] it's not been possible to start EasySamba Remote API.`);
    }

    // loop every 10 seconds
    let previous = undefined;
    while (true){
        // get current config.json file
        let current = undefined;
        try {
            current = (fs.existsSync("/share/config.json")) ? fs.readFileSync("/share/config.json", "utf8") : fs.readFileSync("/share/remote-api.config.json", "utf8");
            if (fnIsString(current) !== true || current.length < 1){
                current = undefined;
            }
        }
        catch (error){
            current = undefined;
        }

        // code to start configuration
        const startConfig = async () => {
            console.log(`[LOG] SAMBA server configuration process has started.`);
            const result = await fnRun();
            if (result === false){
                console.log(`[WARNING] configuration process has failed, re-trying in 10 seconds.`);
            }
            previous = (fnIsString(result) && result.length > 0) ? result : undefined;
        };

        // in case config.json has been modified, update running configuration
        if (previous === undefined || current !== previous){
            await startConfig();
        }
        // in case smbd or nmbd have stopped running unexpectedly, update running configuration
        else if (fnIsRunning("/usr/sbin/smbd") !== true || fnIsRunning("/usr/sbin/nmbd") !== true){
            console.log(`[WARNING] 'smbd' and/or 'nmbd' terminated unexpectedly, re-trying...`);
            await startConfig();
        }

        await fnSleep(10000);
    }
}



async function fnRun(){
    // if there's a "/share/config.gen.js" file, and "/share/config.json" and "/share/remote-api.config.json" are missing,
    //   generate the new config.json running "node /share/config.gen.js"
    if (fs.existsSync("/share/config.gen.js") === true && fs.existsSync("/share/config.json") !== true && fs.existsSync("/share/remote-api.config.json") !== true){
        // if config.gen.js is already running, abort
        if (configgen === true){
            console.log(`[LOG] '/share/config.gen.js' is already running.`);
            return false;
        }

        console.log(`[LOG] generating '/share/config.json' using script '/share/config.gen.js'...`);
        try {
            configgen = true;
            spawn("node", ["/share/config.gen.js"], { stdio: "ignore" }).on("exit", () => {
                configgen = false;
            }).on("error", () => {
                configgen = false;
            });
            console.log(`[LOG] '/share/config.gen.js' script has started, running configuration will be updated in 10 seconds.`);
        }
        catch (error){
            configgen = false;
            return false;
        }
        return true;
    }

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

    // load configuration from JSON file "/share/config.json" or "/share/remote-api.config.json"
    //  "rawConfig" is just plain text read from the configuration file, it is needed in order to be returned as output
    const { config, rawConfig } = fnLoadConfig();
    
    // if configuration file doesn't exist or it's not in JSON format, exit
    if (config === false){
        console.log(`[ERROR] '/share/config.json' could not be loaded or it is not in JSON format.`);
        return false;
    }
    console.log(`[LOG] '/share/config.json' has been correctly loaded.`);
    
    // check if configuration file's syntax is correct
    const validateConfig = fnValidateConfig(config);
    if (validateConfig !== true){
        console.log(`[ERROR] '/share/config.json' syntax is not correct: ${validateConfig}.`);
        return false;
    }
    console.log(`[LOG] '/share/config.json' syntax is correct.`);

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
        process.exitCode = 1;
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

    // wait 3 seconds...
    await fnSleep(3000);

    // script has been executed, now the SAMBA server is ready
    console.log(`[LOG] SAMBA server is now ready.`);

    return rawConfig;
}



async function fnStartDaemons(){
    if (smbd !== undefined && smbdRunning === true){
        process.kill(smbd.pid, "SIGKILL");
        smbdRunning = false;
    }

    if (nmbd !== undefined && nmbdRunning === true){
        process.kill(nmbd.pid, "SIGKILL");
        nmbdRunning = false;
    }

    // start "nmbd" daemon
    nmbdRunning = true;
    nmbd = spawn("/usr/sbin/nmbd", ["--foreground", "--no-process-group"], { stdio: "ignore" })
        .on("error", () => {
            nmbdRunning = false;
            console.log(`[ERROR] 'nmbd' could not be started.`);
        })
        .on("exit", () => {
            nmbdRunning = false;
        })
    ;

    // start "smbd" daemon
    smbdRunning = true;
    smbd = spawn("/usr/sbin/smbd", ["--foreground", "--no-process-group"], { stdio: "ignore" })
        .on("error", () => {
            smbdRunning = false;
            console.log(`[ERROR] 'smbd' could not be started.`);
        })
        .on("exit", () => {
            smbdRunning = false;
        })
    ;
}



