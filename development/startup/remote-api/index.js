
// dependencies
const fs = require("fs");
const assert = require("assert");
const https = require("https");
const crypto = require("crypto");
const { spawnSync } = require("child_process");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnIsInteger = require("/startup/functions/fnIsInteger.js");
const fnSleep = require("/startup/functions/fnSleep.js");
const fnGetVersion = require("/startup/functions/fnGetVersion.js");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const ConfigGen = require("/startup/ConfigGen.js"); // needed for ConfigGen.genRandomPassword()



fnMain().then(() => {
    process.exit(1);
}).catch((error) => {
    process.exit(1);
});



async function fnMain(){
    // start the API server
    while (true){
        try {
            await fnStartServer();
        }
        catch (error){
            // do nothing
        }
        // in case of errors, re-try in 10 seconds
        await fnSleep(10000);
    }
}



async function fnStartServer(){
    // load "/share/remote-api.json"
    let config = false;
    try {
        assert( fs.existsSync("/share/remote-api.json") );
        try {
            config = JSON.parse(fs.readFileSync("/share/remote-api.json", "utf8"));
        }
        catch (error){
            config = {};
        }
        if (fnHas(config, "token") !== true){
            config["token"] = ConfigGen.genRandomPassword(12);
            fnWriteFile("/share/remote-api.json", JSON.stringify(config));
        }
        assert( fnHas(config, "token") && fnIsString(config["token"]) && config["token"].length > 0 );
    }
    catch (error){
        config = false;
    }

    // if "/share/remote-api.json" could not be loaded, or it is not valid, abort
    assert(config !== false);

    const token = config["token"];

    // load private key and certificate for the HTTPS server
    //   if they don't exist, generate new ones
    let httpsKey = undefined;
    let httpsCert = undefined;
    try {
        assert( fs.existsSync("/share/remote-api.key") );
        assert( fs.existsSync("/share/remote-api.cert") );
        httpsKey = fs.readFileSync("/share/remote-api.key", "ascii");
        httpsCert = fs.readFileSync("/share/remote-api.cert", "ascii");
    }
    catch (error){
        try {
            if (fs.existsSync("/share/remote-api.key")){
                fnDeleteFile("/share/remote-api.key");
                assert( fs.existsSync("/share/remote-api.key") !== true );
            }
            if (fs.existsSync("/share/remote-api.cert")){
                fnDeleteFile("/share/remote-api.cert");
                assert( fs.existsSync("/share/remote-api.cert") !== true );
            }

            spawnSync("openssl", ["req", "-nodes", "-days", "7300", "-new", "-x509", "-keyout", "/share/remote-api.key", "-out", "/share/remote-api.cert", "-subj", "/C=US/ST=Some-State/O=localhost/CN=localhost"], { stdio: "ignore" });

            assert( fs.existsSync("/share/remote-api.key") );
            assert( fs.existsSync("/share/remote-api.cert") );
            httpsKey = fs.readFileSync("/share/remote-api.key", "ascii");
            httpsCert = fs.readFileSync("/share/remote-api.cert", "ascii");
        }
        catch (error){
            assert(false);
        }
    }

    // load the port to use
    let port = 9595;
    if (fnHas(config, "port") && fnIsInteger(config["port"]) && config["port"] >= 1024 && config["port"] <= 49151){
        port = config["port"];
    }

    // start the HTTPS server
    try {
        await fnCreateServer(httpsKey, httpsCert, port, token);
    }
    catch (error){
        throw error;
    }
}



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
                fnWriteFile("/share/remote-api.config.json", params["config.json"]);
                return { "jsonrpc": "2.0", "result": "SUCCESS", "error": null, "id": id };
            }
            else if (input["method"] === "get-config"){
                const configjson = (fs.existsSync("/share/remote-api.config.json")) ? fs.readFileSync("/share/remote-api.config.json", "utf8") : "{}";
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



function fnCreateServer(httpsKey, httpsCert, port, token){
    return new Promise((resolve, reject) => {
        try {
            const server = https.createServer({ key: httpsKey, cert: httpsCert }, (req, res) => {
                if (req.url === "/api" && req.method === "POST"){
                    const body = [];
                    req.on("data", (chunk) => { body.push(chunk); });
                    req.on("end", () => {
                        const result = fnAPI(Buffer.concat(body).toString(), token);
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify(result), "utf8");
                    });
                }
                else {
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ "jsonrpc": "2.0", "result": null, "error": "WRONG PAGE REQUEST" }), "utf8");
                }
            }).listen(port, () => {
                if (server.address().port !== port){
                    reject(new Error("ERROR"));
                }
                else {
                    fnWriteFile("/startup/remote-api.started");
                }
            });
        }
        catch (error){
            reject(error);
        }
    });
}



