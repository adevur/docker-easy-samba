


// exports
module.exports = fnCleanUpUsers;



// dependencies
const { spawnSync } = require("child_process");
const fnListUsers = require("/startup/functions/fnListUsers.js");
const fnListSambaUsers = require("/startup/functions/fnListSambaUsers.js");
const fs = require("fs");



// TODO: brief description
function fnCleanUpUsers(){
    try {
        // retrieve the list of CentOS native users from file "/startup/native_users.json", created on first startup
        const nativeUsers = JSON.parse(fs.readFileSync("/startup/native_users.json", "utf8"));

        // get current users' list
        const currentUsers = fnListUsers();

        // delete each user not included in 'nativeUsers', both from OS and from SAMBA
        currentUsers.forEach((user) => {
            if (nativeUsers.includes(user) !== true){
                spawnSync("smbpasswd", ["-x", user], { stdio: "ignore" });
                spawnSync("userdel", ["-r", user], { stdio: "ignore" });
            }
        });

        // check if there are still non-native users
        const newCurrentUsers = fnListUsers();
        const newCurrentSambaUsers = fnListSambaUsers();
        if (newCurrentSambaUsers.length > 0 || newCurrentUsers.every((user) => { return nativeUsers.includes(user); }) !== true){
            throw "ERROR";
        }
        
        return true;
    }
    catch (error){
        return false;
    }
}
