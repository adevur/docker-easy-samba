


// exports
module.exports = fnAuth;



// dependencies
const { voodoo, isArray, isString } = require("/startup/functions/valid.js");
const { spawnSync } = require("child_process");
const assert = require("assert");
const fnRemoveDuplicates = require("/startup/functions/fnRemoveDuplicates.js");



function fnAuth(config, username, password){
    let ldapUser = undefined;
    let ldapGroup = undefined;
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
        doo: (user) => { ldapUser = user["ldap-user"]; enabledAPI = user["enabled-api"]; userType = "ldapUser"; }
    };
    
    const ldapGroupCreds = {
        check: [
            { prop: "$type", check: "ldapGroup" },
            () => { return fnLdapBind(config["$ldap"], username, password); },
            (group) => { return fnLdapMemberOf(config["$ldap"], username, password, group["ldap-group"]); }
        ],
        doo: (group) => { ldapUser = username; ldapGroup = group["ldap-group"]; enabledAPI = group["enabled-api"]; userType = "ldapGroup"; }
    };

    const validCreds = { prop: "users", some: { either: [localCreds, ldapUserCreds, ldapGroupCreds] } };

    let result = { res: false, enabledAPI: [], userType: undefined };

    voodoo(config, validCreds).yay(() => {
        if (userType === "local"){
            result = { res: true, enabledAPI: enabledAPI, userType: userType };
        }
        else if (userType === "ldapUser"){
            enabledAPI = isArray(enabledAPI) ? enabledAPI : fnLdapGetUserEnabledAPI(config, ldapUser, password, enabledAPI.substring(10));
            enabledAPI.push("hello");
            enabledAPI = fnRemoveDuplicates(enabledAPI);
            result = { res: true, enabledAPI: enabledAPI, userType: userType, ldapUser: ldapUser };
        }
        else if (userType === "ldapGroup"){
            enabledAPI = isArray(enabledAPI) ? enabledAPI : fnLdapGetGroupEnabledAPI(config, ldapUser, password, ldapGroup, enabledAPI.substring(10)).concat(fnLdapGetUserEnabledAPI(config, ldapUser, password, enabledAPI.substring(10)));
            enabledAPI.push("hello");
            enabledAPI = fnRemoveDuplicates(enabledAPI);
            result = { res: true, enabledAPI: enabledAPI, userType: userType, ldapUser: ldapUser, ldapGroup: ldapGroup };
        }
    });
    
    return result;
}



function fnLdapGetAttr(ldap, username, password, filter, searchBase, attrName){
    const replaceUsername = input => input.toLowerCase().replace("%username%", username);

    const bind = {
        username: replaceUsername(ldap.bindOptions.username),
        searchBase: replaceUsername(ldap.bindOptions.searchBase)
    };
    
    const result = spawnSync("ldapsearch", ["-H", `${ldap.protocol}://${ldap.hostname}:${ldap.port}`, "-x", "-w", password, "-D", bind.username, "-b", searchBase, "-LLL", filter, attrName], { stdio: ["ignore", undefined, "ignore"] });
    
    if (result.status !== 0){
        return undefined;
    }
    
    let attrValue = undefined;
    result.stdout.toString("utf8").toLowerCase().split("\n").forEach((e) => {
        if (e.startsWith(`${attrName.toLowerCase()}: `)){
            attrValue = e.substring(attrName.length + 2);
        }
    });
    
    return attrValue;
}



function fnLdapGetUserEnabledAPI(config, username, password, attrName){
    const ldap = config["$ldap"];
    const replaceUsername = input => input.toLowerCase().replace("%username%", username);

    try {
        const userDN = isString(ldap.userDN) ? replaceUsername(ldap.userDN) : fnLdapGetAttr(ldap, username, password, replaceUsername(ldap.userDN.filter), replaceUsername(ldap.userDN.searchBase), "dn");
        assert( isString(userDN) );
        const attrValue = fnLdapGetAttr(ldap, username, password, "(&)", userDN, attrName);
        
        assert( isString(attrValue) );
        assert( attrValue === "*" || attrValue === "" || attrValue.split(",").every(e => config["$METHODS"].includes(e)) );
        return (attrValue === "*") ? config["$METHODS"] : fnRemoveDuplicates(attrValue.split(","));
    }
    catch (error){
        return [];
    }
}



function fnLdapGetGroupEnabledAPI(config, username, password, groupname, attrName){
    const ldap = config["$ldap"];
    const replaceGroupname = input => input.toLowerCase().replace("%groupname%", groupname);

    try {
        const groupDN = isString(ldap.groupDN) ? replaceGroupname(ldap.groupDN) : fnLdapGetAttr(ldap, username, password, replaceGroupname(ldap.groupDN.filter), replaceGroupname(ldap.groupDN.searchBase), "dn");
        assert( isString(groupDN) );
        const attrValue = fnLdapGetAttr(ldap, username, password, "(&)", groupDN, attrName);
        
        assert( isString(attrValue) );
        assert( attrValue === "*" || attrValue === "" || attrValue.split(",").every(e => config["$METHODS"].includes(e)) );
        return (attrValue === "*") ? config["$METHODS"] : fnRemoveDuplicates(attrValue.split(","));
    }
    catch (error){
        return [];
    }
}



function fnLdapMemberOf(ldap, username, password, groupname){
    const replaceUsername = input => input.toLowerCase().replace("%username%", username);
    const replaceGroupname = input => input.toLowerCase().replace("%groupname%", groupname);

    const bind = {
        username: replaceUsername(ldap.bindOptions.username),
        searchBase: replaceUsername(ldap.bindOptions.searchBase)
    };
    
    const userDN = isString(ldap.userDN) ? replaceUsername(ldap.userDN) : fnLdapGetAttr(ldap, username, password, replaceUsername(ldap.userDN.filter), replaceUsername(ldap.userDN.searchBase), "dn");
    const groupDN = isString(ldap.groupDN) ? replaceGroupname(ldap.groupDN) : fnLdapGetAttr(ldap, username, password, replaceGroupname(ldap.groupDN.filter), replaceGroupname(ldap.groupDN.searchBase), "dn");
    
    if ([userDN, groupDN].every(isString) !== true){
        return false;
    }
    
    const result = spawnSync("ldapsearch", ["-H", `${ldap.protocol}://${ldap.hostname}:${ldap.port}`, "-x", "-w", password, "-D", bind.username, "-b", userDN, "-LLL", "(&)", "memberOf"], { stdio: ["ignore", undefined, "ignore"] });
    return result.status === 0 && result.stdout.toString("utf8").toLowerCase().includes(`memberof: ${groupDN.toLowerCase()}\n`);
}



function fnLdapBind(ldap, username, password){
    const replaceUsername = input => input.toLowerCase().replace("%username%", username);

    const bind = {
        username: replaceUsername(ldap.bindOptions.username),
        searchBase: replaceUsername(ldap.bindOptions.searchBase)
    };
    
    const result = spawnSync("ldapsearch", ["-H", `${ldap.protocol}://${ldap.hostname}:${ldap.port}`, "-x", "-w", password, "-D", bind.username, "-b", bind.searchBase], { stdio: "ignore" });
    return result.status === 0;
}







