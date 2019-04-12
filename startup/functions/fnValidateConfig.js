


// exports
module.exports = fnValidateConfig;



// dependencies
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
    const sharedb = { "users": [], "names": ["global", "guest"], "paths": ["/share/config.json"] };

    // "config" must contain "domain", "guest", "users" and "shares" properties
    if (fnHas(config, ["domain", "guest", "users", "shares"]) !== true){
        return "DOESN'T CONTAIN 'domain', 'guest', 'users' AND 'shares'";
    }

    // check "domain" property
    // EXPLAIN: "domain" must be a valid NetBIOS name
    if (fnIsString(config["domain"]) !== true || fnCheckNetBIOSname(config["domain"]) !== true){
        return "'domain' IS NOT A VALID NETBIOS NAME";
    }

    // check "guest" property
    // EXPLAIN: "guest" can be either "false" or the path to the guest share (e.g. "/share/guest")
    //   "guest" cannot be "/share/config.json"
    if (config["guest"] !== false){
        // guest share path must be a string
        if (fnIsString(config["guest"]) !== true){
            return "GUEST SHARE PATH MUST BE A STRING";
        }
        // guest share path must be a sub-directory of "/share"
        if (config["guest"].length < 8 || config["guest"].startsWith("/share/") !== true){
            return "GUEST SHARE PATH MUST BE A SUB-DIRECTORY OF '/share'";
        }
        // guest share path must be a valid path
        if (fnIsValidPath(config["guest"]) !== true){
            return "GUEST SHARE PATH MUST BE AN ALPHANUMERIC STRING";
        }
        // guest share path cannot be "/share/config.json"
        if (config["guest"] === "/share/config.json"){
            return "GUEST SHARE PATH CANNOT BE '/share/config.json'";
        }
        sharedb.paths.push(config["guest"]);
    }

    // check "users" property
    // "users" must be an array (it can be empty)
    if (fnIsArray(config["users"]) === true){
        let error = "";
        const result = config["users"].every((user) => {
            // "user" must have "name" and "password" properties
            if (fnHas(user, ["name", "password"]) !== true){
                error = "USERS IN 'users' MUST HAVE 'name' AND 'password' PROPERTIES";
                return false;
            }
            // "username" and "password" must be strings
            if (fnIsString(user["name"]) !== true || fnIsString(user["password"]) !== true){
                error = "USER 'name' AND 'password' PROPERTIES MUST BE STRINGS";
                return false;
            }
            // "username" must be a valid username
            if (fnIsValidUsername(user["name"]) !== true){
                error = "THERE IS A USERNAME DEFINED IN 'users' THAT IS NOT VALID";
                return false;
            }
            // "password" must be a valid password
            if (fnIsValidPassword(user["password"]) !== true){
                error = "THERE IS A PASSWORD DEFINED IN 'users' THAT IS NOT VALID";
                return false;
            }
            // user must not exist in the OS
            if (fnUserExists(user["name"])){
                error = "USER '" + user["name"] + "' ALREADY EXISTS IN THE OS";
                return false;
            }
            // user must be unique in config.json
            if (sharedb.users.includes(user["name"])){
                error = "USER '" + user["name"] + "' HAS BEEN DEFINED MORE THAN ONCE";
                return false;
            }
            sharedb.users.push(user["name"]);
            return true;
        });
        if (result !== true){
            return error;
        }
    }
    else {
        return "'users' MUST BE AN ARRAY";
    }

    // check "shares" property
    // "shares" must be an array (it can be empty)
    if (fnIsArray(config["shares"]) === true){
        // for each "share" in "shares" ...
        let error = "";
        const result = config["shares"].every((share) => {
            // "share" must have "name", "path" and "users" properties
            if (fnHas(share, ["name", "path", "users"]) !== true){
                error = "EVERY SHARE IN 'shares' MUST HAVE 'name', 'path' AND 'users' PROPERTIES";
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
                error = "SHARE PATHS MUST BE ALPHANUMERIC";
                return false;
            }
            // check share["users"]
            // EXPLAIN: must be an array; must contain only users defined early in config["users"]
            if (fnIsArray(share["users"]) !== true || (share["users"].every((user) => { return sharedb.users.includes(user); })) !== true){
                error = "ONE OR MORE USERS OF SHARE '" + share["name"] + "' ARE NOT VALID";
                return false;
            }

            sharedb.names.push(share["name"]);
            sharedb.paths.push(share["path"]);
            return true;
        });
        if (result !== true){
            return error;
        }
    }
    else {
        return "'shares' MUST BE AN ARRAY";
    }

    return true;
}



