


// exports
module.exports = fnPrepareServer;



// dependencies
const fs = require("fs");
const assert = require("assert");
const { spawnSync } = require("child_process");
const log = require("/startup/functions/fnLog.js")("/share/config/remote-api.logs");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnIsInteger = require("/startup/functions/fnIsInteger.js");
const fnIsArray = require("/startup/functions/fnIsArray.js");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const CFG = require("/startup/functions/fnGetConfigDir.js")();
const ConfigGen = require("/startup/ConfigGen.js"); // needed for ConfigGen.genRandomPassword()
const fnCreateServer = require("/startup/remote-api/fnCreateServer.js");



async function fnPrepareServer(){
    log(`[LOG] EasySamba Remote API startup procedure has started.`);
    
    // load "remote-api.json"
    const config = fnLoadConfig();
    
    // check property "version"
    fnCheckVersion(config);
    
    // check property "token"
    fnCheckToken(config);
    
    // check property "users"
    fnCheckUsers(config);
    
    // load private key and certificate for the HTTPS server
    const { httpsKey, httpsCert } = fnLoadKeyCert();
    
    // check property "port"
    fnCheckPort(config);
    
    // check property "cert-nego"
    fnCheckCertNego(config);
    
    // check property "enabled-api"
    fnCheckEnabledAPI(config);
    
    // start the HTTPS server
    try {
        await fnCreateServer(httpsKey, httpsCert, config);
    }
    catch (error){
        log(`[ERROR] it's not been possible to start HTTPS server.`);
        assert(false);
    }
}



function fnUpdateConfigFile(path, config, properties){
    let temp = undefined;
    
    try {
        temp = JSON.parse( fs.readFileSync(path, "utf8") );
    }
    catch (error){
        temp = {};
    }
    
    properties.forEach((e) => {
        temp[e] = config[e];
    });
    
    fnWriteFile(path, JSON.stringify(temp));
}



function fnLoadConfig(){
    try {
        log(`[LOG] loading '${CFG}/remote-api.json'...`);
        let config = undefined;
        
        assert( fs.existsSync(`${CFG}/remote-api.json`) );
        
        try {
            config = JSON.parse(fs.readFileSync(`${CFG}/remote-api.json`, "utf8"));
        }
        catch (error){
            config = { "version": "2" };
            log(`[WARNING] '${CFG}/remote-api.json' exists, but it is not a valid JSON file.`);
        }
        
        return config;
    }
    catch (error){
        log(`[ERROR] it's not been possible to validate configuration file '${CFG}/remote-api.json'.`);
        assert(false);
    }
}



function fnCheckVersion(config){
    const METHODSv1 = ["set-config", "get-config", "get-info", "hello", "get-logs", "get-available-api", "change-token", "stop-easy-samba", "pause-easy-samba", "start-easy-samba"];
    const METHODSv2 = [];

    if (fnHas(config, "version")){
        try {
            assert( ["1", "2"].includes(config["version"]) );
        }
        catch (error){
            log(`[WARNING] 'version' property of '${CFG}/remote-api.json' is not valid.`);
            config["version"] = "1";
        }
    }
    else {
        config["version"] = "1";
    }
    
    config["$METHODS"] = (config["version"] === "1") ? METHODSv1 : METHODSv2;
}



function fnCheckToken(config){
    if (config["version"] !== "1"){
        return;
    }

    try {
        if (fnHas(config, "token") !== true){
            log(`[WARNING] since '${CFG}/remote-api.json' doesn't have a 'token' property, a new token will be randomly-generated and will be written to file '${CFG}/remote-api.json'...`);
            config["token"] = ConfigGen.genRandomPassword(12);
            fnUpdateConfigFile(`${CFG}/remote-api.json`, config, ["version", "token"]);
        }
        
        assert( fnHas(config, "token") && fnIsString(config["token"]) && config["token"].length > 0 );
        log(`[LOG] token has been successfully validated.`);
    }
    catch (error){
        log(`[ERROR] it's not been possible to validate the token in '${CFG}/remote-api.json'.`);
        assert(false);
    }
}



function fnCheckUsers(config){
    if (config["version"] !== "2"){
        return;
    }
    
    try {
        if (fnHas(config, "users") !== true){
            log(`[WARNING] since '${CFG}/remote-api.json' doesn't have a 'users' property, a new user 'admin' with a random password will be generated and written to file '${CFG}/remote-api.json'...`);
            config["users"] = [{ "name": "admin", "password": ConfigGen.genRandomPassword(12) }];
            fnUpdateConfigFile(`${CFG}/remote-api.json`, config, ["version", "users"]);
        }
        
        assert( fnIsArray(config["users"]) );
        const names = [];
        assert(config["users"].every((e) => {
            const result = fnHas(e, ["name", "password"]) && [e.name, e.password].every(fnIsString) && e.password.length > 0 && e.name.length > 0 && names.includes(e.name) !== true;
            names.push(e.name);
            e["enabled-api"] = config["$METHODS"];
            return result;
        }));
        
        log(`[LOG] 'users' property has been correctly validated.`);
    }
    catch (error){
        log(`[ERROR] it's not been possible to validate 'users' property of '${CFG}/remote-api.json'.`);
        assert(false);
    }
}



