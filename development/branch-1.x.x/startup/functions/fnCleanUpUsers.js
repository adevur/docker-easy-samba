


// exports
module.exports = fnCleanUpUsers;



// dependencies
const fs = require("fs");
const { spawnSync } = require("child_process");
const assert = require("assert");
const fnListUsers = require("/startup/functions/fnListUsers.js");
const fnListSambaUsers = require("/startup/functions/fnListSambaUsers.js");
const fnIsArray = require("/startup/functions/fnIsArray.js");
const fnIsString = require("/startup/functions/fnIsString.js");



// FUNCTION: fnCleanUpUsers()
// INPUT: N/A
// OUTPUT: true in case of success, otherwise false
// PURPOSE: deletes non-native users from the container
function fnCleanUpUsers(){
    try {
        // retrieve the list of CentOS native users from file "/startup/native_users.json", created on first startup
        const nativeUsers = JSON.parse(fs.readFileSync("/startup/native_users.json", "utf8"));
        assert( fnIsArray(nativeUsers) && nativeUsers.every(fnIsString) );

        // get current users' list
        let currentUsers = fnListUsers();
        assert( nativeUsers.every((e) => { return currentUsers.includes(e); }) );

        // delete each user not included in 'nativeUsers', both from OS and from SAMBA
        currentUsers.forEach((user) => {
            if (nativeUsers.includes(user) !== true){
                spawnSync("smbpasswd", ["-x", user], { stdio: "ignore" });
                spawnSync("userdel", ["-r", user], { stdio: "ignore" });
            }
        });

        // check if there are still non-native users
        currentUsers = fnListUsers();
        const currentSambaUsers = fnListSambaUsers();
        assert( currentSambaUsers.length === 0 );
        assert(currentUsers.every((user) => {
            return nativeUsers.includes(user);
        }));
        
        return true;
    }
    catch (error){
        return false;
    }
}
