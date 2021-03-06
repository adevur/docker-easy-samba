


// dependencies

// native Node.js modules
const { spawnSync, spawn } = require("child_process");
const fs = require("fs");

// external functions
const fnLoadConfig = require("/startup/functions/fnLoadConfig.js");
const fnValidateConfig = require("/startup/functions/fnValidateConfig.js");
const fnCreateGuest = require("/startup/functions/fnCreateGuest.js");
const fnCreateUsers = require("/startup/functions/fnCreateUsers.js");
const fnCreateShares = require("/startup/functions/fnCreateShares.js");
const fnGenSmbConf = require("/startup/functions/fnGenSmbConf.js");
const fnSleep = require("/startup/functions/fnSleep.js");



// call the main function of this script
fnMain().catch((error) => {
    console.log("[ERROR] script has failed for unknown reasons.");
    console.log("[DEBUG] DETAILS ABOUT THE ERROR:", error);
});



// FIXME: guest share implementation gives permission errors
// TODO: implement "*" wildcard to match all users in config.json/shares/access
//   HINT: a share object would look like this: { "name": "public", "path": "/share/public", "access": ["ro:*", "rw:user1"] }
//     it means: share named "public" with path "/share/public" can be read by all users, and only "user1" has write permissions on it
// TODO: implement "no:" permission in "config.json/shares/access" property
//   EXAMPLE: { "name": "public", "path": "/share/public", "access": ["rw:group1", "ro:user1", "no:user2"] }
//     it means: there's a share named "public" located at "/share/public" and it can be read and written by all users of group1
//       with two exceptions: user1 has only read access, and user2 has no access at all
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
        console.log("[LOG] you're using easy-samba version '" + version + "' from '" + branch + "' branch.");
    }
    catch (error){
        console.log("[WARNING] it's not been possible to display version information.");
    }

    // now the script can start
    console.log("[LOG] SAMBA server configuration process has started.");

    // load configuration from JSON file "/share/config.json"
    const config = fnLoadConfig("/share/config.json");
    
    // if configuration file doesn't exist or it's not in JSON format, exit
    if (config === false){
        console.log("[ERROR] '/share/config.json' could not be loaded or it is not in JSON format.");
        process.exitCode = 1;
        return;
    }
    console.log("[LOG] '/share/config.json' has been correctly loaded.");
    
    // check if configuration file's syntax is correct
    const validateConfig = fnValidateConfig(config);
    if (validateConfig !== true){
        console.log("[ERROR] '/share/config.json' syntax is not correct: " + validateConfig + ".");
        process.exitCode = 1;
        return;
    }
    console.log("[LOG] '/share/config.json' syntax is correct.");

    // reset permissions of "/share"
    // HOW: setfacl -R -bn /share && chmod -R a+rX /share
    try {
        spawnSync("setfacl", ["-R", "-bn", "/share"], { stdio: "ignore" });
        spawnSync("chmod", ["-R", "a+rX", "/share"], { stdio: "ignore" });
    }
    catch (error){
        console.log("[ERROR] permissions of '/share' could not be reset.");
        process.exitCode = 1;
        return;
    }
    console.log("[LOG] permissions of '/share' have been correctly reset.");
    
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
        console.log("[ERROR] permissions of '/share' could not be set.");
        process.exitCode = 1;
        return;
    }
    console.log("[LOG] permissions of '/share' have been correctly set.");

    // add guest share
    if (config["guest"] !== false) {
        const createGuest = fnCreateGuest(config["guest"]);
        if (createGuest !== true){
            console.log("[ERROR] guest share could not be created: " + createGuest + ".");
            process.exitCode = 1;
            return;
        }
        console.log("[LOG] guest share has been correctly created.");
    }
    else {
        console.log("[LOG] guest share will not be created.");
    }

    // add the users in the container's OS and in SAMBA
    const createUsers = fnCreateUsers(config["users"]);
    if (createUsers !== true){
        console.log("[ERROR] users could not be created: " + createUsers + ".");
        process.exitCode = 1;
        return;
    }
    console.log("[LOG] users have been correctly created.");

    // create the shares (if they don't exist) and set the correct ACLs for them
    const createShares = fnCreateShares(config["shares"]);
    if (createShares !== true){
        console.log("[ERROR] shares could not be created: " + createShares + ".");
        process.exitCode = 1;
        return;
    }
    console.log("[LOG] shares have been correctly created.");

    // generate the SAMBA server configuration and write it to "/etc/samba/smb.conf"
    try {
        const smbconf = fnGenSmbConf(config["domain"], config["guest"], config["shares"]);
        fs.writeFileSync("/etc/samba/smb.conf", smbconf);
    }
    catch (error){
        console.log("[ERROR] '/etc/samba/smb.conf' could not be generated or written.");
        process.exitCode = 1;
        return;
    }
    console.log("[LOG] '/etc/samba/smb.conf' has been correctly generated and written.");

    // start "nmbd" daemon
    console.log("[LOG] starting 'nmbd'...");
    spawn("/usr/sbin/nmbd", ["--foreground", "--no-process-group"], { stdio: "ignore" })
        .on("error", () => {
            console.log("[ERROR] 'nmbd' could not be started.");
            process.exitCode = 1;
            process.exit();
        })
        .on("exit", () => {
            console.log("[ERROR] 'nmbd' terminated for unknown reasons.");
            process.exitCode = 1;
            process.exit();
        })
        .on("message", () => {
            // do nothing
            // EXPLAIN: this is needed in order to prevent the script from exiting
        })
    ;

    // wait 2 seconds
    console.log("[LOG] waiting 2 seconds before starting 'smbd'...");
    await fnSleep(2000);

    // start "smbd" daemon
    console.log("[LOG] starting 'smbd'...");
    spawn("/usr/sbin/smbd", ["--foreground", "--no-process-group"], { stdio: "ignore" })
        .on("error", () => {
            console.log("[ERROR] 'smbd' could not be started.");
            process.exitCode = 1;
            process.exit();
        })
        .on("exit", () => {
            console.log("[ERROR] 'smbd' terminated for unknown reasons.");
            process.exitCode = 1;
            process.exit();
        })
        .on("message", () => {
            // do nothing
            // EXPLAIN: this is needed in order to prevent the script from exiting
        })
    ;

    // script has been executed, now the SAMBA server is ready
    console.log("[LOG] SAMBA server is now ready.");
}



