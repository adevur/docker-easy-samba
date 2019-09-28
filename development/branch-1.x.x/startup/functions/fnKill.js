


// exports
module.exports = fnKill;



// dependencies
const { spawnSync } = require("child_process");
const assert = require("assert");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnIsRunning = require("/startup/functions/fnIsRunning.js");



// FUNCTION: fnKill()
// INPUT: name of process
// OUTPUT: boolean
// PURPOSE: this function kills all processes with specified name, and returns true in case of success
// HOW: it uses Linux command "pkill --signal SIGKILL -f 'name of process'"
function fnKill(name){
    try {
        assert( fnIsString(name) && name.length > 0 );
        spawnSync("pkill", ["--signal", "SIGKILL", "-f", name], { stdio: "ignore" });
        assert( fnIsRunning(name) !== true );
        return true;
    }
    catch (error){
        return false;
    }
}