function fnLoadKeyCert(){
    // load private key and certificate for the HTTPS server
    //   if they don't exist, generate new ones
    
    let httpsKey = undefined;
    let httpsCert = undefined;
    try {
        assert( fs.existsSync(`${CFG}/remote-api.key`) );
        assert( fs.existsSync(`${CFG}/remote-api.cert`) );
        httpsKey = fs.readFileSync(`${CFG}/remote-api.key`, "ascii");
        httpsCert = fs.readFileSync(`${CFG}/remote-api.cert`, "ascii");
        log(`[LOG] private key and certificate for HTTPS protocol have been correctly loaded.`);
    }
    catch (error){
        log(`[WARNING] it's not been possible to read private key and certificate for HTTPS protocol.`);
        try {
            log(`[LOG] generating new private key '${CFG}/remote-api.key' and new certificate '${CFG}/remote-api.cert' using OpenSSL...`);
            assert( fnDeleteFile(`${CFG}/remote-api.key`) );
            assert( fnDeleteFile(`${CFG}/remote-api.cert`) );

            spawnSync("openssl", ["req", "-nodes", "-days", "7300", "-new", "-x509", "-keyout", `${CFG}/remote-api.key`, "-out", `${CFG}/remote-api.cert`, "-subj", "/C=US/ST=Some-State/O=localhost/CN=localhost"], { stdio: "ignore" });

            assert( fs.existsSync(`${CFG}/remote-api.key`) );
            assert( fs.existsSync(`${CFG}/remote-api.cert`) );
            httpsKey = fs.readFileSync(`${CFG}/remote-api.key`, "ascii");
            httpsCert = fs.readFileSync(`${CFG}/remote-api.cert`, "ascii");
            log(`[LOG] new private key and certificate have been correctly generated and loaded.`);
        }
        catch (error){
            log(`[ERROR] it's not been possible to generate a new private key and a new certificate for HTTPS protocol.`);
            assert(false);
        }
    }
    
    return { httpsKey: httpsKey, httpsCert: httpsCert };
}



function fnCheckPort(config){
    try {
        assert( fnHas(config, "port") );
        assert( fnIsInteger(config["port"]) );
        assert( config["port"] >= 1024 && config["port"] <= 49151 );
        log(`[LOG] EasySamba Remote API will listen to custom port ${config["port"]}.`);
    }
    catch (error){
        config["port"] = 9595;
        if (fnHas(config, "port")){
            log(`[WARNING] it's been defined a custom port in '${CFG}/remote-api.json', but it will not be used, since it is not in the allowed range 1024-49151.`);
        }
    }
}



function fnCheckCertNego(config){
    try {
        assert( fnHas(config, "cert-nego") );
        assert( [true, false].includes(config["cert-nego"]) );
        if (config["cert-nego"] !== true){
            log(`[LOG] EasySamba Remote API will not enable certificate-negotiation feature.`);
        }
    }
    catch (error){
        config["cert-nego"] = true;
    }
    
    if (config["cert-nego"]){
        log(`[LOG] EasySamba Remote API will enable certificate-negotiation feature.`);
    }
}



function fnCheckEnabledAPI(config){
    if (config["version"] !== "1"){
        return;
    }

    try {
        assert( fnHas(config, "enabled-api") );
        assert( fnIsArray(config["enabled-api"]) || config["enabled-api"] === "*" );
        assert( fnIsArray(config["enabled-api"]) ? config["enabled-api"].every(fnIsString) : true );
        config["enabled-api"] = (config["enabled-api"] === "*") ? config["$METHODS"] : config["enabled-api"].filter((e) => { return config["$METHODS"].includes(e); });
        if (config["enabled-api"].length === 0){
            log(`[WARNING] EasySamba Remote API will not enable any API methods.`);
        }
        else if (config["enabled-api"].length < config["$METHODS"].length){
            const text = config["enabled-api"].map((e) => { return `'${e}'`; }).join(", ");
            log(`[LOG] EasySamba Remote API will enable only these API methods: ${text}.`);
        }
    }
    catch (error){
        config["enabled-api"] = config["$METHODS"];
    }
}


