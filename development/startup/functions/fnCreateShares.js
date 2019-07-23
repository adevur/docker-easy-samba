


// exports
module.exports = fnCreateShares;



// dependencies
const fs = require("fs");
const { spawnSync } = require("child_process");
const fnHas = require("/startup/functions/fnHas.js");



// FUNCTION: fnCreateShares()
// INPUT: "shares" object, as described in "config.json"
// OUTPUT: true in case of no errors, otherwise a string that describes the error
// PURPOSE: create the shares (if they don't exist) and set the correct ACLs for them
function fnCreateShares(shares){
    // for each "share" in "shares" ...
    let errorMsg = "";
    const result = shares.every((share) => {
        // if it doesn't exist on disk, create it
        // TODO: could be improved
        try {
            if (fs.existsSync(share["path"]) !== true){
                fs.mkdirSync(share["path"]);
            }
            if (fs.existsSync(share["path"]) !== true){ throw "ERROR"; }
        }
        catch (error){
            errorMsg = `SHARE '${share["path"]}' COULD NOT BE CREATED`;
            return false;
        }

        // for each "user" of the share, generate the ACLs
        // EXAMPLE: share["users"] == ["rw:user1", "ro:user2"] --->
        //   entries == "u::rwx,g::rwx,o::x,u:user1:rwx,g:user1:rwx,u:user2:rx,g:user2:rx"
        let entries = ["u::rwx", "g::rwx", "o::x"];
        share["users"].forEach((user) => {
            const name = user.substring(3);
            const perm = (user.startsWith("ro:")) ? "rx" : "rwx";
            entries.push(`u:${name}:${perm},g:${name}:${perm}`);
        });
        // if share has guest access...
        if (fnHas(share, "guest")){
            const perm = (share["guest"] === "rw") ? "rwx" : "rx";
            entries.push(`u:nobody:${perm},g:nobody:${perm}`);
        }
        entries = entries.join(",");

        // set the correct ACLs for the share
        // EXAMPLE: share["path"] == "/share/public" --->
        //   chown -R root:root '/share/public'
        //   setfacl -R -m 'u::rwx,g::rwx,o::x,u:user1:rwx,g:user1:rwx,u:user2:rwx,g:user2:rwx' '/share/public'
        //   setfacl -R -dm 'u::rwx,g::rwx,o::x,u:user1:rwx,g:user1:rwx,u:user2:rwx,g:user2:rwx' '/share/public'
        try {
            spawnSync("chown", ["-R", "root:root", share["path"]], { stdio: "ignore" });
            spawnSync("setfacl", ["-R", "-m", entries, share["path"]], { stdio: "ignore" });
            spawnSync("setfacl", ["-R", "-dm", entries, share["path"]], { stdio: "ignore" });
        }
        catch (error){
            errorMsg = `PERMISSIONS FOR '${share["path"]}' COULD NOT BE SET`;
            return false;
        }

        return true;
    });

    if (result !== true){
        return errorMsg;
    }

    return true;
}



