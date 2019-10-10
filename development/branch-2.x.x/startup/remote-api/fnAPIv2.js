


// exports
module.exports = fnAPIv2;



// dependencies
const fs = require("fs");
const assert = require("assert");
const crypto = require("crypto");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnGetVersion = require("/startup/functions/fnGetVersion.js");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const fnSecureStringCompare = require("/startup/functions/fnSecureStringCompare.js");
const CFG = require("/startup/functions/fnGetConfigDir.js")();



function fnAPIv2(str, config){
    // available API methods in this Remote API version
    const METHODS = config["$METHODS"];
    
    // validate input
    let input = undefined;
    try {
        input = JSON.parse(str);
        assert( fnHas(input, ["jsonrpc", "method", "params", "id"]) );
        assert( input["jsonrpc"] === "2.0" );
        assert( fnIsString(input["id"]) );
        assert( fnIsString(input["method"]) );
    }
    catch (error){
        return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:INVALID-INPUT" };
    }
    
    const id = input["id"];
    const params = input["params"];
    const method = input["method"];
    
    // validate creds
    try {
        assert( fnHas(params, "auth") );
        assert( fnHas(params["auth"], ["username", "password"]) );
        assert( [params["auth"]["username"], params["auth"]["password"]].every(fnIsString) );
        
        let correctPassword = false;
        config["users"].forEach((e) => {
            correctPassword = (e["name"] === params["auth"]["username"] && fnSecureStringCompare(params["auth"]["password"], e["password"])) ? true : correctPassword;
        });
        
        assert( correctPassword );
    }
    catch (error){
        return { "jsonrpc": "2.0", "result": null, "error": `REMOTE-API:INVALID-CREDS`, "id": id };
    }
    
    const userID = fnGetUserID(config, params["auth"]["username"]);
    
    // validate method
    if (config["users"][userID]["enabled-api"].includes(method) !== true){
        return { "jsonrpc": "2.0", "result": null, "error": `REMOTE-API:API-NOT-SUPPORTED`, "id": id };
    }
    
    // validate params
    try {
        // validate params of "set-config"
        assert( (method === "set-config") ? fnHas(params, "config.json") : true );
        assert( (method === "set-config") ? fnIsString(params["config.json"]) : true );
        assert( (method === "set-config" && fnHas(params, "hash")) ? fnIsString(params["hash"]) : true );
        
        // validate params of "change-my-password"
        assert( (method === "change-my-password") ? fnHas(params, "new-password") : true );
        assert( (method === "change-my-password") ? (fnIsString(params["new-password"]) && params["new-password"].length > 0) : true );
        
        // validate params of "change-other-password"
        assert( (method === "change-other-password") ? fnHas(params, ["username", "new-password"]) : true );
        assert( (method === "change-other-password") ? (fnIsString(params["new-password"]) && params["new-password"].length > 0) : true );
        assert( (method === "change-other-password") ? (fnIsString(params["username"]) && params["username"].length > 0) : true );
        
        // validate params of "stop-easy-samba"
        assert( (method === "stop-easy-samba" && fnHas(params, "message")) ? fnIsString(params["message"]) : true );
    }
    catch (error){
        return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:INVALID-PARAMS", "id": id };
    }
    
    // execute api call
    try {
        return fnCallAPI(method, params, id, config);
    }
    catch (error){
        return { "jsonrpc": "2.0", "result": null, "error": `REMOTE-API:CANNOT-RESPOND`, "id": id };
    }
}



