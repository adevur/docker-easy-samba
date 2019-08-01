


// exports
module.exports = fnValidateConfigGlobal;



// dependencies
const log = require("/startup/functions/fnLog.js")("/share/config/easy-samba.logs");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnIsArray = require("/startup/functions/fnIsArray.js");



// FUNCTION: fnValidateConfigGlobal()
// TODO: write a brief description of this function
function fnValidateConfigGlobal(config){
    // "global" property is optional
    if (fnHas(config, "global") !== true){
        return true;
    }
    
    // "global" property is deprecated
    log(`[WARNING] 'global' section is deprecated.`);

    // "global" must be a non-empty array
    if (fnIsArray(config["global"]) !== true || config["global"].length < 1){
        return `'global' MUST BE A NON-EMPTY ARRAY`;
    }

    // "global" must be an array of non-empty strings
    const check = config["global"].every((elem) => {
        return (fnIsString(elem) && elem.length > 0);
    });
    if (check !== true){
        return `ALL ELEMENTS OF 'global' ARRAY MUST BE NON-EMPTY STRINGS`;
    }

    return true;
}



