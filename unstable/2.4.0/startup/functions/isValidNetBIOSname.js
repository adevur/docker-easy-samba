


// dependencies
const { isASCII, isAlphaNum, firstChars, lastChars, isDigit, substring } = require("/startup/functions/valid.js");



// TEST: isValidNetBIOSname
// INPUT: name to validate
// PURPOSE: check that a given name is a valid NetBIOS Name
// SOURCE: https://en.wikipedia.org/wiki/NetBIOS#NetBIOS_name
module.exports = [
    { check: isASCII, error: "name must be an ASCII string" },
    { length: { between: [1, 15] }, error: "name's length must be between 1 and 15 chars" },
    { pre: firstChars(1), check: isAlphaNum, error: "name's first char must be alphanumeric" },
    { pre: lastChars(1), check: isAlphaNum, error: "name's last char must be alphanumeric" },
    { not: { every: isDigit }, error: "name cannot be made entirely of digits" },
    {
        inCase: { length: { greater: 2 } },
        post: substring(1, -2),
        every: { either: [isAlphaNum, "-"] }
    }
];
