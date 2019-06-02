


// exports
module.exports = fnValidateConfigVersion;



// dependencies
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnIsInteger = require("/startup/functions/fnIsInteger.js");



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

    // "version" must be formatted as "x" or "x.y" (e.g. "1", "1.1", "2", "3.2")
    //   where "x" and "y" are both non-negative integers
    const check = (str) => {
        const temp = str.split(".");
        return (str.length > 0 && fnIsInteger(str)) || (temp.length === 2 && temp[0].length > 0 && temp[1].length > 0 && fnIsInteger(temp[0]) && fnIsInteger(temp[1]));
    };
    if (check(version) !== true){
        return `'version' PROPERTY MUST BE A VALID CONFIGURATION FILE VERSION`;
    }

    // the current version of easy-samba supports only "1.5" config files
    if (version === "1" || version === "1.0" || version === "1.1" || version === "1.2" || version === "1.3" || version === "1.4"){
        return `THIS CONFIGURATION FILE USES FEATURES THAT REQUIRE EASY-SAMBA VERSION '${version}' OR OLDER`;
    }
    if (version !== "1.5"){
        return `THIS CONFIGURATION FILE USES FEATURES THAT REQUIRE EASY-SAMBA VERSION '${version}' OR NEWER`;
    }

    return true;
}




