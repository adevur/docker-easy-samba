


// exports
module.exports = fnAPI;



// dependencies
const fs = require("fs");
const assert = require("assert");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnGetVersion = require("/startup/functions/fnGetVersion.js");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");
const CFG = require("/startup/functions/fnGetConfigDir.js")();



function fnAPI(str, token){
    try {
        const input = JSON.parse(str);
        assert( fnHas(input, ["jsonrpc", "method", "params", "id"]) );
        assert( input["jsonrpc"] === "2.0" );
        assert( input["method"] === "set-config" || input["method"] === "get-config" || input["method"] === "get-info" || input["method"] === "hello" );
        assert( fnIsString(input["id"]) );

        const id = input["id"];
        const params = input["params"];

        assert( fnHas(params, "token") && (input["method"] === "set-config") ? fnHas(params, "config.json") : true );
        assert( fnIsString(params["token"]) && (input["method"] === "set-config") ? fnIsString(params["config.json"]) : true );

        if (params["token"] !== token){
            return { "jsonrpc": "2.0", "result": null, "error": `AUTHORIZATION FAILED`, "id": id };
        }

        try {
            if (input["method"] === "set-config"){
                fnWriteFile(`${CFG}/remote-api.config.json`, params["config.json"]);
                return { "jsonrpc": "2.0", "result": "SUCCESS", "error": null, "id": id };
            }
            else if (input["method"] === "get-config"){
                const configjson = (fs.existsSync(`${CFG}/remote-api.config.json`)) ? fs.readFileSync(`${CFG}/remote-api.config.json`, "utf8") : "{}";
                return { "jsonrpc": "2.0", "result": configjson, "error": null, "id": id };
            }
            else if (input["method"] === "get-info"){
                const running = fs.existsSync("/startup/easy-samba.running");
                const version = fnGetVersion().version;
                return { "jsonrpc": "2.0", "result": { "running": running, "version": version }, "error": null, "id": id };
            }
            else if (input["method"] === "hello"){
                return { "jsonrpc": "2.0", "result": "world", "error": null, "id": id };
            }
            else {
                return { "jsonrpc": "2.0", "result": null, "error": `UNKNOWN ERROR`, "id": id };
            }
        }
        catch (error){
            return { "jsonrpc": "2.0", "result": null, "error": `UNKNOWN ERROR`, "id": id };
        }
    }
    catch (error){
        return { "jsonrpc": "2.0", "result": null, "error": "INVALID INPUT" };
    }
}



