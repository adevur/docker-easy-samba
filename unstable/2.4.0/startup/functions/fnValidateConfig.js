


// exports
module.exports = fnValidateConfig;



// dependencies
const { valid } = require("/startup/functions/valid.js");
const fnValidateConfigVersion = require("/startup/functions/fnValidateConfigVersion.js");
const fnValidateConfigUsers = require("/startup/functions/fnValidateConfigUsers.js");
const fnValidateConfigGroups = require("/startup/functions/fnValidateConfigGroups.js");
const fnValidateConfigShares = require("/startup/functions/fnValidateConfigShares.js");
const isValidNetBIOSname = require("/startup/functions/isValidNetBIOSname.js");




// FUNCTION: fnValidateConfig()
// INPUT: configuration, as parsed from "config.json"
// OUTPUT: true in case of no errors, otherwise a string that describes the error
// PURPOSE: check if config file syntax is correct
//   check if config file content is correct
function fnValidateConfig(config){
    // TODO: document "sharedb"
    const sharedb = { "users": [], "names": ["global", "homes", "printers"], "paths": [], "groups": {} };
    
    const test = [
        { has: ["domain", "users", "shares"], error: "MUST CONTAIN 'domain', 'users' AND 'shares' PROPERTIES" },
        fnValidateConfigVersion(),
        { prop: "domain", check: isValidNetBIOSname, error: "'domain' IS NOT A VALID NETBIOS NAME" },
        { prop: "users", check: fnValidateConfigUsers(sharedb) },
        fnValidateConfigGroups(sharedb),
        { prop: "shares", check: fnValidateConfigShares(sharedb) }
    ];
    
    return valid(config, test);
}



