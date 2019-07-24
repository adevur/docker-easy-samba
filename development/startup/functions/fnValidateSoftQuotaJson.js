


// exports
module.exports = fnValidateSoftQuotaJson;



// dependencies
const fs = require("fs");
const assert = require("assert");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnIsValidPath = require("/startup/functions/fnIsValidPath.js");
const fnIsArray = require("/startup/functions/fnIsArray.js");
const fnListUsers = require("/startup/functions/fnListUsers.js");
const fnIsInteger = require("/startup/functions/fnIsInteger.js");



// FUNCTION: fnValidateSoftQuotaJson()
// INPUT: "shares", as parsed from "/startup/soft-quota.json"
// OUTPUT: true in case of success
// PURPOSE: check that "/startup/soft-quota.json" is valid
function fnValidateSoftQuotaJson(shares){
    // "shares" must be an array (it can be empty)
    if (fnIsArray(shares) !== true){
        return false;
    }
    
    const paths = [];

    // for each "share" in "shares" ...
    const result = shares.every((share) => {
        // "share" must have "path", "users" and "$soft-quota" properties
        if (fnHas(share, ["path", "users", "$soft-quota"]) !== true){
            return false;
        }

        // "path" must be a sub-directory of "/share"
        if (fnIsString(share["path"]) !== true || share["path"].startsWith("/share/") !== true || share["path"].length < 8){
            return false;
        }

        // "path" must be a valid path
        if (fnIsValidPath(share["path"].substring(7)) !== true){
            return false;
        }

        // "path" cannot be "/share/config.json", "/share/config", "/share/config.gen.js" or "/share/remote-api.json"
        if (["/share/config", "/share/config.json", "/share/config.gen.js", "/share/remote-api.json"].includes(share["path"])){
            return false;
        }

        // "path" must be unique
        if (paths.includes(share["path"])){
            return false;
        }

        // if "path" already exists on disk, make sure it is a directory
        // TODO: could be improved
        if (fs.existsSync(share["path"]) && fs.lstatSync(share["path"]).isDirectory() !== true){
            return false;
        }

        // check share["guest"]
        if (fnHas(share, "guest")){
            if (share["guest"] !== "rw" && share["guest"] !== "ro"){
                return false;
            }
        }

        // check "users" property
        const nativeUsers = JSON.parse( fs.readFileSync("/startup/native_users.json", "utf8") );
        const currentUsers = fnListUsers();
        const checkUsers = share["users"].every((u) => {
            try {
                assert( fnIsString(u) && u.length > 3 );
                assert( ["rw:", "ro:"].includes(u.substring(0, 3)) );
                assert( nativeUsers.includes(u.substring(3)) !== true );
                assert( currentUsers.includes(u.substring(3)) );
                return true;
            }
            catch (error){
                return false;
            }
        });
        if (checkUsers !== true){
            return false;
        }
        
        // check "$soft-quota" property
        try {
            const sq = share["$soft-quota"];
            assert( fnHas(sq, ["limit", "whitelist"]) );
            assert( fnIsInteger(sq["limit"]) && sq["limit"] >= 0 );
            assert( fnIsArray(sq["whitelist"]) && sq["whitelist"].every(fnIsString) );
            assert(sq["whitelist"].every((e) => {
                return (nativeUsers.includes(e) !== true && currentUsers.includes(e));
            }));
        }
        catch (error){
            return false;
        }

        // push shares' paths
        paths.push(share["path"]);

        return true;
    });

    return result;
}



