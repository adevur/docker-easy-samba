


// exports
module.exports = fnAPIv2;



// dependencies
const fs = require("fs");
const assert = require("assert");
const crypto = require("crypto");
const logx = require("/startup/functions/fnLogX.js")("/share/logs/remote-api-access.logs");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnGetVersion = require("/startup/functions/fnGetVersion.js");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const fnAuth = require("/startup/remote-api/fnAuth.js");
const CFG = require("/startup/functions/fnGetConfigDir.js")();



function fnAPIv2(str, config, sourceAddress){
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
        
        assert( fnHas(input.params, "auth") );
        assert( fnHas(input.params.auth, ["username", "password"]) );
        assert( [input.params.auth.username, input.params.auth.password].every(fnIsString) );
    }
    catch (error){
        logx("api-invalid-input", { sourceAddress: sourceAddress }, ["api", "error"]);
        return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:INVALID-INPUT" };
    }
    
    const id = input["id"];
    const params = input["params"];
    const method = input["method"];
    const creds = {
        username: undefined,
        userType: undefined,
        ldapUser: undefined,
        ldapGroup: undefined
    };
    let credsEnabledAPI = undefined;
    
    // validate creds
    try {
        const auth = fnAuth(config, params.auth.username, params.auth.password);
        assert( auth.res );
        creds.username = params.auth.username;
        credsEnabledAPI = auth.enabledAPI;
        creds.userType = auth.userType;
        creds.ldapUser = auth.ldapUser;
        creds.ldapGroup = auth.ldapGroup;
    }
    catch (error){
        if (params.auth.username !== "" || params.auth.password !== ""){
            logx("api-auth-failed", { sourceAddress: sourceAddress, creds: { username: params.auth.username } }, ["api", "auth", "error"]);
        }
        return { "jsonrpc": "2.0", "result": null, "error": `REMOTE-API:INVALID-CREDS`, "id": id };
    }
    
    // validate method
    if (credsEnabledAPI.includes(method) !== true){
        logx("api-not-allowed", { sourceAddress: sourceAddress, creds: creds, method: method }, ["api", "error"]);
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
        logx("api-invalid-params", { sourceAddress: sourceAddress, creds: creds, method: method }, ["api", "error"]);
        return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:INVALID-PARAMS", "id": id };
    }
    
    // execute api call
    try {
        return fnCallAPI(method, params, id, config, sourceAddress, creds, credsEnabledAPI);
    }
    catch (error){
        logx("api-cannot-respond", { sourceAddress: sourceAddress, creds: creds, method: method }, ["api", "error"]);
        return { "jsonrpc": "2.0", "result": null, "error": `REMOTE-API:CANNOT-RESPOND`, "id": id };
    }
}



