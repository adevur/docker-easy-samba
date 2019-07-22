


// exports
module.exports = fnValidateConfigVersion;



// dependencies
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");



// FUNCTION: fnValidateConfigVersion()
// INPUT: configuration, as parsed from "/share/config.json"
// OUTPUT: true in case of no errors, otherwise a string that describes the error
// PURPOSE: check if config file "version" property is correct
function fnValidateConfigVersion(config){
    // if config doesn't have "version" property, we assume that config version is supported by this version of easy-samba
    if (fnHas(config, "version") !== true){
        return true;
    }

    // if config file does have "version" property, we make sure that its version is compatible
    //   with this version of easy-samba

    const version = config["version"];

    // "version" must be a string
    if (fnIsString(version) !== true){
        return `'version' PROPERTY MUST BE A STRING`;
    }

    if (["1", "1.0", "1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "1.10", "1.11", "1.12", "1.13", "1.14"].includes(version) !== true){
        return `THIS CONFIGURATION FILE USES FEATURES THAT REQUIRE EASY-SAMBA VERSION '${version}' OR NEWER`;
    }

    return true;
}




