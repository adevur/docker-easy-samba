


// exports
module.exports = fnValidateConfigShares;



// dependencies
const fs = require("fs");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnIsValidPath = require("/startup/functions/fnIsValidPath.js");
const fnIsArray = require("/startup/functions/fnIsArray.js");
const fnValidateString = require("/startup/functions/fnValidateString.js");
const fnValidateConfigSharesAccess = require("/startup/functions/fnValidateConfigSharesAccess.js");
const fnEvaluateAccessRules = require("/startup/functions/fnEvaluateAccessRules.js");
const fnValidateConfigSharesQuota = require("/startup/functions/fnValidateConfigSharesQuota.js");



// FUNCTION: fnValidateConfigShares()
// TODO: write a brief description of this function
function fnValidateConfigShares(shares, sharedb){
    // "shares" must be an array (it can be empty)
    if (fnIsArray(shares) !== true){
        return `'shares' MUST BE AN ARRAY`;
    }

    // for each "share" in "shares" ...
    let error = "";
    const result = shares.every((share) => {
        // "share" must have "name", "path" and "access" properties
        if (fnHas(share, ["name", "path", "access"]) !== true){
            error = `EVERY SHARED FOLDER IN 'shares' MUST HAVE 'name', 'path' AND 'access' PROPERTIES`;
            return false;
        }

        // delete "users" property if present (it is reserved for internal use)
        if (fnHas(share, "users")){
            delete share["users"];
        }
        
        // delete "$soft-quota" property if present (it is reserved for internal use)
        if (fnHas(share, "$soft-quota")){
            delete share["$soft-quota"];
        }

        // "name" must be a unique alphanumeric name of minimum 1 char and maximum 8 chars length
        // "name" cannot be "global", "homes" or "printers"
        if (
            fnIsString(share["name"]) !== true
            || share["name"].length < 1
            || sharedb.names.map((e) => { return e.toLowerCase(); }).includes(share["name"].toLowerCase())
            || fnValidateString(share["name"], ["az", "AZ", "09"]) !== true
            || share["name"].length > 8
        ){
            error = `SHARED FOLDER NAME MUST BE A UNIQUE ALPHANUMERIC NON-EMPTY STRING OF MAX 8 CHARS`;
            return false;
        }

        // "path" must be a sub-directory of "/share"
        if (fnIsString(share["path"]) !== true || share["path"].startsWith("/share/") !== true || share["path"].length < 8){
            error = `SHARED FOLDERS' PATH MUST BE A SUB-DIRECTORY OF '/share'`;
            return false;
        }

        // "path" must be a valid path
        if (fnIsValidPath(share["path"].substring(7)) !== true){
            error = `SHARED FOLDERS' PATH MUST BE VALID PATH`;
            return false;
        }

        // "path" cannot be "/share/config" or "/share/logs"
        if (["/share/config", "/share/logs"].includes(share["path"])){
            error = `SHARED FOLDERS' PATH CANNOT BE EQUAL TO '/share/config' OR TO '/share/logs'`;
            return false;
        }

        // "path" must be unique
        if (sharedb.paths.includes(share["path"])){
            error = `TWO OR MORE SHARED FOLDERS HAVE THE SAME PATH`;
            return false;
        }

        // if "path" already exists on disk, make sure it is a directory
        // TODO: could be improved
        if (fs.existsSync(share["path"]) && fs.lstatSync(share["path"]).isDirectory() !== true){
            error = `SHARED FOLDER WITH PATH '${share["path"]}' IS NOT A DIRECTORY`;
            return false;
        }

        // check share["guest"]
        if (fnHas(share, "guest")){
            if (share["guest"] !== "rw" && share["guest"] !== "ro"){
                error = `SHARED FOLDER WITH PATH '${share["path"]}' HAS AN INVALID GUEST PROPERTY`;
                return false;
            }
        }

        // validate "access" property
        const validateConfigSharesAccess = fnValidateConfigSharesAccess(share, sharedb);
        if (validateConfigSharesAccess !== true){
            error = validateConfigSharesAccess;
            return false;
        }
        
        // check "soft-quota" property
        const validateConfigSharesQuota = fnValidateConfigSharesQuota(share, sharedb);
        if (validateConfigSharesQuota !== true){
            error = validateConfigSharesQuota;
            return false;
        }

        // push shares' names
        sharedb.names.push(share["name"]);

        // push shares' paths
        sharedb.paths.push(share["path"]);

        // evaluate access rules
        // TODO: EXPLAIN
        fnEvaluateAccessRules(share, sharedb);
        
        // after access rules evaluation,
        //   if no user has access to the shared folder, throw error
        if (share["users"].length < 1 && fnHas(share, "guest") !== true){
            error = `AT LEAST ONE USER SHOULD BE ABLE TO ACCESS SHARED FOLDER '${share["path"]}'`;
            return false;
        }

        return true;
    });

    if (result !== true){
        return error;
    }

    return true;
}



