


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

    // delete all lines that are not valid (e.g. empty lines)
    // TODO: not really correct, but it does work
    const lines = passwd.split("\n").filter((line) => {
        return line.includes(":");
    });

    return lines.map((e) => {
        return e.split(":")[0];
    });
}
