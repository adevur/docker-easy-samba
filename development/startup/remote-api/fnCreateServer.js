


// exports
module.exports = fnCreateServer;



// dependencies
const https = require("https");
const log = require("/startup/functions/fnLog.js")("/share/config/remote-api.logs");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");
const fnAPI = require("/startup/remote-api/fnAPI.js");



function fnCreateServer(httpsKey, httpsCert, port, token){
    return new Promise((resolve, reject) => {
        try {
            log(`[LOG] starting HTTPS server...`);
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
                    res.end(JSON.stringify({ "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:WRONG-REQUEST" }), "utf8");
                }
            }).listen(port, () => {
                if (server.address().port !== port){
                    reject(new Error("ERROR"));
                }
                else {
                    fnWriteFile("/startup/remote-api.started");
                    log(`[LOG] HTTPS server successfully started and listening on port ${server.address().port}.`);
                }
            });
        }
        catch (error){
            reject(error);
        }
    });
}



