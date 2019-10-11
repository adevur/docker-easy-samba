


// exports
module.exports = fnLogX;



// dependencies
const fs = require("fs");
const assert = require("assert");
const crypto = require("crypto");
const fnIsString = require("/startup/functions/fnIsString.js");



// FUNCTION: fnLogX()
// INPUT: "path" to file where logs will be stored
// PURPOSE: returns a function that can be used to log detailed messages to path
// HOW: the log looks like this: { id: "AB234E" datetime: 123456, event: "auth-failed", tags: ["auth", "failure"], params: { "username": "admin" } }
function fnLogX(path){
    return (event, params, tags = []) => {
        try {
            const obj = {};
            
            obj["datetime"] = Date.now();
            obj["event"] = event;
            obj["tags"] = tags;
            obj["params"] = params;
        
            let msg = JSON.stringify(obj);
            assert( fnIsString(msg) );
            const hash = crypto.createHash("sha256").update(msg, "utf8").digest("hex").toUpperCase();
            obj["id"] = hash;
            msg = JSON.stringify(obj);
            assert( fnIsString(msg) );
            
            assert( fs.existsSync(path) );
            fs.appendFileSync(path, `${msg}\n`, { encoding: "utf8" });
            
            return true;
        }
        catch (error){
            return false;
        }
    };
}
