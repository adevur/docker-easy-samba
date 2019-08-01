


// exports
module.exports = fnAPI;



// dependencies
const fs = require("fs");
const assert = require("assert");
const crypto = require("crypto");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnGetVersion = require("/startup/functions/fnGetVersion.js");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");
const fnSecureStringCompare = require("/startup/functions/fnSecureStringCompare.js");
const CFG = require("/startup/functions/fnGetConfigDir.js")();



function fnAPI(str, tk){
    try {
        const token = tk["token"];
        assert( fnIsString(token) && token.length > 0 );
    
        const input = JSON.parse(str);
        assert( fnHas(input, ["jsonrpc", "method", "params", "id"]) );
        assert( input["jsonrpc"] === "2.0" );
        assert( fnIsString(input["id"]) );
        assert( fnIsString(input["method"]) );

        const id = input["id"];
        const params = input["params"];
        
        if (fnHas(params, "token") !== true || fnIsString(params["token"]) !== true || fnSecureStringCompare(params["token"], token) !== true){
            return { "jsonrpc": "2.0", "result": null, "error": `REMOTE-API:INVALID-TOKEN`, "id": id };
        }
        
        if (["set-config", "get-config", "get-info", "hello", "get-logs", "get-available-api", "change-token"].includes(input["method"]) !== true){
            return { "jsonrpc": "2.0", "result": null, "error": `REMOTE-API:API-NOT-SUPPORTED`, "id": id };
        }

        assert( (input["method"] === "set-config") ? fnHas(params, "config.json") : true );
        assert( (input["method"] === "set-config") ? fnIsString(params["config.json"]) : true );
        assert( (input["method"] === "set-config" && fnHas(params, "hash")) ? fnIsString(params["hash"]) : true );
        assert( (input["method"] === "change-token") ? fnHas(params, "new-token") : true );
        assert( (input["method"] === "change-token") ? (fnIsString(params["new-token"]) && params["new-token"].length > 0) : true );
        
        try {
            if (input["method"] === "set-config"){
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
            }
            else if (input["method"] === "get-config"){
                try {
                    const configjson = (fs.existsSync(`${CFG}/remote-api.config.json`)) ? fs.readFileSync(`${CFG}/remote-api.config.json`, "utf8") : "{}";
                    assert( fnIsString(configjson) );
                    return { "jsonrpc": "2.0", "result": configjson, "error": null, "id": id };
                }
                catch (error){
                    return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:GET-CONFIG:CANNOT-READ", "id": id };
                }
            }
            else if (input["method"] === "get-info"){
                try {
                    const running = fs.existsSync("/startup/easy-samba.running");
                    const version = fnGetVersion().version;
                    return { "jsonrpc": "2.0", "result": { "running": running, "version": version, "config-path": CFG }, "error": null, "id": id };
                }
                catch (error){
                    return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:GET-INFO:ERROR", "id": id };
                }
            }
            else if (input["method"] === "hello"){
                return { "jsonrpc": "2.0", "result": "world", "error": null, "id": id };
            }
            else if (input["method"] === "get-logs"){
                try {
                    const esLogs = (CFG === "/share/config" && fs.existsSync("/share/config/easy-samba.logs")) ? fs.readFileSync("/share/config/easy-samba.logs", "utf8") : "";
                    const raLogs = (CFG === "/share/config" && fs.existsSync("/share/config/remote-api.logs")) ? fs.readFileSync("/share/config/remote-api.logs", "utf8") : "";
                    assert( fnIsString(esLogs) && fnIsString(raLogs) );
                    return { "jsonrpc": "2.0", "result": { "easy-samba-logs": esLogs, "remote-api-logs": raLogs }, "error": null, "id": id };
                }
                catch (error){
                    return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:GET-LOGS:CANNOT-READ", "id": id };
                }
            }
            else if (input["method"] === "get-available-api"){
                return { "jsonrpc": "2.0", "result": { "available-api": ["set-config", "get-config", "get-info", "hello", "get-logs", "get-available-api", "change-token"] }, "error": null, "id": id };
            }
            else if (input["method"] === "change-token"){
                const backup = token;
                try {
                    tk["token"] = params["new-token"];
                    assert( fs.existsSync(`${CFG}/remote-api.json`) );
                    const config = JSON.parse( fs.readFileSync(`${CFG}/remote-api.json`, "utf8") );
                    config["token"] = params["new-token"];
                    assert( fnWriteFile(`${CFG}/remote-api.json`, JSON.stringify(config)) );
                    return { "jsonrpc": "2.0", "result": "SUCCESS", "error": null, "id": id };
                }
                catch (error){
                    try {
                        tk["token"] = backup;
                        assert( fs.existsSync(`${CFG}/remote-api.json`) );
                        const config = JSON.parse( fs.readFileSync(`${CFG}/remote-api.json`, "utf8") );
                        config["token"] = backup;
                        assert( fnWriteFile(`${CFG}/remote-api.json`, JSON.stringify(config)) );
                    }
                    catch (error){
                        // do nothing
                    }
                    return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:CHANGE-TOKEN:ERROR", "id": id };
                }
            }
            else {
                return { "jsonrpc": "2.0", "result": null, "error": `REMOTE-API:CANNOT-RESPOND`, "id": id };
            }
        }
        catch (error){
            return { "jsonrpc": "2.0", "result": null, "error": `REMOTE-API:CANNOT-RESPOND`, "id": id };
        }
    }
    catch (error){
        return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:INVALID-INPUT" };
    }
}



