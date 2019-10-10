


// exports
module.exports = fnValidateConfigGroups;



// dependencies
const fnHas = require("/startup/functions/fnHas.js");
const fnIsArray = require("/startup/functions/fnIsArray.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnIsValidUsername = require("/startup/functions/fnIsValidUsername.js");
const fnListUsers = require("/startup/functions/fnListUsers.js");
const fnListGroups = require("/startup/functions/fnListGroups.js");
const fnRemoveDuplicates = require("/startup/functions/fnRemoveDuplicates.js");



// FUNCTION: fnValidateConfigGroups()
// TODO: write a brief description of this function
function fnValidateConfigGroups(config, sharedb){
    // config["groups"] is optional
    if (fnHas(config, "groups") !== true){
        return true;
    }

    const groups = config["groups"];

    // "groups" must be a non-empty array
    if (fnIsArray(groups) !== true || groups.length < 1){
        return `'groups' MUST BE A NON-EMPTY ARRAY`;
    }

    // foreach "group" in "groups"...
    let error = "";
    const result = groups.every((group) => {
        // "group" must have "name" and "members" properties
        if (fnHas(group, ["name", "members"]) !== true){
            error = `GROUPS IN 'groups' MUST HAVE 'name' AND 'members' PROPERTIES`;
            return false;
        }

        // "name" must be a valid group name (it follows the same validation rules of usernames)
        if (fnIsString(group["name"]) !== true || fnIsValidUsername(group["name"]) !== true){
            error = `THERE IS A GROUP NAME DEFINED IN 'groups' THAT IS NOT VALID`;
            return false;
        }

        // group must not exist in the OS
        if (fnListGroups().includes(group["name"])){
            error = `GROUP '${group["name"]}' ALREADY EXISTS IN THE OS`;
            return false;
        }

        // group must not exist in the OS as a user
        if (fnListUsers().includes(group["name"])){
            error = `GROUP NAME '${group["name"]}' ALREADY EXISTS IN THE OS AS A USER`;
            return false;
        }

        // group name must be unique in config.json
        if (sharedb.users.includes(group["name"]) || fnHas(sharedb.groups, group["name"])){
            error = `GROUP NAME '${group["name"]}' HAS BEEN USED MORE THAN ONCE`;
            return false;
        }

        // "members" must be a non-empty array
        if (fnIsArray(group["members"]) !== true || group["members"].length < 1){
            error = `'members' PROPERTY OF GROUP '${group["name"]}' MUST BE A NON-EMPTY ARRAY`;
            return false;
        }

        // all elements of group["members"] must have been defined earlier in config["users"] or in config["groups"]
        const check = group["members"].every((member) => {
            return (fnIsString(member) && (sharedb.users.includes(member) || fnHas(sharedb.groups, member)));
        });
        if (check !== true){
            error = `GROUP '${group["name"]}' CONTAINS USERS OR GROUPS THAT HAVE NOT BEEN DEFINED IN 'config.json'`;
            return false;
        }

        // calculate all the members of group
        // in case an element of group["members"] is a group, retrieve all the members of that group
        let members = [];
        group["members"].forEach((member) => {
            if (sharedb.users.includes(member)){
                members.push(member);
            }
            else if (fnHas(sharedb.groups, member)){
                members = members.concat(sharedb.groups[member]);
            }
        });
        members = fnRemoveDuplicates(members);

        // put group into sharedb
        sharedb.groups[group["name"]] = members; // TODO: EXPLAIN

        return true;
    });

    if (result !== true){
        return error;
    }

    return true;
}



