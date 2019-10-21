


// exports
module.exports = fnAuth;



// dependencies
const { voodoo } = require("/startup/functions/valid.js");
const { spawnSync } = require("child_process");



function fnAuth(config, username, password){
    let enabledAPI = undefined;
    let userType = undefined;

    const localCreds = {
        check: [
            { prop: "$type", check: "local" },
            { prop: "name", check: username },
            { prop: "password", check: password }
        ],
        doo: (user) => { enabledAPI = user["enabled-api"]; userType = "local"; }
    };
    
    const ldapUserCreds = {
        check: [
            { prop: "$type", check: "ldapUser" },
            { inCase: { has: "name" }, prop: "name", check: username },
            { inCase: { not: { has: "name" } }, prop: "ldap-user", check: username },
            (user) => { return fnLdapBind(config["$ldap"], user["ldap-user"], password); }
        ],
        doo: (user) => { enabledAPI = user["enabled-api"]; userType = "ldapUser"; }
    };
    
    const ldapGroupCreds = {
        check: [
            { prop: "$type", check: "ldapGroup" },
            () => { return fnLdapBind(config["$ldap"], username, password); },
            (group) => { return fnLdapMemberOf(config["$ldap"], username, password, group["ldap-group"]); }
        ],
        doo: (group) => { enabledAPI = group["enabled-api"]; userType = "ldapGroup"; }
    };

    const validCreds = { prop: "users", some: { either: [localCreds, ldapUserCreds, ldapGroupCreds] } };

    let result = { res: false, enabledAPI: [], userType: undefined };

    voodoo(config, validCreds).yay(() => {
        if (userType === "local"){
            result = { res: true, enabledAPI: enabledAPI, userType: userType };
        }
        else if (userType === "ldapUser"){
            result = { res: true, enabledAPI: enabledAPI, userType: userType };
        }
        else if (userType === "ldapGroup"){
            result = { res: true, enabledAPI: enabledAPI, userType: userType };
        }
    });
    
    return result;
}



function fnLdapMemberOf(ldap, username, password, groupname){
    const prependU = ldap.usernamePrepend;
    const appendU = ldap.usernameAppend;
    const prependG = ldap.groupPrepend.toLowerCase();
    const appendG = ldap.groupAppend.toLowerCase();
    const result = spawnSync("ldapsearch", ["-H", `${ldap.protocol}://${ldap.hostname}:${ldap.port}`, "-x", "-w", password, "-D", `${prependU}${username}${appendU}`, "-b", ldap.searchBase], { stdio: ["ignore", undefined, "ignore"] });
    return result.stdout.toString("utf8").toLowerCase().includes(`dn: ${prependG}${groupname.toLowerCase()}${appendG}\n`);
}



function fnLdapBind(ldap, username, password){
    const prependU = ldap.usernamePrepend;
    const appendU = ldap.usernameAppend;
    const result = spawnSync("ldapsearch", ["-H", `${ldap.protocol}://${ldap.hostname}:${ldap.port}`, "-x", "-w", password, "-D", `${prependU}${username}${appendU}`, "-b", ldap.searchBase], { stdio: "ignore" });
    return result.status === 0;
}







