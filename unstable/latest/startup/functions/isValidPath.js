


// dependencies
const { valid, isNEString } = require("/startup/functions/valid.js");



// TEST: isValidPath
// INPUT: "path" is the string to validate
// PURPOSE: check that a given string is a valid samba path
//   it doesn't check if "path" exists on disk, that's not its purpose
// EXPLAIN:
//   a valid path is a string that can contain every Unicode char except for:
//     "/", "\", "<", ">", ":", "\"", "|", "?", "*" and "\0"
//   "path" cannot contain any char with code between 1 and 31, or with code 127
//   also, "path" cannot be "." or ".."
//   max length of directory name must be 255 chars
// SOURCE: https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file
module.exports = [
    { check: isNEString, error: "path must be a non-empty string" },
    // "str" cannot contain "/", "\", "<", ">", ":", "\"", "|", "?", "*" or "\0"
    { not: { some: { either: [`/`, `\\`, `<`, `>`, `:`, `"`, `|`, `?`, `*`, `\u0000`] } } },
    // "str" cannot contain any char with code between 1 and 31, or with code 127
    { every: { charcode: [
        { not: 127 },
        { not: { between: [1, 31] } }
    ] } },
    { length: { lessEq: 255 }, error: "path length cannot be greater than 255 chars" },
    { not: { either: [".", ".."] }, error: "path cannot be '.' or '..'" }
];



