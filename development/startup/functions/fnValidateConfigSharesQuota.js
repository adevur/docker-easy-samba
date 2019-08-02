


// exports
module.exports = fnValidateConfigSharesQuota;



// dependencies
const assert = require("assert");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsArray = require("/startup/functions/fnIsArray.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnValidateString = require("/startup/functions/fnValidateString.js");
const fnRemoveDuplicates = require("/startup/functions/fnRemoveDuplicates.js");



// TODO: description
// TODO: EXPLAIN
function fnValidateConfigSharesQuota(share, sharedb){
    try {
        // "soft-quota" is optional
        if (fnHas(share, "soft-quota") !== true){
            return true;
        }
        
        const quota = share["soft-quota"];

        // must have "limit" and "whitelist" properties
        assert( fnHas(quota, ["limit", "whitelist"]) );
        
        // check "limit" property
        assert( fnIsString(quota["limit"]) && quota["limit"].length > 2 && quota["limit"].length < 12 );
        const unit = quota["limit"].slice(quota["limit"].length - 2, quota["limit"].length);
        assert( ["kB", "MB", "GB"].includes(unit) );
        let limitRaw = quota["limit"].slice(0, quota["limit"].length - 2);
        assert( fnValidateString(limitRaw, ["09"]) );
        limitRaw = parseInt(limitRaw, 10);
        let limitBytes = 0;
        limitBytes = (unit === "kB") ? (limitRaw * 1024) : limitBytes;
        limitBytes = (unit === "MB") ? (limitRaw * 1024 * 1024) : limitBytes;
        limitBytes = (unit === "GB") ? (limitRaw * 1024 * 1024 * 1024) : limitBytes;
        
        // check "whitelist" property
        assert( fnIsArray(quota["whitelist"]) );
        let whitelist = [];
        assert(quota["whitelist"].every((e) => {
            if (fnIsString(e) !== true){
                return false;
            }
        
            if (e === "nobody"){
                whitelist.push("nobody");
                return true;
            }
            else if (sharedb.users.includes(e)){
                whitelist.push(e);
                return true;
            }
            else if (fnHas(sharedb.groups, e)){
                whitelist = whitelist.concat(sharedb.groups[e]);
                return true;
            }
            else {
                return false;
            }
        }));
        
        // remove duplicates from "whitelist"
        whitelist = fnRemoveDuplicates(whitelist);
        
        // add "$soft-quota" to "share"
        share["$soft-quota"] = { "limit": limitBytes, "whitelist": whitelist };
        
        return true;
    }
    catch (error){
        return `SHARE '${share["path"]}' HAS AN INVALID SOFT-QUOTA`;
    }
}












