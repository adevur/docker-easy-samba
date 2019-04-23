


// exports
module.exports = fnListUsers;



// dependencies
const fs = require("fs");



// FUNCTION: fnListUsers()
// OUTPUT: an array with the users of the current OS
// PURPOSE: get all the users of the current OS
// TODO: algorithm could be improved, but for now it should work for every future release of "centos:7" docker image
function fnListUsers(){
    const passwd = fs.readFileSync("/etc/passwd", "utf8");

    return passwd.split("\n").map((e) => {
        return e.split(":")[0];
    });
}
