


// exports
module.exports = fnValidateConfigShares;



// dependencies
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnIsValidPath = require("/startup/functions/fnIsValidPath.js");
const fnIsArray = require("/startup/functions/fnIsArray.js");
const fnValidateString = require("/startup/functions/fnValidateString.js");



// FUNCTION: fnValidateConfigShares()
// TODO: write a brief description of this function
function fnValidateConfigShares(shares, sharedb){
    // "shares" must be an array (it can be empty)
    if (fnIsArray(shares) !== true){
        return "'shares' MUST BE AN ARRAY";
    }

    // for each "share" in "shares" ...
    let error = "";
    const result = shares.every((share) => {
        // "share" must have "name", "path" and "access" properties (and cannot have "users" property)
        if (fnHas(share, ["name", "path", "access"]) !== true || fnHas(share, "users") === true){
            error = "EVERY SHARE IN 'shares' MUST ONLY HAVE 'name', 'path' AND 'access' PROPERTIES";
            return false;
        }
        // "name" must be a unique alphanumeric name of minimum 1 char length
        // "name" cannot be "global" or "guest"
        if (
            fnIsString(share["name"]) !== true
            || share["name"].length < 1
            || sharedb.names.includes(share["name"])
            || fnValidateString(share["name"], ["az", "AZ", "09"]) !== true
        ){
            error = "SHARE NAME MUST BE A UNIQUE ALPHANUMERIC NON-EMPTY STRING";
            return false;
        }
        // "path" must be a sub-directory of "/share"
        if (fnIsString(share["path"]) !== true || share["path"].startsWith("/share/") !== true || share["path"].length < 8){
            error = "SHARE PATH MUST BE A SUB-DIRECTORY OF '/share'";
            return false;
        }
        // "path" must be unique
        // "path" cannot be "/share/config.json"
        if (sharedb.paths.includes(share["path"])){
            error = "TWO OR MORE SHARES HAVE THE SAME PATH '" + share["path"] + "'";
            return false;
        }
        // "path" must be a valid path
        if (fnIsValidPath(share["path"]) !== true){
            error = "SHARE PATHS MUST BE A VALID PATH";
            return false;
        }
        // check share["access"]
        // must be an array and it cannot be empty
        if (fnIsArray(share["access"]) !== true || share["access"].length < 1){
            error = "PROPERTY 'access' OF SHARE '" + share["name"] + "' MUST BE A NON-EMPTY ARRAY";
            return false;
        }
        // must contain only users or groups defined early in config["users"] and config["groups"]
        // users and groups can be prefixed with "rw:" or "ro:"
        const temp = share["access"].every((access) => {
            if ((access.startsWith("rw:") || access.startsWith("ro:")) && access.length > 3){
                if (sharedb.users.includes(access.substring(3)) || fnHas(sharedb.groups, access.substring(3))){
                    return true;
                }
            }
            else if (sharedb.users.includes(access) || fnHas(sharedb.groups, access)){
                return true;
            }
            return false;
        });
        if (temp !== true){
            error = "ONE OR MORE ACCESS RULES OF SHARE '" + share["name"] + "' ARE NOT VALID";
            return false;
        }

        // push shares' names
        sharedb.names.push(share["name"]);
        // push shares' paths
        sharedb.paths.push(share["path"]);
        // TODO: update share in order to include "users" property
        // TODO: EXPLAIN
        share["users"] = [];
        share["access"].forEach((access) => {
            if (fnHas(sharedb.groups, (access.startsWith("ro:") || access.startsWith("rw:")) ? access.substring(3) : access)){
                const users = (access.startsWith("ro:") || access.startsWith("rw:")) ? sharedb.groups[access.substring(3)] : sharedb.groups[access];
                const perm = (access.startsWith("ro:")) ? "ro:" : "rw:";
                users.forEach((user) => {
                    if (share["users"].indexOf("ro:" + user) >= 0){
                        share["users"].splice(share["users"].indexOf("ro:" + user), 1);
                    }
                    if (share["users"].indexOf("rw:" + user) >= 0){
                        share["users"].splice(share["users"].indexOf("rw:" + user), 1);
                    }
                    share["users"].push(perm + user);
                });
            }
            else {
                const user = (access.startsWith("ro:") || access.startsWith("rw:")) ? access.substring(3) : access;
                const perm = (access.startsWith("ro:")) ? "ro:" : "rw:";
                if (share["users"].indexOf("ro:" + user) >= 0){
                    share["users"].splice(share["users"].indexOf("ro:" + user), 1);
                }
                if (share["users"].indexOf("rw:" + user) >= 0){
                    share["users"].splice(share["users"].indexOf("rw:" + user), 1);
                }
                share["users"].push(perm + user);
            }
        });

        return true;
    });

    if (result !== true){
        return error;
    }

    return true;
}



