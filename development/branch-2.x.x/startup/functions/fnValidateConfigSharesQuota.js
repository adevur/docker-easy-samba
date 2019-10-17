


// exports
module.exports = fnValidateConfigSharesQuota;



// dependencies
const fnRemoveDuplicates = require("/startup/functions/fnRemoveDuplicates.js");
const { valid, substring, isDigit, isArray, isIncludedIn, isPropOf } = require("/startup/functions/valid.js");



// TODO: description
// TODO: EXPLAIN
function fnValidateConfigSharesQuota(sharedb){
    return { inCase: { has: "soft-quota" }, check: [
        { always: true, doo: (share) => { sharedb["$sqwl"] = []; } },
        {
            prop: "soft-quota",
            check: [
                { has: ["limit", "whitelist"] },
                { prop: "limit", strLength: { between: [3, 11] } },
                { prop: "limit", post: substring(-2), either: ["kB", "MB", "GB"], doo: (e) => { sharedb["$squ"] = e; } },
                { prop: "limit", post: substring(0, -3), check: isDigit, doo: (e) => { sharedb["$sqlr"] = parseInt(e, 10); } },
                { prop: "whitelist", check: isArray },
                { prop: "whitelist", every: { either: [
                    { check: "nobody", doo: () => { sharedb["$sqwl"].push("nobody"); } },
                    { check: isIncludedIn(sharedb.users), doo: (e) => { sharedb["$sqwl"].push(e); } },
                    { check: isPropOf(sharedb.groups), doo: (e) => { sharedb["$sqwl"] = sharedb["$sqwl"].concat(sharedb.groups[e]); } }
                ] } }
            ]
        }
    ], doo: (share) => {
        share["$soft-quota"] = {};
        
        let limitBytes = 0;
        limitBytes = (sharedb["$squ"] === "kB") ? (sharedb["$sqlr"] * 1024) : limitBytes;
        limitBytes = (sharedb["$squ"] === "MB") ? (sharedb["$sqlr"] * 1024 * 1024) : limitBytes;
        limitBytes = (sharedb["$squ"] === "GB") ? (sharedb["$sqlr"] * 1024 * 1024 * 1024) : limitBytes;
        
        share["$soft-quota"]["limit"] = limitBytes;
        share["$soft-quota"]["whitelist"] = fnRemoveDuplicates(sharedb["$sqwl"]);
        
        delete sharedb["$squ"];
        delete sharedb["$sqlr"];
        delete sharedb["$sqwl"];
    }, error: share => `SHARE '${share["path"]}' HAS AN INVALID SOFT-QUOTA` };
}












