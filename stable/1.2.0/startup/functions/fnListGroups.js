


// exports
module.exports = fnListGroups;



// dependencies
const fs = require("fs");



// FUNCTION: fnListGroups()
// OUTPUT: an array with the groups of the current OS
// PURPOSE: get all the groups of the current OS
// TODO: algorithm could be improved, but for now it should work for every future release of "centos:7" docker image
function fnListGroups(){
    const groups = fs.readFileSync("/etc/group", "utf8");

    // delete all lines that are not valid (e.g. empty lines)
    // TODO: not really correct, but it does work
    const lines = groups.split("\n").filter((line) => {
        return line.includes(":");
    });
    
    return lines.map((e) => {
        return e.split(":")[0];
    });
}
