


// exports
module.exports = fnIsRunning;



// dependencies
const { spawnSync } = require("child_process");



// FUNCTION: fnIsRunning()
// INPUT: name of process
// OUTPUT: boolean
// PURPOSE: this function returns true in case the process is running
// HOW: it uses Linux command "ps -ef" in order to retrieve the list of running processes
// TODO: could be improved
function fnIsRunning(name){
    try {
        const stdout = spawnSync("ps", ["-ef"], { encoding: "utf8", stdio: ["ignore", undefined, "ignore"] }).stdout;
        const processes = stdout.split("\n");
        return processes.some((line) => { return (line.includes(name)); });
    }
    catch (error){
        return false;
    }
}