function fnCallAPI(method, params, id, config){
    // available API methods in this Remote API version
    const METHODS = config["$METHODS"];
    
    const userID = fnGetUserID(config, params["auth"]["username"]);
    
    switch (method){
    
        // set-config
        case "set-config":
            try {
                if (fnHas(params, "hash")){
                    const configjson = (fs.existsSync(`${CFG}/remote-api.config.json`)) ? fs.readFileSync(`${CFG}/remote-api.config.json`, "utf8") : "{}";
                    assert( fnIsString(configjson) );
                    const hash = crypto.createHash("md5").update(configjson, "utf8").digest("hex").toUpperCase();
                    assert( hash === params["hash"].toUpperCase() );
                }
            }
            catch (error){
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:SET-CONFIG:INVALID-HASH", "id": id };
            }
            if (fnWriteFile(`${CFG}/remote-api.config.json`, params["config.json"]) !== true){
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:SET-CONFIG:CANNOT-WRITE", "id": id };
            }
            return { "jsonrpc": "2.0", "result": "SUCCESS", "error": null, "id": id };
            break;
            
        // get-config
        case "get-config":
            try {
                const configjson = (fs.existsSync(`${CFG}/remote-api.config.json`)) ? fs.readFileSync(`${CFG}/remote-api.config.json`, "utf8") : "{}";
                assert( fnIsString(configjson) );
                return { "jsonrpc": "2.0", "result": configjson, "error": null, "id": id };
            }
            catch (error){
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:GET-CONFIG:CANNOT-READ", "id": id };
            }
            break;
            
        // get-info
        case "get-info":
            try {
                const running = fs.existsSync("/startup/easy-samba.running");
                const version = fnGetVersion().version;
                return { "jsonrpc": "2.0", "result": { "running": running, "version": version, "config-path": CFG }, "error": null, "id": id };
            }
            catch (error){
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:GET-INFO:ERROR", "id": id };
            }
            break;
            
        // hello
        case "hello":
            return { "jsonrpc": "2.0", "result": "world", "error": null, "id": id };
            break;
            
        // get-logs
        case "get-logs":
            try {
                const esLogs = (fs.existsSync("/share/logs/easy-samba.logs")) ? fs.readFileSync("/share/logs/easy-samba.logs", "utf8") : "";
                const raLogs = (fs.existsSync("/share/logs/remote-api.logs")) ? fs.readFileSync("/share/logs/remote-api.logs", "utf8") : "";
                assert( fnIsString(esLogs) && fnIsString(raLogs) );
                return { "jsonrpc": "2.0", "result": { "easy-samba-logs": esLogs, "remote-api-logs": raLogs }, "error": null, "id": id };
            }
            catch (error){
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:GET-LOGS:CANNOT-READ", "id": id };
            }
            break;
            
        // get-available-api
        case "get-available-api":
            return { "jsonrpc": "2.0", "result": { "available-api": METHODS }, "error": null, "id": id };
            break;
            
        // get-enabled-api
        case "get-enabled-api":
            return { "jsonrpc": "2.0", "result": { "enabled-api": config["users"][userID]["enabled-api"] }, "error": null, "id": id };
            break;
            
        // change-my-password
        case "change-my-password":
            const backup = config["users"][userID]["password"];
            try {
                config["users"][userID]["password"] = params["new-password"];
                assert( fs.existsSync(`${CFG}/remote-api.json`) );
                const fileConfig = JSON.parse( fs.readFileSync(`${CFG}/remote-api.json`, "utf8") );
                assert( fileConfig["users"][userID]["name"] === params["auth"]["username"] );
                fileConfig["users"][userID]["password"] = params["new-password"];
                assert( fnWriteFile(`${CFG}/remote-api.json`, JSON.stringify(fileConfig)) );
                return { "jsonrpc": "2.0", "result": "SUCCESS", "error": null, "id": id };
            }
            catch (error){
                try {
                    config["users"][userID]["password"] = backup;
                    assert( fs.existsSync(`${CFG}/remote-api.json`) );
                    const fileConfig = JSON.parse( fs.readFileSync(`${CFG}/remote-api.json`, "utf8") );
                    assert( fileConfig["users"][userID]["name"] === params["auth"]["username"] );
                    fileConfig["users"][userID]["password"] = backup;
                    assert( fnWriteFile(`${CFG}/remote-api.json`, JSON.stringify(fileConfig)) );
                }
                catch (error){
                    // do nothing
                }
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:CHANGE-MY-PASSWORD:ERROR", "id": id };
            }
            break;
            
        // change-other-password
        case "change-other-password":
            const otherID = fnGetUserID(config, params["username"]);
            if (otherID === undefined){
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:CHANGE-OTHER-PASSWORD:INVALID-USERNAME", "id": id };
            }
            
            const backup = config["users"][otherID]["password"];
            try {
                config["users"][otherID]["password"] = params["new-password"];
                assert( fs.existsSync(`${CFG}/remote-api.json`) );
                const fileConfig = JSON.parse( fs.readFileSync(`${CFG}/remote-api.json`, "utf8") );
                assert( fileConfig["users"][otherID]["name"] === params["username"] );
                fileConfig["users"][otherID]["password"] = params["new-password"];
                assert( fnWriteFile(`${CFG}/remote-api.json`, JSON.stringify(fileConfig)) );
                return { "jsonrpc": "2.0", "result": "SUCCESS", "error": null, "id": id };
            }
            catch (error){
                try {
                    config["users"][otherID]["password"] = backup;
                    assert( fs.existsSync(`${CFG}/remote-api.json`) );
                    const fileConfig = JSON.parse( fs.readFileSync(`${CFG}/remote-api.json`, "utf8") );
                    assert( fileConfig["users"][otherID]["name"] === params["username"] );
                    fileConfig["users"][otherID]["password"] = backup;
                    assert( fnWriteFile(`${CFG}/remote-api.json`, JSON.stringify(fileConfig)) );
                }
                catch (error){
                    // do nothing
                }
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:CHANGE-OTHER-PASSWORD:ERROR", "id": id };
            }
            break;
            
        // stop-easy-samba
        case "stop-easy-samba":
            try {
                const message = fnHas(params, "message") ? params["message"] : "";
                assert( fnWriteFile("/startup/easy-samba.stop", JSON.stringify(message)) );
                return { "jsonrpc": "2.0", "result": "SUCCESS", "error": null, "id": id };
            }
            catch (error){
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:STOP-EASY-SAMBA:ERROR", "id": id };
            }
            break;
            
        // pause-easy-samba
        case "pause-easy-samba":
            try {
                assert( fnWriteFile("/startup/easy-samba.pause") );
                return { "jsonrpc": "2.0", "result": "SUCCESS", "error": null, "id": id };
            }
            catch (error){
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:PAUSE-EASY-SAMBA:ERROR", "id": id };
            }
            break;
            
        // start-easy-samba
        case "start-easy-samba":
            try {
                assert( fnDeleteFile("/startup/easy-samba.pause") );
                return { "jsonrpc": "2.0", "result": "SUCCESS", "error": null, "id": id };
            }
            catch (error){
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:START-EASY-SAMBA:ERROR", "id": id };
            }
            break;
    }
    
    return { "jsonrpc": "2.0", "result": null, "error": `REMOTE-API:CANNOT-RESPOND`, "id": id };
}



function fnGetUserID(config, username){
    let result = undefined;
    
    try {
        for (i = 0; i < config["users"].length; i++){
            const e = config["users"][i];
            if (e["name"] === username){
                result = i;
            }
        }
    }
    catch (error){
        result = undefined;
    }
    
    return result;
}










