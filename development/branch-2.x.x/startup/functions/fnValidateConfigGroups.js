


// exports
module.exports = fnValidateConfigGroups;



// dependencies
const fnHas = require("/startup/functions/fnHas.js");
const isValidUsername = require("/startup/functions/isValidUsername.js");
const fnListUsers = require("/startup/functions/fnListUsers.js");
const fnListGroups = require("/startup/functions/fnListGroups.js");
const fnRemoveDuplicates = require("/startup/functions/fnRemoveDuplicates.js");
const { valid, isIncludedIn, isPropOf } = require("/startup/functions/valid.js");



// FUNCTION: fnValidateConfigGroups()
// TODO: write a brief description of this function
function fnValidateConfigGroups(config, sharedb){
    const isAlreadyUsed = { either: [isIncludedIn(sharedb.users), isPropOf(sharedb.groups)] };

    const isValidGroup = {
        check: [
            { has: ["name", "members"], error: `GROUPS IN 'groups' MUST HAVE 'name' AND 'members' PROPERTIES` },
            { prop: "name", check: isValidUsername, error: `THERE IS A GROUP NAME DEFINED IN 'groups' THAT IS NOT VALID` },
            { prop: "name", not: isIncludedIn(fnListGroups()), error: groupname => `GROUP '${groupname}' ALREADY EXISTS IN THE OS` },
            { prop: "name", not: isIncludedIn(fnListUsers()), error: groupname => `GROUP '${groupname}' ALREADY EXISTS IN THE OS AS A USER` },
            { prop: "name", not: isAlreadyUsed, error: groupname => `GROUP NAME '${groupname}' HAS BEEN USED MORE THAN ONCE` },
            {
                check: { prop: "members", arrLength: { greater: 0 } },
                error: group => `'members' PROPERTY OF GROUP '${group["name"]}' MUST BE A NON-EMPTY ARRAY`
            },
            {
                check: { prop: "members", every: isAlreadyUsed },
                error: group => `GROUP '${group["name"]}' CONTAINS USERS OR GROUPS THAT HAVE NOT BEEN DEFINED IN 'config.json'`
            }
        ],
        doo: (group) => {
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
            sharedb.groups[group["name"]] = members;
        }
    };

    const isValidGroupsProperty = [
        { arrLength: { greater: 0 }, error: `'groups' MUST BE A NON-EMPTY ARRAY` },
        { every: isValidGroup }
    ];

    const test = {
        inCase: { has: "groups" },
        prop: "groups",
        check: isValidGroupsProperty
    };

    return valid(config, test);
}



