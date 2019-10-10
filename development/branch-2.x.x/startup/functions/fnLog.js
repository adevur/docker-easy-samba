


// exports
module.exports = fnLog;



// dependencies
const fs = require("fs");
const assert = require("assert");
const CFG = require("/startup/functions/fnGetConfigDir.js")();



// FUNCTION: fnLog()
// INPUT: "path" to file where logs will be stored
// PURPOSE: returns a function that can be used to log messages to stdout and to path
function fnLog(path){
    return (...args) => {
        return args.every((input) => {
            try {
                const msg = String(input);
                const color = (msg.startsWith("[ERROR]") || msg.startsWith("[WARNING]") || msg.startsWith("[DEBUG]")) ? "\x1b[33m" : "";
                
                process.stdout.write(color + msg + "\x1b[0m" + "\n");
                
                assert( fs.existsSync(path) );
                
                const date = new Date();
                const Y = String(date.getUTCFullYear());
                const M = String(date.getUTCMonth()).padStart(2, "0");
                const D = String(date.getUTCDate()).padStart(2, "0");
                const h = String(date.getUTCHours()).padStart(2, "0");
                const m = String(date.getUTCMinutes()).padStart(2, "0");
                const s = String(date.getUTCSeconds()).padStart(2, "0");
                
                const datetime = (msg.trim() !== "") ? `[${Y}-${M}-${D} ${h}:${m}:${s} UTC]` : ``;
                
                fs.appendFileSync(path, `${datetime}  ${msg}\n`, { encoding: "utf8" });
                
                return true;
            }
            catch (error){
                return false;
            }
        });
    };
}
