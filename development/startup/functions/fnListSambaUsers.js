


// exports
module.exports = fnListSambaUsers;



// dependencies
const { spawnSync } = require("child_process");



// FUNCTION: fnListSambaUsers()
// OUTPUT: an array with the users of SAMBA
// PURPOSE: get all the users of SAMBA
function fnListSambaUsers(){
    let passwd = undefined;

    try {
        passwd = spawnSync("pdbedit", ["-L"], { encoding: "utf8" }).stdout;
    }
    catch (error){
        return [];
    }

    // delete all lines that are not valid (e.g. empty lines)
    // TODO: not really correct, but it does work
    const lines = passwd.split("\n").filter((line) => {
        return line.includes(":");
    });

    return lines.map((e) => {
        return e.split(":")[0];
    });
}
