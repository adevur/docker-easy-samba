


// exports
module.exports = fnValidateConfigUsers;



// dependencies
const fnHas = require("/startup/functions/fnHas.js");
const fnIsString = require("/startup/functions/fnIsString.js");
const fnIsArray = require("/startup/functions/fnIsArray.js");
const fnIsValidUsername = require("/startup/functions/fnIsValidUsername.js");
const fnIsValidPassword = require("/startup/functions/fnIsValidPassword.js");
const fnUserExists = require("/startup/functions/fnUserExists.js");



// FUNCTION: fnValidateConfigUsers()
// TODO: write a brief description of this function
function fnValidateConfigUsers(users, sharedb){
    // "users" must be an array (it can be empty)
    if (fnIsArray(users) !== true){
        return "'users' MUST BE AN ARRAY";
    }

    let error = "";

    const result = users.every((user) => {
        // "user" must have "name" and "password" properties
        if (fnHas(user, ["name", "password"]) !== true){
            error = "USERS IN 'users' MUST HAVE 'name' AND 'password' PROPERTIES";
            return false;
        }

        // "username" and "password" must be strings
        if (fnIsString(user["name"]) !== true || fnIsString(user["password"]) !== true){
            error = "USER 'name' AND 'password' PROPERTIES MUST BE STRINGS";
            return false;
        }

        // "username" must be a valid username
        if (fnIsValidUsername(user["name"]) !== true){
            error = "THERE IS A USERNAME DEFINED IN 'users' THAT IS NOT VALID";
            return false;
        }

        // "password" must be a valid password
        if (fnIsValidPassword(user["password"]) !== true){
            error = "THERE IS A PASSWORD DEFINED IN 'users' THAT IS NOT VALID";
            return false;
        }

        // user must not exist in the OS
        if (fnUserExists(user["name"])){
            error = "USER '" + user["name"] + "' ALREADY EXISTS IN THE OS";
            return false;
        }

        // user must be unique in config.json
        if (sharedb.users.includes(user["name"])){
            error = "USER '" + user["name"] + "' HAS BEEN DEFINED MORE THAN ONCE";
            return false;
        }

        sharedb.users.push(user["name"]); // TODO: EXPLAIN

        return true;
    });

    if (result !== true){
        return error;
    }

    return true;
}



