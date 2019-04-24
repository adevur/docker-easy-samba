


// exports
module.exports = fnEvaluateAccessRules;



// dependencies
const fnHas = require("/startup/functions/fnHas.js");



// TODO: description
// TODO: EXPLAIN
function fnEvaluateAccessRules(share, sharedb){
    share["users"] = [];

    share["access"].forEach((rule) => {
        let users = undefined;
        if (fnGetRawName(rule) === "*"){
            users = sharedb.users;
        }
        else if (fnIsGroup(rule, sharedb)){
            users = sharedb.groups[fnGetRawName(rule)];
        }
        else {
            users = [fnGetRawName(rule)];
        }
        const perm = fnGetPerm(rule);

        users.forEach((user) => {
            fnDelUser(share, user);
            if (perm !== "no:"){
                share["users"].push(perm + user);
            }
        });
    });
}



function fnGetRawName(rule){
    if (rule.startsWith("ro:") || rule.startsWith("rw:") || rule.startsWith("no:")){
        return rule.substring(3);
    }
    else {
        return rule;
    }
}



function fnIsGroup(name, sharedb){
    return fnHas(sharedb.groups, fnGetRawName(name));
}



// EXAMPLE:
//   fnGetPerm("rw:user1") === "rw:"
//   fnGetPerm("ro:user2") === "ro:"
//   fnGetPerm("no:user3") === "no:"
//   fnGetPerm("user4") === "rw:"
function fnGetPerm(rule){
    return (rule === fnGetRawName(rule)) ? "rw:" : rule.substring(0, 3);
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









