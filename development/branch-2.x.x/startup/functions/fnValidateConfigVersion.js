


// exports
module.exports = fnValidateConfigVersion;



// dependencies
const { valid, isNEString, isIncludedIn } = require("/startup/functions/valid.js");



// FUNCTION: fnValidateConfigVersion()
// INPUT: configuration, as parsed from "config.json"
// OUTPUT: true in case of no errors, otherwise a string that describes the error
// PURPOSE: check if config file "version" property is correct
function fnValidateConfigVersion(){
    return {
        inCase: { has: "version" },
        prop: "version",
        check: [
            { check: isNEString, error: `'version' PROPERTY MUST BE A NON-EMPTY STRING` },
            { check: isIncludedIn(["1.18", "1.19", "2.0", "2.1", "2.2", "2.3"]), error: version => `THIS CONFIGURATION FILE REQUIRES A VERSION OF EASY-SAMBA COMPATIBLE WITH '${version}'` }
        ]
    };
}




