


// exports
module.exports = fnCreateShares;



// dependencies
const fs = require("fs");
const { spawnSync } = require("child_process");



// FUNCTION: fnCreateShares()
// INPUT: "shares" object, as described in "/share/config.json"
// OUTPUT: true in case of no errors, otherwise a string that describes the error
// PURPOSE: create the shares (if they don't exist) and set the correct ACLs for them
function fnCreateShares(shares){
    // for each share ...
    let i = 0;
    while (i < shares.length){
        
        // if it doesn't exist on disk, create it
        // TODO: could be improved
        // TODO: if path exists on disk, check if it's a directory ---> this should be done by fnValidateConfig()
        try {
            if (fs.existsSync(shares[i]["path"]) !== true){
                fs.mkdirSync(shares[i]["path"]);
            }
            if (fs.existsSync(shares[i]["path"]) !== true){ throw "ERROR"; }
        }
        catch (error){
            return "SHARE '" + shares[i]["path"] + "' COULD NOT BE CREATED";
        }
        
        // for each "user" of the share, generate the ACLs
        // EXAMPLE: shares[i]["users"] == ["rw:user1", "ro:user2"] --->
        //   entries == "u::rwx,g::rwx,o::x,u:user1:rwx,g:user1:rwx,u:user2:rx,g:user2:rx"
        let j = 0;
        let entries = ["u::rwx", "g::rwx", "o::x"];
        while (j < shares[i]["users"].length){
            const user = shares[i]["users"][j].substring(3);
            const perm = (shares[i]["users"][j].startsWith("ro:")) ? "rx" : "rwx";
            entries.push("u:" + user + ":" + perm + ",g:" + user + ":" + perm);
            j++;
        }
        entries = entries.join(",");
        
        // set the correct ACLs for the share
        // EXAMPLE: shares[i]["path"] == "/share/public" --->
        //   chown -R root:root '/share/public'
        //   setfacl -R -m 'u::rwx,g::rwx,o::x,u:user1:rwx,g:user1:rwx,u:user2:rwx,g:user2:rwx' '/share/public'
        //   setfacl -R -dm 'u::rwx,g::rwx,o::x,u:user1:rwx,g:user1:rwx,u:user2:rwx,g:user2:rwx' '/share/public'
        try {
            spawnSync("chown", ["-R", "root:root", shares[i]["path"]], { stdio: [undefined, undefined, undefined] });
            spawnSync("setfacl", ["-R", "-m", entries, shares[i]["path"]], { stdio: [undefined, undefined, undefined] });
            spawnSync("setfacl", ["-R", "-dm", entries, shares[i]["path"]], { stdio: [undefined, undefined, undefined] });
        }
        catch (error){
            return "PERMISSIONS FOR '" + shares[i]["path"] + "' COULD NOT BE SET";
        }
        
        i++;
    }

    return true;
}



