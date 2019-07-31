


// exports
module.exports = fnDiskUsage;



// dependencies
const fs = require("fs");
const { spawnSync } = require("child_process");
const assert = require("assert");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnIsInteger = require("/startup/functions/fnIsInteger.js");



// FUNCTION: fnDiskUsage()
// INPUT: "path" of file or directory to get size of
// OUTPUT: size of file or directory in bytes
// HOW: it uses Linux command "du -s -b 'path'"
function fnDiskUsage(path){
    try {
        assert( fnIsString(path) && path.length > 0 );
        assert( fs.existsSync(path) );
        const stdout = spawnSync("du", ["-s", "-b", path], { encoding: "utf8", stdio: ["ignore", undefined, "ignore"] }).stdout;
        assert( stdout.includes(path) );
        const size = parseInt(stdout.trim().split("\t")[0], 10);
        assert( fnIsInteger(size) );
        
        return size;
    }
    catch (error){
        return 0;
    }
}
