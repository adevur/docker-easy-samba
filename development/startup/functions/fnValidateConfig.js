


// exports
module.exports = fnValidateConfig;



// dependencies
const fnValidateConfigGuest = require("/startup/functions/fnValidateConfigGuest.js");
const fnValidateConfigUsers = require("/startup/functions/fnValidateConfigUsers.js");
const fnValidateConfigGroups = require("/startup/functions/fnValidateConfigGroups.js");
const fnValidateConfigShares = require("/startup/functions/fnValidateConfigShares.js");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnCheckNetBIOSname = require("/startup/functions/fnCheckNetBIOSname.js");
const fnIsValidPath = require("/startup/functions/fnIsValidPath.js");
const fnIsArray = require("/startup/functions/fnIsArray.js");
const fnIsValidUsername = require("/startup/functions/fnIsValidUsername.js");
const fnIsValidPassword = require("/startup/functions/fnIsValidPassword.js");
const fnUserExists = require("/startup/functions/fnUserExists.js");
const fnValidateString = require("/startup/functions/fnValidateString.js");



// FUNCTION: fnValidateConfig()
// INPUT: configuration, as parsed from "/share/config.json"
// OUTPUT: true in case of no errors, otherwise a string that describes the error
// PURPOSE: check if config file syntax is correct
//   check if config file content is correct
function fnValidateConfig(config){
    // TODO: document "sharedb"
    const sharedb = { "users": [], "names": ["global", "guest"], "paths": ["/share/config.json"], "groups": {} };

    // "config" must contain "domain", "guest", "users" and "shares" properties
    if (fnHas(config, ["domain", "guest", "users", "shares"]) !== true){
        return "DOESN'T CONTAIN 'domain', 'guest', 'users' AND 'shares' PROPERTIES";
    }

    // check "domain" property
    // EXPLAIN: "domain" must be a valid NetBIOS name
    if (fnIsString(config["domain"]) !== true || fnCheckNetBIOSname(config["domain"]) !== true){
        return "'domain' IS NOT A VALID NETBIOS NAME";
    }

    // check "guest" property
    // EXPLAIN: "guest" can be either "false" or the path to the guest share (e.g. "/share/guest")
    //   "guest" cannot be "/share/config.json"
    const validateConfigGuest = fnValidateConfigGuest(config["guest"], sharedb);
    if (validateConfigGuest !== true){
        return validateConfigGuest;
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



