


// exports
module.exports = fnStartServer;



// dependencies
const fs = require("fs");
const assert = require("assert");
const { spawnSync } = require("child_process");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnIsInteger = require("/startup/functions/fnIsInteger.js");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const CFG = require("/startup/functions/fnGetConfigDir.js")();
const ConfigGen = require("/startup/ConfigGen.js"); // needed for ConfigGen.genRandomPassword()
const fnCreateServer = require("/startup/remote-api/fnCreateServer.js");



async function fnStartServer(){
    // load "remote-api.json"
    let config = false;
    try {
        assert( fs.existsSync(`${CFG}/remote-api.json`) );
        try {
            config = JSON.parse(fs.readFileSync(`${CFG}/remote-api.json`, "utf8"));
        }
        catch (error){
            config = {};
        }
        if (fnHas(config, "token") !== true){
            config["token"] = ConfigGen.genRandomPassword(12);
            fnWriteFile(`${CFG}/remote-api.json`, JSON.stringify(config));
        }
        assert( fnHas(config, "token") && fnIsString(config["token"]) && config["token"].length > 0 );
    }
    catch (error){
        config = false;
    }

    // if "remote-api.json" could not be loaded, or it is not valid, abort
    assert(config !== false);

    const token = config["token"];

    // load private key and certificate for the HTTPS server
    //   if they don't exist, generate new ones
    let httpsKey = undefined;
    let httpsCert = undefined;
    try {
        assert( fs.existsSync(`${CFG}/remote-api.key`) );
        assert( fs.existsSync(`${CFG}/remote-api.cert`) );
        httpsKey = fs.readFileSync(`${CFG}/remote-api.key`, "ascii");
        httpsCert = fs.readFileSync(`${CFG}/remote-api.cert`, "ascii");
    }
    catch (error){
        try {
            assert( fnDeleteFile(`${CFG}/remote-api.key`) );
            assert( fnDeleteFile(`${CFG}/remote-api.cert`) );

            spawnSync("openssl", ["req", "-nodes", "-days", "7300", "-new", "-x509", "-keyout", `${CFG}/remote-api.key`, "-out", `${CFG}/remote-api.cert`, "-subj", "/C=US/ST=Some-State/O=localhost/CN=localhost"], { stdio: "ignore" });

            assert( fs.existsSync(`${CFG}/remote-api.key`) );
            assert( fs.existsSync(`${CFG}/remote-api.cert`) );
            httpsKey = fs.readFileSync(`${CFG}/remote-api.key`, "ascii");
            httpsCert = fs.readFileSync(`${CFG}/remote-api.cert`, "ascii");
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



