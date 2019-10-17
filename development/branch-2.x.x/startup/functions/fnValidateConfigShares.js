


// exports
module.exports = fnValidateConfigShares;



// dependencies
const fs = require("fs");
const isValidPath = require("/startup/functions/isValidPath.js");
const fnValidateConfigSharesAccess = require("/startup/functions/fnValidateConfigSharesAccess.js");
const fnEvaluateAccessRules = require("/startup/functions/fnEvaluateAccessRules.js");
const fnValidateConfigSharesQuota = require("/startup/functions/fnValidateConfigSharesQuota.js");
const { valid, isASCII, isString, startsWith, substring, isIncludedIn, isAlphaNum, toLowerCase, isArray } = require("/startup/functions/valid.js");



// FUNCTION: fnValidateConfigShares()
// TODO: write a brief description of this function
function fnValidateConfigShares(shares, sharedb){
    const isValidSharePath = [
        { check: [isString, startsWith("/share/"), { length: { greaterEq: 8 } }], error: `SHARED FOLDERS' PATH MUST BE A SUB-DIRECTORY OF '/share'` },
        { pre: substring(7), check: isValidPath, error: `SHARED FOLDERS' PATH MUST BE A VALID PATH` },
        { not: { either: ["/share/config", "/share/logs"] }, error: `SHARED FOLDERS' PATH CANNOT BE EQUAL TO '/share/config' OR TO '/share/logs'` },
        { not: isIncludedIn(sharedb.paths), error: `TWO OR MORE SHARED FOLDERS HAVE THE SAME PATH` },
        { inCase: path => fs.existsSync(path), check: path => fs.lstatSync(path).isDirectory(), error: path => `SHARED FOLDER WITH PATH '${path}' IS NOT A DIRECTORY` }
    ];

    const isValidShareName = [
        isASCII,
        { length: { between: [1, 8] } },
        isAlphaNum,
        { pre: toLowerCase, not: { either: ["global", "homes", "printers"] } },
        { pre: toLowerCase, not: isIncludedIn(sharedb.names.map(toLowerCase)) }
    ];

    const isValidShare = [
        { has: ["name", "path", "access"], error: `EVERY SHARED FOLDER IN 'shares' MUST HAVE 'name', 'path' AND 'access' PROPERTIES` },
        // delete "users" property if present (it is reserved for internal use)
        { inCase: { has: "users" }, always: true, doo: (share) => { delete share["users"]; } },
        // delete "$soft-quota" property if present (it is reserved for internal use)
        { inCase: { has: "$soft-quota" }, always: true, doo: (share) => { delete share["$soft-quota"]; } },
        { prop: "name", check: isValidShareName, error: `SHARED FOLDER NAME MUST BE A UNIQUE ALPHANUMERIC NON-EMPTY STRING OF MAX 8 CHARS` },
        { prop: "path", check: isValidSharePath },
        {
            check: { inCase: { has: "guest" }, prop: "guest", either: ["rw", "ro"] },
            error: share => `SHARED FOLDER WITH PATH '${share["path"]}' HAS AN INVALID GUEST PROPERTY`
        },
        fnValidateConfigSharesAccess(sharedb),
        fnValidateConfigSharesQuota(sharedb),
        { always: true, doo: (share) => { sharedb.names.push(share["name"]); } },
        { always: true, doo: (share) => { sharedb.paths.push(share["path"]); } },
        { always: true, doo: (share) => { fnEvaluateAccessRules(share, sharedb); } },
        { either: [{ has: "guest" }, { prop: "users", length: { greater: 0 } }], error: share => `AT LEAST ONE USER SHOULD BE ABLE TO ACCESS SHARED FOLDER '${share["path"]}'` }
    ];

    const test = [
        { check: isArray, error: `'shares' MUST BE AN ARRAY` },
        { every: isValidShare }
    ];
    
    return valid(shares, test);
}



