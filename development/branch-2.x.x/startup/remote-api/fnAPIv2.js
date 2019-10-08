


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
    
    // validate token
    if (fnHas(params, "token") !== true || fnIsString(params["token"]) !== true || fnSecureStringCompare(params["token"], config["token"]) !== true){
        return { "jsonrpc": "2.0", "result": null, "error": `REMOTE-API:INVALID-TOKEN`, "id": id };
    }
    
    // validate method
    if (config["enabled-api"].includes(method) !== true){
        return { "jsonrpc": "2.0", "result": null, "error": `REMOTE-API:API-NOT-SUPPORTED`, "id": id };
    }
    
    // validate params
    try {
        // validate params of "set-config"
        assert( (method === "set-config") ? fnHas(params, "config.json") : true );
        assert( (method === "set-config") ? fnIsString(params["config.json"]) : true );
        assert( (method === "set-config" && fnHas(params, "hash")) ? fnIsString(params["hash"]) : true );
        
        // validate params of "change-token"
        assert( (method === "change-token") ? fnHas(params, "new-token") : true );
        assert( (method === "change-token") ? (fnIsString(params["new-token"]) && params["new-token"].length > 0) : true );
        
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
                const esLogs = (CFG === "/share/config" && fs.existsSync("/share/config/easy-samba.logs")) ? fs.readFileSync("/share/config/easy-samba.logs", "utf8") : "";
                const raLogs = (CFG === "/share/config" && fs.existsSync("/share/config/remote-api.logs")) ? fs.readFileSync("/share/config/remote-api.logs", "utf8") : "";
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
            
        // change-token
        case "change-token":
            const backup = config["token"];
            try {
                config["token"] = params["new-token"];
                assert( fs.existsSync(`${CFG}/remote-api.json`) );
                const fileConfig = JSON.parse( fs.readFileSync(`${CFG}/remote-api.json`, "utf8") );
                fileConfig["token"] = params["new-token"];
                assert( fnWriteFile(`${CFG}/remote-api.json`, JSON.stringify(fileConfig)) );
                return { "jsonrpc": "2.0", "result": "SUCCESS", "error": null, "id": id };
            }
            catch (error){
                try {
                    config["token"] = backup;
                    assert( fs.existsSync(`${CFG}/remote-api.json`) );
                    const fileConfig = JSON.parse( fs.readFileSync(`${CFG}/remote-api.json`, "utf8") );
                    fileConfig["token"] = backup;
                    assert( fnWriteFile(`${CFG}/remote-api.json`, JSON.stringify(fileConfig)) );
                }
                catch (error){
                    // do nothing
                }
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:CHANGE-TOKEN:ERROR", "id": id };
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



