


// exports
module.exports = fnGetVersion;



// dependencies
const fs = require("fs");
const assert = require("assert");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnHas = require("/startup/functions/fnHas.js");



// FUNCTION: fnGetVersion()
// INPUT: N/A
// OUTPUT: an object that contains "version" and "branch" strings
function fnGetVersion(){
    let version = "N/A";
    let branch = "N/A";

    try {
        const json = fs.readFileSync("/startup/version.json", "utf8");
        const parsed = JSON.parse(json);
        assert( fnHas(parsed, ["branch", "version"]) );
        assert( [parsed["branch"], parsed["version"]].every(fnIsString) );
        
        branch = parsed["branch"];
        version = parsed["version"];
    }
    catch (error){
        // do nothing
    }

    return { "version": version, "branch": branch };
}



