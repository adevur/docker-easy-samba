


// exports
module.exports = fnCleanUpUsers;



// dependencies
const { spawnSync } = require("child_process");
const fnListUsers = require("/startup/functions/fnListUsers.js");



// TODO: brief description
function fnCleanUpUsers(){
    // this is a list of standard CentOS users
    // TODO: native users' list should be retrieved on container's first startup
    //   they shouldn't be saved in a static array
    const nativeUsers = ["root", "bin", "daemon", "adm", "lp", "sync", "shutdown", "halt", "mail", "operator", "games", "ftp", "nobody", "systemd-network", "dbus"];

    // get current users' list
    const currentUsers = fnListUsers();

    // delete each user not included in 'nativeUser', both from OS and from SAMBA
    try {
        currentUsers.forEach((user) => {
            if (nativeUsers.includes(user) !== true){
                spawnSync("smbpasswd", ["-x", user], { stdio: "ignore" });
                spawnSync("userdel", ["-r", user], { stdio: "ignore" });
            }
        });

        // check if there are still non-native users
        // TODO: currently, it only checks OS users, and not SAMBA users
        //   HINT: command 'pdbedit -L' returns a list of SAMBA users
        const newCurrentUsers = fnListUsers();
        if (newCurrentUsers.every((user) => { return nativeUsers.includes(user); }) !== true){
            throw "ERROR";
        }
    }
    catch (error){
        return false;
    }

    return true;
}
