


// exports
module.exports = fnValidateConfigUsers;



// dependencies
const { valid, isArray, isString, isIncludedIn } = require("/startup/functions/valid.js");
const isValidUsername = require("/startup/functions/isValidUsername.js");
const isValidPassword = require("/startup/functions/isValidPassword.js");
const fnListUsers = require("/startup/functions/fnListUsers.js");
const fnListGroups = require("/startup/functions/fnListGroups.js");



// FUNCTION: fnValidateConfigUsers()
// TODO: write a brief description of this function
function fnValidateConfigUsers(sharedb){
    const isValidUser = {
        check: [
            { has: ["name", "password"], error: `USERS IN 'users' MUST HAVE 'name' AND 'password' PROPERTIES` },
            { prop: ["name", "password"], every: isString, error: `USER 'name' AND 'password' PROPERTIES MUST BE STRINGS` },
            { prop: "name", check: isValidUsername, error: `THERE IS A USERNAME DEFINED IN 'users' THAT IS NOT VALID` },
            { prop: "password", check: isValidPassword, error: `THERE IS A PASSWORD DEFINED IN 'users' THAT IS NOT VALID` },
            { prop: "name", not: isIncludedIn(fnListUsers()), error: username => `USER '${username}' ALREADY EXISTS IN THE OS` },
            { prop: "name", not: isIncludedIn(fnListGroups()), error: username => `USER '${username}' ALREADY EXISTS IN THE OS AS A GROUP` },
            { prop: "name", not: isIncludedIn(sharedb.users), error: username => `USER '${username}' HAS BEEN DEFINED MORE THAN ONCE` }
         ],
         doo: (user) => { sharedb.users.push(user["name"]); }
    };

    return [
        { check: isArray, error: `'users' MUST BE AN ARRAY` },
        { every: isValidUser }
    ];
}