function fnCallAPI(method, params, id, config, sourceAddress, creds, credsEnabledAPI){
    // available API methods in this Remote API version
    const METHODS = config["$METHODS"];
    
    const userID = (creds.userType === "local") ? fnGetUserID(config, creds.username) : undefined;
    
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
                logx("api-set-config-error", { sourceAddress: sourceAddress, creds: creds, errorType: "invalid-hash" }, ["api", "error", "api-set-config"]);
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:SET-CONFIG:INVALID-HASH", "id": id };
            }
            if (fnWriteFile(`${CFG}/remote-api.config.json`, params["config.json"]) !== true){
                logx("api-set-config-error", { sourceAddress: sourceAddress, creds: creds, errorType: "cannot-write" }, ["api", "error", "api-set-config"]);
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:SET-CONFIG:CANNOT-WRITE", "id": id };
            }
            logx("api-set-config-success", { sourceAddress: sourceAddress, creds: creds }, ["api", "success", "api-set-config"]);
            return { "jsonrpc": "2.0", "result": "SUCCESS", "error": null, "id": id };
            break;
            
        // get-config
        case "get-config":
            try {
                const configjson = (fs.existsSync(`${CFG}/remote-api.config.json`)) ? fs.readFileSync(`${CFG}/remote-api.config.json`, "utf8") : "{}";
                assert( fnIsString(configjson) );
                logx("api-get-config-success", { sourceAddress: sourceAddress, creds: creds }, ["api", "success", "api-get-config"]);
                return { "jsonrpc": "2.0", "result": configjson, "error": null, "id": id };
            }
            catch (error){
                logx("api-get-config-error", { sourceAddress: sourceAddress, creds: creds, errorType: "cannot-read" }, ["api", "error", "api-get-config"]);
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:GET-CONFIG:CANNOT-READ", "id": id };
            }
            break;
            
        // get-info
        case "get-info":
            try {
                const running = fs.existsSync("/startup/easy-samba.running");
                const version = fnGetVersion().version;
                logx("api-get-info-success", { sourceAddress: sourceAddress, creds: creds }, ["api", "success", "api-get-info"]);
                return { "jsonrpc": "2.0", "result": { "running": running, "version": version, "config-path": CFG }, "error": null, "id": id };
            }
            catch (error){
                logx("api-get-info-error", { sourceAddress: sourceAddress, creds: creds }, ["api", "error", "api-get-info"]);
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:GET-INFO:ERROR", "id": id };
            }
            break;
            
        // hello
        case "hello":
            logx("api-hello-success", { sourceAddress: sourceAddress, creds: creds }, ["api", "success", "api-hello"]);
            return { "jsonrpc": "2.0", "result": "world", "error": null, "id": id };
            break;
            
        // get-logs
        case "get-logs":
            try {
                const esLogs = (fs.existsSync("/share/logs/easy-samba.logs")) ? fs.readFileSync("/share/logs/easy-samba.logs", "utf8") : "";
                const raLogs = (fs.existsSync("/share/logs/remote-api.logs")) ? fs.readFileSync("/share/logs/remote-api.logs", "utf8") : "";
                assert( fnIsString(esLogs) && fnIsString(raLogs) );
                logx("api-get-logs-success", { sourceAddress: sourceAddress, creds: creds }, ["api", "success", "api-get-logs"]);
                return { "jsonrpc": "2.0", "result": { "easy-samba-logs": esLogs, "remote-api-logs": raLogs }, "error": null, "id": id };
            }
            catch (error){
                logx("api-get-logs-error", { sourceAddress: sourceAddress, creds: creds, errorType: "cannot-read" }, ["api", "error", "api-get-logs"]);
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:GET-LOGS:CANNOT-READ", "id": id };
            }
            break;
            
        // get-available-api
        case "get-available-api":
            logx("api-get-available-api-success", { sourceAddress: sourceAddress, creds: creds }, ["api", "success", "api-get-available-api"]);
            return { "jsonrpc": "2.0", "result": { "available-api": METHODS }, "error": null, "id": id };
            break;
            
        // get-enabled-api
        case "get-enabled-api":
            logx("api-get-enabled-api-success", { sourceAddress: sourceAddress, creds: creds }, ["api", "success", "api-get-enabled-api"]);
            return { "jsonrpc": "2.0", "result": { "enabled-api": credsEnabledAPI }, "error": null, "id": id };
            break;
            
        // change-my-password
        case "change-my-password":
            if (creds.userType !== "local"){
                logx("api-change-my-password-error", { sourceAddress: sourceAddress, creds: creds, errorType: "not-local-user" }, ["api", "error", "api-change-my-password"]);
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:CHANGE-MY-PASSWORD:NOT-LOCAL-USER", "id": id };
            }
            
            const backup = config["users"][userID]["password"];
            try {
                config["users"][userID]["password"] = params["new-password"];
                assert( fs.existsSync(`${CFG}/remote-api.json`) );
                const fileConfig = JSON.parse( fs.readFileSync(`${CFG}/remote-api.json`, "utf8") );
                assert( fileConfig["users"][userID]["name"] === params["auth"]["username"] );
                fileConfig["users"][userID]["password"] = params["new-password"];
                assert( fnWriteFile(`${CFG}/remote-api.json`, JSON.stringify(fileConfig)) );
                logx("api-change-my-password-success", { sourceAddress: sourceAddress, creds: creds }, ["api", "success", "api-change-my-password"]);
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
                logx("api-change-my-password-error", { sourceAddress: sourceAddress, creds: creds, errorType: "cannot-change-password" }, ["api", "error", "api-change-my-password"]);
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:CHANGE-MY-PASSWORD:ERROR", "id": id };
            }
            break;
            
        // change-other-password
        case "change-other-password":
            const otherID = fnGetUserID(config, params["username"]);
            
            if (otherID === undefined){
                logx("api-change-other-password-error", { sourceAddress: sourceAddress, creds: creds, otherUser: params.username, errorType: "invalid-username" }, ["api", "error", "api-change-other-password"]);
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:CHANGE-OTHER-PASSWORD:INVALID-USERNAME", "id": id };
            }
            
            if (config["users"][otherID]["$type"] !== "local"){
                logx("api-change-other-password-error", { sourceAddress: sourceAddress, creds: creds, otherUser: params.username, errorType: "not-local-user" }, ["api", "error", "api-change-other-password"]);
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:CHANGE-OTHER-PASSWORD:NOT-LOCAL-USER", "id": id };
            }
            
            const backup2 = config["users"][otherID]["password"];
            try {
                config["users"][otherID]["password"] = params["new-password"];
                assert( fs.existsSync(`${CFG}/remote-api.json`) );
                const fileConfig = JSON.parse( fs.readFileSync(`${CFG}/remote-api.json`, "utf8") );
                assert( fileConfig["users"][otherID]["name"] === params["username"] );
                fileConfig["users"][otherID]["password"] = params["new-password"];
                assert( fnWriteFile(`${CFG}/remote-api.json`, JSON.stringify(fileConfig)) );
                logx("api-change-other-password-success", { sourceAddress: sourceAddress, creds: creds, otherUser: params.username }, ["api", "success", "api-change-other-password"]);
                return { "jsonrpc": "2.0", "result": "SUCCESS", "error": null, "id": id };
            }
            catch (error){
                try {
                    config["users"][otherID]["password"] = backup2;
                    assert( fs.existsSync(`${CFG}/remote-api.json`) );
                    const fileConfig = JSON.parse( fs.readFileSync(`${CFG}/remote-api.json`, "utf8") );
                    assert( fileConfig["users"][otherID]["name"] === params["username"] );
                    fileConfig["users"][otherID]["password"] = backup2;
                    assert( fnWriteFile(`${CFG}/remote-api.json`, JSON.stringify(fileConfig)) );
                }
                catch (error){
                    // do nothing
                }
                logx("api-change-other-password-error", { sourceAddress: sourceAddress, creds: creds, otherUser: params.username, errorType: "cannot-change-password" }, ["api", "error", "api-change-other-password"]);
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:CHANGE-OTHER-PASSWORD:ERROR", "id": id };
            }
            break;
            
        // stop-easy-samba
        case "stop-easy-samba":
            try {
                const message = fnHas(params, "message") ? params["message"] : "";
                assert( fnWriteFile("/startup/easy-samba.stop", JSON.stringify(message)) );
                logx("api-stop-easy-samba-success", { sourceAddress: sourceAddress, creds: creds, message: message }, ["api", "success", "api-stop-easy-samba"]);
                return { "jsonrpc": "2.0", "result": "SUCCESS", "error": null, "id": id };
            }
            catch (error){
                logx("api-stop-easy-samba-error", { sourceAddress: sourceAddress, creds: creds, message: message }, ["api", "error", "api-stop-easy-samba"]);
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:STOP-EASY-SAMBA:ERROR", "id": id };
            }
            break;
            
        // pause-easy-samba
        case "pause-easy-samba":
            try {
                assert( fnWriteFile("/startup/easy-samba.pause") );
                logx("api-pause-easy-samba-success", { sourceAddress: sourceAddress, creds: creds }, ["api", "success", "api-pause-easy-samba"]);
                return { "jsonrpc": "2.0", "result": "SUCCESS", "error": null, "id": id };
            }
            catch (error){
                logx("api-pause-easy-samba-error", { sourceAddress: sourceAddress, creds: creds }, ["api", "error", "api-pause-easy-samba"]);
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:PAUSE-EASY-SAMBA:ERROR", "id": id };
            }
            break;
            
        // start-easy-samba
        case "start-easy-samba":
            try {
                assert( fnDeleteFile("/startup/easy-samba.pause") );
                logx("api-start-easy-samba-success", { sourceAddress: sourceAddress, creds: creds }, ["api", "success", "api-start-easy-samba"]);
                return { "jsonrpc": "2.0", "result": "SUCCESS", "error": null, "id": id };
            }
            catch (error){
                logx("api-start-easy-samba-error", { sourceAddress: sourceAddress, creds: creds }, ["api", "error", "api-start-easy-samba"]);
                return { "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:START-EASY-SAMBA:ERROR", "id": id };
            }
            break;
    }
    
    logx("api-cannot-respond", { sourceAddress: sourceAddress, creds: creds, method: method }, ["api", "error"]);
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










