
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
const ConfigGen = require("/startup/ConfigGen.js"); // needed for ConfigGen.genRandomPassword()



fnMain().catch((error) => {
    process.exit();
});



async function fnMain(){
    // start the API server
    while (true){
        try {
            await fnStartServer();
        }
        catch (error){
            // in case of errors, re-try in 10 seconds
            await fnSleep(10000);
        }
    }
}



async function fnStartServer(){
    // load "/share/remote-api.json"
    let config = false;
    try {
        assert( fs.existsSync("/share/remote-api.json") );
        config = JSON.parse(fs.readFileSync("/share/remote-api.json", "utf8"));
        if (fnHas(config, "token") !== true){
            config["token"] = ConfigGen.genRandomPassword(12);
            fs.writeFileSync("/share/remote-api.json", JSON.stringify(config));
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
                fs.unlinkSync("/share/remote-api.key");
                assert( fs.existsSync("/share/remote-api.key") !== true );
            }
            if (fs.existsSync("/share/remote-api.cert")){
                fs.unlinkSync("/share/remote-api.cert");
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
    if (fnHas(config, "port") && fnIsInteger(config["port"])){
        port = config["port"];
    }

    // start the HTTPS server
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
                assert(false);
            }
            else {
                try { fs.writeFileSync("/startup/remote-api.started", ""); } catch(error) { }
            }
        });
    }
    catch (error){
        assert(false);
    }
}



function fnAPI(str, token){
    try {
        const input = JSON.parse(str);
        assert( fnHas(input, ["jsonrpc", "method", "params", "id"]) );
        assert( input["jsonrpc"] === "2.0" );
        assert( input["method"] === "set-config" || input["method"] === "get-config" );
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
                fs.writeFileSync("/share/remote-api.config.json", params["config.json"]);
                return { "jsonrpc": "2.0", "result": "SUCCESS", "error": null, "id": id };
            }
            else {
                const configjson = (fs.existsSync("/share/remote-api.config.json")) ? fs.readFileSync("/share/remote-api.config.json", "utf8") : "";
                return { "jsonrpc": "2.0", "result": configjson, "error": null, "id": id };
            }
        }
        catch (error){
            return { "jsonrpc": "2.0", "result": null, "error": `COULD NOT READ/WRITE '/share/remote-api.config.json' FILE`, "id": id };
        }
    }
    catch (error){
        return { "jsonrpc": "2.0", "result": null, "error": "INVALID INPUT" };
    }
}



