


// exports
module.exports = fnValidateConfigSharesAccess;



// dependencies
const fnHas = require("/startup/functions/fnHas.js");
const fnIsArray = require("/startup/functions/fnIsArray.js");



// TODO: description
// TODO: EXPLAIN
function fnValidateConfigSharesAccess(share, sharedb){
    const access = share["access"];

    // must be an array
    if (fnIsArray(access) !== true){
        return `PROPERTY 'access' OF SHARE '${share["name"]}' MUST BE AN ARRAY`;
    }

    // must contain only users or groups defined early in config["users"] and config["groups"]
    // users and groups can be prefixed with "rw:", "ro:" or "no:"
    // access rule "*" means "all users" and it can be prefixed with "rw:", "ro:" or "no:"
    const check = access.every((rule) => {
        if (rule.startsWith("rw:") || rule.startsWith("ro:") || rule.startsWith("no:")){
            if (rule.length > 3){
                if (rule.substring(3) === "*" || sharedb.users.includes(rule.substring(3)) || fnHas(sharedb.groups, rule.substring(3))){
                    return true;
                }
            }
        }
        else if (rule.length > 0 && (rule === "*" || sharedb.users.includes(rule) || fnHas(sharedb.groups, rule))){
            return true;
        }

        return false;
    });

    if (check !== true){
        return `ONE OR MORE ACCESS RULES OF SHARE '${share["name"]}' ARE NOT VALID`;
    }

    return true;
}












