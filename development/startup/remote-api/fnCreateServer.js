


// exports
module.exports = fnCreateServer;



// dependencies
const https = require("https");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");
const fnAPI = require("/startup/remote-api/fnAPI.js");



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



