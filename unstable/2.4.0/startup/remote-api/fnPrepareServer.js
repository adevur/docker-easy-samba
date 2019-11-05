


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
const { valid, vassert, voodoo, isNEString, isIncludedIn, startsWith, isIntInRange, isBool, has, isArray, isIP, isHostname, isString, split, substring, toLowerCase } = require("/startup/functions/valid.js");
const CFG = require("/startup/functions/fnGetConfigDir.js")();
const ConfigGen = require("/startup/ConfigGen.js"); // needed for ConfigGen.genRandomPassword()
const fnCreateServer = require("/startup/remote-api/fnCreateServer.js");



async function fnPrepareServer(){
    log(`[LOG] EasySamba Remote API startup procedure has started.`);
    
    // load "remote-api.json"
    const config = fnLoadConfig();
    
    // check property "version"
    fnCheckVersion(config);
    
    // load LDAP configuration
    fnLoadLdapConfig(config);
    
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



function fnLoadLdapConfig(config){
    config["$ldap"] = {};

    try {
        const ldap = JSON.parse(fs.readFileSync(`${CFG}/ldap.json`, "utf8"));
        
        const test = [
            { prop: "version", check: "1" },
            { prop: "protocol", check: "ldap", doo: (proto) => { config["$ldap"].protocol = proto; } },
            // { prop: "protocol", either: ["ldap", "ldaps"], doo: (proto) => { config["$ldap"].protocol = proto; } },
            { inCase: { has: "active-directory" }, prop: "active-directory", check: isBool, doo: (ad) => { config["$ldap"].ad = ad; } },
            { inCase: { not: { has: "active-directory" } }, always: true, doo: () => { config["$ldap"].ad = false; } },
            { prop: "hostname", either: [isIP, isHostname], doo: (hostname) => { config["$ldap"].hostname = hostname; } },
            { inCase: { prop: "active-directory", check: true }, prop: "hostname", not: isIP },
            { inCase: { has: "port" }, prop: "port", check: isIntInRange(1, 49151), doo: (port) => { config["$ldap"].port = String(port); } },
            { inCase: { not: { has: "port" } }, always: true, doo: () => { config["$ldap"].port = (config["$ldap"].protocol === "ldap") ? "389" : "636"; } },
            
            { inCase: { has: "bindOptions" }, prop: "bindOptions", check: [
                { prop: "username", check: isString },
                { prop: "searchBase", check: isString }
            ], doo: (opt) => {
                config["$ldap"].bindOptions = opt;
            } },
            
            { inCase: { not: { has: "bindOptions" } }, always: true, doo: () => {
                if (config["$ldap"].ad){
                    config["$ldap"].bindOptions = {};
                    config["$ldap"].bindOptions.searchBase = config["$ldap"].hostname.split(".").slice(1).map(e => `dc=${e}`).join(",");
                    config["$ldap"].bindOptions.username = "%USERNAME%@" + config["$ldap"].hostname.split(".").slice(1).join(".");
                }
                else {
                    config["$ldap"].bindOptions = { username: "%USERNAME%", searchBase: "%USERNAME%" };
                }
            } },
            
            { inCase: { has: "userDN" }, prop: "userDN", either: [isString, [
                { prop: "filter", check: isString },
                { prop: "searchBase", check: isString }
            ]], doo: (userDN) => {
                config["$ldap"].userDN = userDN;
            } },
            
            { inCase: { not: { has: "userDN" } }, always: true, doo: () => {
                if (config["$ldap"].ad){
                    config["$ldap"].userDN = {
                        filter: `(userPrincipalName=%USERNAME%@${ config["$ldap"].hostname.split(".").slice(1).join(".") })`,
                        searchBase: config["$ldap"].hostname.split(".").slice(1).map(e => `dc=${e}`).join(",")
                    };
                }
                else {
                    config["$ldap"].userDN = "%USERNAME%";
                }
            } },
            
            { inCase: { has: "groupDN" }, prop: "groupDN", either: [isString, [
                { prop: "filter", check: isString },
                { prop: "searchBase", check: isString }
            ]], doo: (groupDN) => {
                config["$ldap"].groupDN = groupDN;
            } },
            
            { inCase: { not: { has: "groupDN" } }, always: true, doo: () => {
                if (config["$ldap"].ad){
                    config["$ldap"].groupDN = "cn=%GROUPNAME%,cn=Users," + config["$ldap"].hostname.split(".").slice(1).map(e => `dc=${e}`).join(",");
                }
                else {
                    config["$ldap"].groupDN = "%GROUPNAME%";
                }
            } }
        ];
        
        vassert(ldap, test);
    }
    catch (error){
        config["$ldap"] = false;
    }
}



function fnCheckUsers(config){
    try {
        if (has(config)("users") !== true){
            log(`[WARNING] since '${CFG}/remote-api.json' doesn't have a 'users' property, a new user 'admin' with a random password will be generated and written to file '${CFG}/remote-api.json'...`);
            config["users"] = [{ "name": "admin", "password": ConfigGen.genRandomPassword(12), "enabled-api": "*" }];
            fnUpdateConfigFile(`${CFG}/remote-api.json`, config, ["version", "users"]);
        }
        
        const names = [];
        
        const isLocalUser = {
            check: [{ prop: ["name", "password"], every: isNEString }, { prop: "name", post: toLowerCase, not: isIncludedIn(names) }],
            doo: (user) => { names.push(user.name.toLowerCase()); user["$type"] = "local"; }
        };
        
        const isLdapUser = { check: [
            { prop: "ldap-user", check: isNEString },
            { inCase: { has: "name" }, prop: "name", check: [isNEString, { pre: toLowerCase, not: isIncludedIn(names) }], doo: (name) => { names.push(name.toLowerCase()); } },
            { inCase: { not: { has: "name" } }, prop: "ldap-user", post: toLowerCase, not: isIncludedIn(names), doo: (name) => { names.push(name.toLowerCase()); } }
        ], doo: (user) => { user["$type"] = "ldapUser"; } };
        
        const isLdapGroup = {
            check: { prop: "ldap-group", check: [isNEString, { pre: toLowerCase, not: isIncludedIn(names) }] },
            doo: (user) => { names.push(user["ldap-group"].toLowerCase()); user["$type"] = "ldapGroup"; }
        };
        
        const hasValidEnabledAPI = [
            { inCase: { not: { has: "enabled-api" } }, always: true, doo: (user) => { user["enabled-api"] = []; } },
            { inCase: { prop: "enabled-api", check: "*" }, always: true, doo: (user) => { user["enabled-api"] = config["$METHODS"]; } },
            { either: [
                [{ hasEither: ["ldap-user", "ldap-group"] }, { prop: "enabled-api", check: [startsWith("ldap-attr:"), { length: { greater: 10 } }] }],
                { prop: "enabled-api", everyElem: isIncludedIn(config["$METHODS"]) }
            ] },
            { inCase: { prop: "enabled-api", check: isArray }, always: true, doo: (user) => {
                user["enabled-api"].push("hello");
                user["enabled-api"] = fnRemoveDuplicates(user["enabled-api"]);
            } }
        ];
        
        const isLdapEnabled = () => {
            return config["$ldap"] !== false;
        };
        
        const isValidUser = [
            { either: [isLocalUser, [isLdapEnabled, isLdapUser], [isLdapEnabled, isLdapGroup]] },
            hasValidEnabledAPI
        ];
        
        vassert(config["users"], { everyElem: isValidUser });
        
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
    if (has(config)("port") !== true){
        config["port"] = 9595;
        return;
    }
    
    const isValidPort = { prop: "port", check: isIntInRange(1024, 49151) };
    
    voodoo(config, isValidPort).yay(() => {
        log(`[LOG] EasySamba Remote API will listen to custom port ${config["port"]}.`);
    }).oops(() => {
        log(`[WARNING] it's been defined a custom port in '${CFG}/remote-api.json', but it will not be used, since it is not in the allowed range 1024-49151.`);
        config["port"] = 9595;
    });
}



function fnCheckCertNego(config){
    const isValidCertNego = { prop: "cert-nego", check: isBool };
    
    voodoo(config, isValidCertNego).oops(() => {
        config["cert-nego"] = true;
    });
    
    if (config["cert-nego"]){
        log(`[LOG] EasySamba Remote API will enable certificate-negotiation feature.`);
    }
    else {
        log(`[LOG] EasySamba Remote API will not enable certificate-negotiation feature.`);
    }
}



