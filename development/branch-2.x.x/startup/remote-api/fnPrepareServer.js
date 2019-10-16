


// exports
module.exports = fnPrepareServer;



// dependencies
const fs = require("fs");
const assert = require("assert");
const { spawnSync } = require("child_process");
const log = require("/startup/functions/fnLog.js")("/share/logs/remote-api.logs");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnIsInteger = require("/startup/functions/fnIsInteger.js");
const fnIsArray = require("/startup/functions/fnIsArray.js");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const fnRemoveDuplicates = require("/startup/functions/fnRemoveDuplicates.js");
const { valid, vassert, isNEString, isIncludedIn, startsWith, isIntInRange, isBool } = require("/startup/functions/valid.js");
const CFG = require("/startup/functions/fnGetConfigDir.js")();
const ConfigGen = require("/startup/ConfigGen.js"); // needed for ConfigGen.genRandomPassword()
const fnCreateServer = require("/startup/remote-api/fnCreateServer.js");



async function fnPrepareServer(){
    log(`[LOG] EasySamba Remote API startup procedure has started.`);
    
    // load "remote-api.json"
    const config = fnLoadConfig();
    
    // check property "version"
    fnCheckVersion(config);
    
    // check property "users"
    fnCheckUsers(config);
    
    // load private key and certificate for the HTTPS server
    const { httpsKey, httpsCert } = fnLoadKeyCert();
    
    // check property "port"
    fnCheckPort(config);
    
    // check property "cert-nego"
    fnCheckCertNego(config);
    
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
    const METHODS = ["set-config", "get-config", "get-info", "hello", "get-logs", "get-available-api", "get-enabled-api", "change-my-password", "change-other-password", "stop-easy-samba", "pause-easy-samba", "start-easy-samba"];
    
    if (fnHas(config, "version") !== true){
        config["version"] = "2";
    }
    
    if (config["version"] !== "2"){
        log(`[ERROR] 'version' property of '${CFG}/remote-api.json' is not valid.`);
        assert(false);
    }
    
    config["$METHODS"] = METHODS;
}



function fnCheckUsers(config){
    try {
        if (fnHas(config, "users") !== true){
            log(`[WARNING] since '${CFG}/remote-api.json' doesn't have a 'users' property, a new user 'admin' with a random password will be generated and written to file '${CFG}/remote-api.json'...`);
            config["users"] = [{ "name": "admin", "password": ConfigGen.genRandomPassword(12), "enabled-api": "*" }];
            fnUpdateConfigFile(`${CFG}/remote-api.json`, config, ["version", "users"]);
        }
        
        assert( fnIsArray(config["users"]) );
        const names = [];
        assert(config["users"].every((e) => {
            const isLocalUser = {
                check: {
                    prop: ["name", "password"],
                    every: isNEString
                },
                and: { prop: "name", not: isIncludedIn(names) }
            };
            
            const isLdapUser = {
                check: {
                    prop: "ldap-user",
                    check: isNEString
                },
                and: {
                    inCase: { has: "name" },
                    check: {
                        prop: "name",
                        check: isNEString,
                        and: { not: isIncludedIn(names) }
                    }
                }
            };
            
            const isLdapGroup = {
                prop: "ldap-group",
                check: isNEString,
                and: { not: isIncludedIn(names) }
            };
            
            if (fnHas(e, "enabled-api") !== true || e["enabled-api"] === "*"){
                e["enabled-api"] = config["$METHODS"];
            }
            
            const hasValidEnabledAPI = {
                check: {
                    hasEither: ["ldap-user", "ldap-group"],
                    and: {
                        prop: "enabled-api",
                        check: startsWith("ldap-attr:")
                    }
                },
                or: {
                    prop: "enabled-api",
                    everyElem: isIncludedIn(config["$METHODS"])
                }
            };
            
            const result = valid(e, { either: [isLocalUser, isLdapUser, isLdapGroup], and: hasValidEnabledAPI });
            
            if (result){
                names.push( fnHas(e, "name") ? e.name : (fnHas(e, "ldap-user") ? e["ldap-user"] : e["ldap-group"]) );
                if (fnIsArray(e["enabled-api"])){
                    e["enabled-api"] = fnRemoveDuplicates(e["enabled-api"]);
                }
            }
            return result;
        }));
        
        log(`[LOG] 'users' property has been correctly validated.`);
    }
    catch (error){
        log(`[ERROR] 'users' property of '${CFG}/remote-api.json' is not valid.`);
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
    if (fnHas(config, "port") !== true){
        config["port"] = 9595;
        return;
    }

    try {
        vassert(config, {
            prop: "port",
            check: isIntInRange(1024, 49151)
        });
        log(`[LOG] EasySamba Remote API will listen to custom port ${config["port"]}.`);
    }
    catch (error){
        log(`[WARNING] it's been defined a custom port in '${CFG}/remote-api.json', but it will not be used, since it is not in the allowed range 1024-49151.`);
        config["port"] = 9595;
    }
}



function fnCheckCertNego(config){
    try {
        vassert(config, {
            prop: "cert-nego",
            check: isBool
        });
    }
    catch (error){
        config["cert-nego"] = true;
    }
    
    if (config["cert-nego"]){
        log(`[LOG] EasySamba Remote API will enable certificate-negotiation feature.`);
    }
    else {
        log(`[LOG] EasySamba Remote API will not enable certificate-negotiation feature.`);
    }
}



