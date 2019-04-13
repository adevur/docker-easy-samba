


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
    let i = 0;
    while (i < users.length){
        
        // add the user to the OS
        // EXAMPLE: users[i] == { "name": "user1", "password": "123456" } --->
        //   useradd -M user1
        //   echo '123456' | passwd user1 --stdin
        try {
            spawnSync("useradd", ["-M", users[i]["name"]], { stdio: [undefined, undefined, undefined] });
            spawnSync("passwd", [users[i]["name"], "--stdin"], { input: users[i]["password"] + "\n", stdio: [undefined, undefined, undefined] });
            if (fnUserExists(users[i]["name"]) !== true){ throw "ERROR"; }
        }
        catch (error){
            return "USER '" + users[i]["name"] + "' COULD NOT BE ADDED TO OS";
        }
        
        // add the user to SAMBA
        // EXAMPLE: users[i] == { "name": "user1", "password": "123456" } --->
        //   (echo '123456'; echo '123456') | smbpasswd -a user1 -s
        try {
            spawnSync("smbpasswd", ["-a", users[i]["name"], "-s"], { input: users[i]["password"] + "\n" + users[i]["password"] + "\n", stdio: [undefined, undefined, undefined] });
        }
        catch (error){
            return "USER '" + users[i]["name"] + "' COULD NOT BE ADDED TO SAMBA";
        }
        
        i++;
    }

    return true;
}



