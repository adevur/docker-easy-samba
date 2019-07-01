
// dependencies
const fs = require("fs");
const assert = require("assert");
const http = require("http");
const crypto = require("crypto");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");



fnMain().catch((error) => {
    process.exit();
});



async function fnMain(){
    // load "/share/remote-api.json"
    let config = false;
    try {
        assert( fs.existsSync("/share/remote-api.json") );
        config = JSON.parse(fs.readFileSync("/share/remote-api.json", "utf8"));
        assert( fnHas(config, "token") && fnIsString(config["token"]) && config["token"].length > 0 );
    }
    catch (error){
        config = false;
    }

    // if "/share/remote-api.json" could not be loaded, or it is not valid, abort
    assert(config !== false);

    const token = config["token"];

    // load private key and certificate for the HTTPS server
    // TODO
    let httpsKey = undefined;
    let httpsCert = undefined;

    // load the port to use
    let port = 9595;
    // TODO: load from config

    // start the HTTPS server
    http.createServer((req, res) => {
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
            res.end(`"ERROR"`, "utf8");
        }
    }).listen(port);
}



function fnAPI(str, token){
    try {
        const input = JSON.parse(str);
        assert( fnHas(input, ["jsonrpc", "method", "params", "id"]) );
        assert( input["jsonrpc"] === "2.0" );
        assert( input["method"] === "easy-samba-remote-call" );
        assert( fnIsString(input["id"]) );

        const id = input["id"];
        const params = input["params"];

        if (fnHas(params, ["config.json", "hash"]) !== true || fnIsString(params["config.json"]) !== true || fnIsString(params["hash"]) !== true){
            return { "jsonrpc": "2.0", "result": null, "error": `MISSING PARAMETERS 'config.json' AND 'hash'`, "id": id };
        }

        const hash = crypto.createHash("SHA512").update(JSON.stringify({ "config.json": params["config.json"], "id": id, "token": token }), "utf8").digest("hex").toUpperCase();
        if (params["hash"] !== hash){
            return { "jsonrpc": "2.0", "result": null, "error": `AUTHORIZATION FAILED`, "id": id };
        }

        try {
            fs.writeFileSync("/share/remote-api.config.json", params["config.json"]);
            return { "jsonrpc": "2.0", "result": "SUCCESS", "error": null, "id": id };
        }
        catch (error){
            return { "jsonrpc": "2.0", "result": null, "error": `COULD NOT WRITE '/share/remote-api.config.json' FILE`, "id": id };
        }
    }
    catch (error){
        console.log(error);
        return { "jsonrpc": "2.0", "result": null, "error": "INVALID INPUT" };
    }
}



