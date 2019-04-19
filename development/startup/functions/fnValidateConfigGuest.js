


// exports
module.exports = fnValidateConfigGuest;



// dependencies
const fnIsString = require("/startup/functions/fnIsString.js");
const fnIsValidPath = require("/startup/functions/fnIsValidPath.js");



// FUNCTION: fnValidateConfigGuest()
// TODO: write a brief description of this function
function fnValidateConfigGuest(guestconf, sharedb){
    if (guestconf !== false){
        // guest share path must be a string
        if (fnIsString(guestconf) !== true){
            return "GUEST SHARE PATH MUST BE A STRING";
        }

        // guest share path must be a sub-directory of "/share"
        if (guestconf.length < 8 || guestconf.startsWith("/share/") !== true){
            return "GUEST SHARE PATH MUST BE A SUB-DIRECTORY OF '/share'";
        }

        // guest share path must be a valid path
        if (fnIsValidPath(guestconf) !== true){
            return "GUEST SHARE PATH MUST BE A VALID PATH";
        }

        // guest share path cannot be "/share/config.json"
        if (guestconf === "/share/config.json"){
            return "GUEST SHARE PATH CANNOT BE '/share/config.json'";
        }

        sharedb.paths.push(guestconf); // TODO: EXPLAIN

        return true;
    }

    return true;
}
