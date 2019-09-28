


// exports
module.exports = fnSpawn;



// dependencies
const { spawn } = require("child_process");



// FUNCTION: fnSpawn()
// INPUT: "cmd" and "args" (same parameters of Node's spawn)
// OUTPUT: N/A
function fnSpawn(cmd, args){
    try {
        spawn(cmd, args, { stdio: "ignore" }).on("error", () => {
            // do nothing
        }).on("exit", () => {
            // do nothing
        });
    }
    catch (error){
        // do nothing
    }
}



