


// exports
module.exports = fnValidateConfig;



// dependencies
const fnValidateConfigVersion = require("/startup/functions/fnValidateConfigVersion.js");
const fnValidateConfigUsers = require("/startup/functions/fnValidateConfigUsers.js");
const fnValidateConfigGroups = require("/startup/functions/fnValidateConfigGroups.js");
const fnValidateConfigShares = require("/startup/functions/fnValidateConfigShares.js");
const fnValidateConfigGlobal = require("/startup/functions/fnValidateConfigGlobal.js");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnIsArray = require("/startup/functions/fnIsArray.js");
const fnCheckNetBIOSname = require("/startup/functions/fnCheckNetBIOSname.js");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");



// FUNCTION: fnValidateConfig()
// INPUT: configuration, as parsed from "config.json"
// OUTPUT: true in case of no errors, otherwise a string that describes the error
// PURPOSE: check if config file syntax is correct
//   check if config file content is correct
function fnValidateConfig(config){
    // TODO: document "sharedb"
    const sharedb = { "users": [], "names": ["global", "homes", "printers"], "paths": [], "groups": {} };

    // "config" must contain "domain", "users" and "shares" properties
    if (fnHas(config, ["domain", "users", "shares"]) !== true){
        return "MUST CONTAIN 'domain', 'users' AND 'shares' PROPERTIES";
    }

    // check "guest" property
    if (fnHas(config, "guest") && fnIsString(config["guest"])){
        console.log(`[WARNING] 'guest' section of 'config.json' is not supported anymore. Use 'guest' property of shares, in order to create anonymous shared folders.`);
        if (fnHas(config, "shares") && fnIsArray(config["shares"])){
            config["shares"].push({ "name": "guest", "path": config["guest"], "access": [], "guest": "rw" });
        }
    }

    // check "version" property
    const validateConfigVersion = fnValidateConfigVersion(config);
    if (validateConfigVersion !== true){
        return validateConfigVersion;
    }

    // check "global" property
    const validateConfigGlobal = fnValidateConfigGlobal(config);
    if (validateConfigGlobal !== true){
        return validateConfigGlobal;
    }

    // check "domain" property
    // EXPLAIN: "domain" must be a valid NetBIOS name
    if (fnIsString(config["domain"]) !== true || fnCheckNetBIOSname(config["domain"]) !== true){
        return "'domain' IS NOT A VALID NETBIOS NAME";
    }

    // check "users" property
    const validateConfigUsers = fnValidateConfigUsers(config["users"], sharedb);
    if (validateConfigUsers !== true){
        return validateConfigUsers;
    }

    // check "groups" property
    const validateConfigGroups = fnValidateConfigGroups(config, sharedb);
    if (validateConfigGroups !== true){
        return validateConfigGroups;
    }

    // check "shares" property
    const validateConfigShares = fnValidateConfigShares(config["shares"], sharedb);
    if (validateConfigShares !== true){
        return validateConfigShares;
    }

    return true;
}



