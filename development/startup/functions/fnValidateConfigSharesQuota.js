


// exports
module.exports = fnValidateConfigSharesQuota;



// dependencies
const assert = require("assert");
const fnHas = require("/startup/functions/fnHas.js");
const fnIsArray = require("/startup/functions/fnIsArray.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnValidateString = require("/startup/functions/fnValidateString.js");



// TODO: description
// TODO: EXPLAIN
function fnValidateConfigSharesQuota(share, sharedb){
    try {
        // "soft-quota" is optional
        if (fnHas(share, "soft-quota") !== true){
            return true;
        }

        const quota = share["soft-quota"];

        // must have "limit" property
        assert( fnHas(quota, "limit") );
        
        // check "limit" property
        assert( fnIsString(quota["limit"]) && quota["limit"].length > 2 && quota["limit"].length < 12 );
        assert( quota["limit"].endsWith("kB") || quota["limit"].endsWith("MB") || quota["limit"].endsWith("GB") );
        let n = quota["limit"].slice(0, quota["limit"].length - 2);
        assert( fnValidateString(n, ["09"]) );
        n = parseInt(n, 10);
        const u = quota["limit"].slice(quota["limit"].length - 2, quota["limit"].length);
        const m = (u === "kB") ? (n * 1024) : ((u === "MB") ? (n * 1024 * 1024) : ((u === "GB") ? (n * 1024 * 1024 * 1024) : 0));
        
        // check "whitelist" property
        if (fnHas(quota, "whitelist")){
            assert( fnIsArray(quota["whitelist"]) );
            assert(quota["whitelist"].every((e) => {
                return sharedb.users.includes(e);
            }));
            // remove duplicates from "whitelist"
            quota["whitelist"] = quota["whitelist"].filter((e, i) => {
                return (quota["whitelist"].indexOf(e) === i);
            });
        }
        else {
            quota["whitelist"] = [];
        }
        
        // add soft-quota to sharedb
        sharedb.quota.push({ "path": share["path"], "soft-quota": { "limit": m, "whitelist": quota["whitelist"] } });
        
        return true;
    }
    catch (error){
        return `SHARE '${share["path"]}' HAS AN INVALID SOFT-QUOTA`;
    }
}












