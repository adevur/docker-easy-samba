


// exports
module.exports = fnCreateGuest;



// dependencies
const fs = require("fs");
const { spawnSync } = require("child_process");



// FUNCTION: fnCreateGuest()
// INPUT: "guestdir" is the path of the guest's share
// OUTPUT: true in case of no errors, otherwise a string that describes the error
// PURPOSE: configure the guest's share
function fnCreateGuest(guestdir){
    // if "guestdir" doesn't exist on disk, create it
    // TODO: could be improved
    // TODO: if path exists on disk, check if it's a directory ---> this should be done by fnValidateConfig()
    try {
        if (fs.existsSync(guestdir) !== true){
            fs.mkdirSync(guestdir);
        }
        if (fs.existsSync(guestdir) !== true){ throw "ERROR"; }
    }
    catch (error){
        return "GUEST SHARE '" + guestdir + "' COULD NOT BE CREATED";
    }

    // set guest share permissions and ACLs
    // HOW:
    //   chown -R nobody:nobody ${guestdir}
    //   setfacl -R -m 'u::rwx,g::rwx,o::rwx,u:nobody:rwx,g:nobody:rwx' ${guestdir}
    //   setfacl -R -dm 'u::rwx,g::rwx,o::rwx,u:nobody:rwx,g:nobody:rwx' ${guestdir}
    try {
        spawnSync("chown", ["-R", "nobody:nobody", guestdir], { stdio: [undefined, undefined, undefined] });
        spawnSync("setfacl", ["-R", "-m", "u::rwx,g::rwx,o::rwx,u:nobody:rwx,g:nobody:rwx", guestdir], { stdio: [undefined, undefined, undefined] });
        spawnSync("setfacl", ["-R", "-dm", "u::rwx,g::rwx,o::rwx,u:nobody:rwx,g:nobody:rwx", guestdir], { stdio: [undefined, undefined, undefined] });
    }
    catch (error){
        return "PERMISSIONS FOR GUEST SHARE '" + guestdir + "' COULD NOT BE SET";
    }

    return true;
}
