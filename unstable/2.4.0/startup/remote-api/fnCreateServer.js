


// exports
module.exports = fnCreateServer;



// dependencies
const https = require("https");
const crypto = require("crypto");
const log = require("/startup/functions/fnLog.js")("/share/logs/remote-api.logs");
const logx = require("/startup/functions/fnLogX.js")("/share/logs/remote-api-access.logs");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");
const fnAPIv2 = require("/startup/remote-api/fnAPIv2.js");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");



function fnCreateServer(httpsKey, httpsCert, config){
    return new Promise((resolve, reject) => {
        try {
            log(`[LOG] starting HTTPS server...`);
            const server = https.createServer({ key: httpsKey, cert: httpsCert }, (req, res) => {
                const parsedUrl = new URL(req.url, "https://localhost:9595");
                if (parsedUrl.pathname === "/api-v2" && req.method === "POST" && config["version"] === "2"){
                    const body = [];
                    req.on("data", (chunk) => { body.push(chunk); });
                    req.on("end", () => {
                        const result = fnAPIv2(Buffer.concat(body).toString(), config, req.socket.address().address);
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify(result), "utf8");
                    });
                }
                else if (parsedUrl.pathname === "/cert-nego-v4" && req.method === "GET"){
                    const query = fnParseQuery(parsedUrl);
                    const salt = (fnHas(query, "salt") && fnIsString(query["salt"]) && query["salt"].length === 10) ? query["salt"] : undefined;
                    const secureSalt = (fnHas(query, "secureSalt") && fnIsString(query["secureSalt"]) && query["secureSalt"].length === 64) ? query["secureSalt"] : undefined;
                    const username = (fnHas(query, "username") && fnIsString(query["username"]) && query["username"].length > 0) ? query["username"] : undefined;
                    const rawCert = (fnHas(query, "rawCert") && fnIsString(query["rawCert"])) ? query["rawCert"] : undefined;
                    
                    if (rawCert === "true"){
                        logx("cert-nego-success", { sourceAddress: req.socket.address().address, rawCert: true }, ["cert-nego", "success"]);
                        const result = { "jsonrpc": "2.0", "result": httpsCert, "error": null };
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify(result), "utf8");
                    }
                    else if (salt === undefined || secureSalt === undefined || username === undefined || config["cert-nego"] !== true){
                        logx("cert-nego-invalid-input", { sourceAddress: req.socket.address().address, creds: { username: username } }, ["cert-nego", "error"]);
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ "jsonrpc": "2.0", "result": null, "error": "REMOTE-API:CERT-NEGO:INVALID-INPUT" }), "utf8");
                    }
                    else {
                        const { hashedCert, invalidUser } = fnGetHashedCert(httpsCert, config, salt, username, secureSalt);
                        if (invalidUser){
                            logx("cert-nego-invalid-creds", { sourceAddress: req.socket.address().address, creds: { username: username } }, ["cert-nego", "error"]);
                        }
                        else {
                            logx("cert-nego-success", { sourceAddress: req.socket.address().address, creds: { username: username } }, ["cert-nego", "success"]);
                        }
                        const result = { "jsonrpc": "2.0", "result": hashedCert, "error": null };
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify(result), "utf8");
                    }
                }
                else {
                    logx("wrong-request", { sourceAddress: req.socket.address().address, httpMethod: req.method, httpPath: parsedUrl.pathname }, ["error"]);
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



function fnGetHashedCert(httpsCert, config, salt, username, secureSalt){
    let userID = undefined;
    
    try {
        for (i = 0; i < config["users"].length; i++){
            const e = config["users"][i];
            if (e["name"] === username){
                userID = i;
            }
        }
    }
    catch (error){
        userID = undefined;
    }
    
    const userPassword = (userID === undefined) ? crypto.randomBytes(6).toString("hex") : config["users"][userID]["password"];
    
    const httpsCertHashed = crypto.createHash("sha256").update(httpsCert, "utf8").digest("hex").toUpperCase();
    const usernameHashed = crypto.createHash("sha256").update(username, "utf8").digest("hex").toUpperCase();
    const userPasswordHashed = crypto.createHash("sha256").update(userPassword, "utf8").digest("hex").toUpperCase();
    const saltHashed = crypto.createHash("sha256").update(salt, "utf8").digest("hex").toUpperCase();

    const finalHash = crypto.createHash("sha512").update(`${httpsCertHashed}:${usernameHashed}:${userPasswordHashed}:${saltHashed}`, "utf8").digest("hex").toUpperCase();
    const otp = String(Date.now()).slice(0, 8);
    const mySecureSalt = crypto.createHash("sha256").update(`${usernameHashed}:${userPasswordHashed}:${otp}:${saltHashed}`, "utf8").digest("hex").toUpperCase();
    return { hashedCert: { "cert": httpsCert, "hash": finalHash }, invalidUser: (userID === undefined || secureSalt.toUpperCase() !== mySecureSalt) };
}



function fnParseQuery(parsedUrl){
    let params = {};
    Array.from(parsedUrl.searchParams.entries()).map((e) => { const r = {}; r[e[0]] = e[1]; return r; }).forEach((e) => { params = { ...params, ...e }; });
    return params;
}



