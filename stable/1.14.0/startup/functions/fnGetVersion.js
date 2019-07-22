


// exports
module.exports = fnGetVersion;



// dependencies
const fs = require("fs");



// FUNCTION: fnGetVersion()
// INPUT: N/A
// OUTPUT: an object that contains "version" and "branch" strings
function fnGetVersion(){
    let version = "N/A";
    let branch = "N/A";

    try {
        const versionFile = fs.readFileSync("/startup/version.txt", "utf8").split("\n");
        branch = versionFile[0].split("BRANCH: ")[1];
        version = versionFile[1].split("VERSION: ")[1];
    }
    catch (error){
        // do nothing
    }

    return { "version": version, "branch": branch };
}



