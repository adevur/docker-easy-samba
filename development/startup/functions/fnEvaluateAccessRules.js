


// exports
module.exports = fnEvaluateAccessRules;



// dependencies
const fnHas = require("/startup/functions/fnHas.js");



// TODO: description
// TODO: EXPLAIN
function fnEvaluateAccessRules(share, sharedb){
    share["users"] = [];

    share["access"].forEach((rule) => {
        if (fnIsGroup(rule, sharedb)){
            const users = sharedb.groups[fnGetRawName(rule)];
            const perm = fnGetPerm(rule);

            users.forEach((user) => {
                fnDelUser(share, user);
                share["users"].push(perm + user);
            });
        }
        else {
            const user = fnGetRawName(rule);
            const perm = fnGetPerm(rule);

            fnDelUser(share, user);
            share["users"].push(perm + user);
        }
    });
}



function fnGetRawName(rule){
    if (rule.startsWith("ro:") || rule.startsWith("rw:")){
        return rule.substring(3);
    }
    else {
        return rule;
    }
}



function fnIsGroup(name, sharedb){
    return fnHas(sharedb.groups, fnGetRawName(name));
}



function fnGetPerm(rule){
    return (rule.startsWith("ro:")) ? "ro:" : "rw:";
}



function fnDelUser(share, user){
    let pos = -1;

    pos = share["users"].indexOf("ro:" + user);
    if (pos >= 0){
        share["users"].splice(pos, 1);
    }

    pos = share["users"].indexOf("rw:" + user);
    if (pos >= 0){
        share["users"].splice(pos, 1);
    }
}









