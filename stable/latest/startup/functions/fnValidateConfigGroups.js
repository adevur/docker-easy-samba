


// exports
module.exports = fnValidateConfigGroups;



// dependencies
const fnHas = require("/startup/functions/fnHas.js");



// FUNCTION: fnValidateConfigGroups()
// TODO: write a brief description of this function
function fnValidateConfigGroups(config, sharedb){
    // config["groups"] is optional
    if (fnHas(config, "groups")){
        // TODO: config["groups"] must be an array of elements like {"name": "group1", "users": ["user1", "user2"]}

        // TODO: a group name must follow the same rules of usernames; cannot exist a group and a user with the same name

        // put groups into sharedb
        config["groups"].forEach((group) => {
            sharedb.groups[group["name"]] = group["users"];
        });

        return true;
    }

    return true;
}



