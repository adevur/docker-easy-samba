


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
        return args.every((msg) => {
            try {
                console.log(msg);
                
                assert( CFG === "/share/config" );
                
                const date = new Date();
                const Y = String(date.getUTCFullYear());
                const M = String(date.getUTCMonth()).padStart(2, "0");
                const D = String(date.getUTCDate()).padStart(2, "0");
                const h = String(date.getUTCHours()).padStart(2, "0");
                const m = String(date.getUTCMinutes()).padStart(2, "0");
                const s = String(date.getUTCSeconds()).padStart(2, "0");
                
                const datetime = (String(msg).trim() !== "") ? `[${Y}-${M}-${D} ${h}:${m}:${s} UTC]` : ``;
                
                fs.appendFileSync(path, `${datetime}  ${String(msg)}\n`, { encoding: "utf8" });
            }
            catch (error){
                return false;
            }
            
            return true;
        });
    };
}
