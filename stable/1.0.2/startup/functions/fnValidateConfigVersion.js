


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
    // if config doesn't have "version" property, we assume that config version is "1.0"
    // since this version of easy-samba supports "1.0" config files, we return true
    if (fnHas(config, "version") !== true){
        return true;
    }

    // if config file does have "version" property, we make sure that its version is compatible
    //   with this version of easy-samba
    if (fnHas(config, "version") === true){
        const version = config["version"];

        // "version" must be a string
        if (fnIsString(version) !== true){
            return "'version' PROPERTY MUST BE A STRING";
        }

        // "version" must be formatted as "x.y"
        //   where "x" and "y" are both non-negative integers
        const check = (str) => {
            const temp = str.split(".");
            return (temp.length === 2 && fnIsInteger(temp[0]) && fnIsInteger(temp[1]));
        };
        if (check(version) !== true){
            return "'version' PROPERTY MUST BE A VALID CONFIGURATION FILE VERSION";
        }

        // the current version of easy-samba supports only "1.0" config files
        if (version !== "1.0"){
            return "THIS CONFIGURATION FILE USES FEATURES THAT REQUIRE EASY-SAMBA VERSION '" + version + "' OR NEWER";
        }

        return true;
    }
}




