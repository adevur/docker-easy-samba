


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
        const u = quota["limit"].slice(quota["limit"].length - 2, quota["limit"].length);
        assert( ["kB", "MB", "GB"].includes(u) );
        let n = quota["limit"].slice(0, quota["limit"].length - 2);
        assert( fnValidateString(n, ["09"]) );
        n = parseInt(n, 10);
        let m = 0;
        m = (u === "kB") ? (n * 1024) : m;
        m = (u === "MB") ? (n * 1024 * 1024) : m;
        m = (u === "GB") ? (n * 1024 * 1024 * 1024) : m;
        
        // check "whitelist" property
        assert( fnIsArray(quota["whitelist"]) );
        assert( quota["whitelist"].every(fnIsString) );
        assert(quota["whitelist"].every((e) => {
            return sharedb.users.includes(e);
        }));
        // remove duplicates from "whitelist"
        quota["whitelist"] = fnRemoveDuplicates(quota["whitelist"]);
        
        // add "$soft-quota" to "share"
        share["$soft-quota"] = { "limit": m, "whitelist": quota["whitelist"] };
        
        return true;
    }
    catch (error){
        return `SHARE '${share["path"]}' HAS AN INVALID SOFT-QUOTA`;
    }
}












