


// exports
module.exports = fnCreateUsers;



// dependencies
const { spawnSync } = require("child_process");
const fnUserExists = require("/startup/functions/fnUserExists.js");



// FUNCTION: fnCreateUsers()
// INPUT: "users" object, as described in "/share/config.json"
// OUTPUT: true in case of no errors, otherwise a string that describes the error
// PURPOSE: add the users in the container's OS and in SAMBA
function fnCreateUsers(users){
    // for each "user" in "users" ...
    let errorMsg = "";
    const result = users.every((user) => {
        // add the user to the OS
        // EXAMPLE: user == { "name": "user1", "password": "123456" } --->
        //   useradd -M user1
        //   echo '123456' | passwd user1 --stdin
        try {
            spawnSync("useradd", ["-M", user["name"]], { stdio: "ignore" });
            spawnSync("passwd", [user["name"], "--stdin"], { input: `${user["password"]}\n`, stdio: [undefined, "ignore", "ignore"] });
            if (fnUserExists(user["name"]) !== true){ throw "ERROR"; }
        }
        catch (error){
            errorMsg = `USER '${user["name"]}' COULD NOT BE ADDED TO OS`;
            return false;
        }

        // add the user to SAMBA
        // EXAMPLE: user == { "name": "user1", "password": "123456" } --->
        //   (echo '123456'; echo '123456') | smbpasswd -a user1 -s
        try {
            spawnSync("smbpasswd", ["-a", user["name"], "-s"], { input: `${user["password"]}\n${user["password"]}\n`, stdio: [undefined, "ignore", "ignore"] });
        }
        catch (error){
            errorMsg = `USER '${user["name"]}' COULD NOT BE ADDED TO SAMBA`;
            return false;
        }

        return true;
    });

    if (result !== true){
        return errorMsg;
    }

    return true;
}



