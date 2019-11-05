


// exports
module.exports = fnValidateConfigSharesAccess;



// dependencies
const { startsWith, isIncludedIn, isPropOf, substring, isArray } = require("/startup/functions/valid.js");



// TODO: description
// TODO: EXPLAIN
function fnValidateConfigSharesAccess(sharedb){
    const isValidRule = { either: [
        [
            { either: [startsWith("rw:"), startsWith("ro:"), startsWith("no:")] },
            [
                { length: { greater: 3 } },
                { pre: substring(3), either: ["*", isIncludedIn(sharedb.users), isPropOf(sharedb.groups)] }
            ]
        ],
        [
            { not: { either: [startsWith("rw:"), startsWith("ro:"), startsWith("no:")] } },
            [
                { length: { greater: 0 } },
                { either: ["*", isIncludedIn(sharedb.users), isPropOf(sharedb.groups)] }
            ]
        ],
    ] };

    return [
        // "access" property must be an array
        { check: { prop: "access", check: isArray }, error: share => `PROPERTY 'access' OF SHARE '${share["name"]}' MUST BE AN ARRAY` },
        // "access" property must contain only users or groups defined early in config["users"] and config["groups"],
        //   users and groups can be prefixed with "rw:", "ro:" or "no:",
        //   access rule "*" means "all users" and it can be prefixed with "rw:", "ro:" or "no:"
        { check: { prop: "access", every: isValidRule }, error: share => `ONE OR MORE ACCESS RULES OF SHARE '${share["name"]}' ARE NOT VALID` }
    ];
}












