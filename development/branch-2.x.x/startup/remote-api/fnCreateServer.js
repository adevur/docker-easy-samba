


// exports
module.exports = fnCreateServer;



// dependencies
const https = require("https");
const crypto = require("crypto");
const url = require("url");
const log = require("/startup/functions/fnLog.js")("/share/config/remote-api.logs");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");
const fnAPI = require("/startup/remote-api/fnAPI.js");
const fnAPIv2 = require("/startup/remote-api/fnAPIv2.js");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");



function fnCreateServer(httpsKey, httpsCert, config){
    return new Promise((resolve, reject) => {
        try {
            log(`[LOG] starting HTTPS server...`);
            const server = https.createServer({ key: httpsKey, cert: httpsCert }, (req, res) => {
                const parsedUrl = url.parse(req.url, true);
                if (parsedUrl.pathname === "/api" && req.method === "POST" && config["version"] === "1"){
                    const body = [];
                    req.on("data", (chunk) => { body.push(chunk); });
                    req.on("end", () => {
                        const result = fnAPI(Buffer.concat(body).toString(), config);
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify(result), "utf8");
                    });
                }
                else if (parsedUrl.pathname === "/api-v2" && req.method === "POST" && config["version"] === "2"){
                    const body = [];
                    req.on("data", (chunk) => { body.push(chunk); });
                    req.on("end", () => {
                        const result = fnAPIv2(Buffer.concat(body).toString(), config);
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify(result), "utf8");
                    });
                }
                else if (parsedUrl.pathname === "/cert-nego-v3" && req.method === "GET" && config["cert-nego"] === true){
                    const query = parsedUrl.query;
                    const salt = (fnHas(query, "salt") && fnIsString(query["salt"]) && query["salt"].length === 10) ? query["salt"] : undefined;
                    if (salt === undefined){
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:CERT-NEGO:INVALID-INPUT" }), "utf8");
                    }
                    else {
                        const result = { "jsonrpc": "2.0", "result": fnGetHashedCert(httpsCert, config["token"], salt), "error": null };
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify(result), "utf8");
                    }
                }
                else {
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:WRONG-REQUEST" }), "utf8");
                }
            }).listen(config["port"], () => {
                if (server.address().port !== config["port"]){
                    reject(new Error("ERROR"));
                }
                else {
                    log(`[LOG] HTTPS server successfully started and listening on port ${server.address().port}.`);
                }
            });
        }
        catch (error){
            reject(error);
        }
    });
}



function fnGetHashedCert(httpsCert, token, salt){
    const certHash = crypto.createHash("sha512").update(`${httpsCert}:${token}:${salt}`, "utf8").digest("hex").toUpperCase();
    return { "cert": httpsCert, "hash": certHash };
}



