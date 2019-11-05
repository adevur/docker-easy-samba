


// dependencies
const { isASCII, firstChars, isLowerCase, lastChars, isDigit, substring } = require("/startup/functions/valid.js");



// TEST: isValidUsername
// INPUT: "username" is the javascript object to validate
// PURPOSE: check that a given object is a valid UNIX username
// EXPLAIN: for easy-samba, valid username rules are:
//   username must have a length of minimum 1 char and maximum 31 chars
//   username must start with a lowercase letter or an underscore
//   username body can contain lowercase letters, digits, underscores and hyphens
//   username last char can also be a dollar sign
module.exports = [
    { check: isASCII, error: "username must be an ASCII string" },
    { length: { between: [1, 31] }, error: "username's length must be between 1 and 31 chars" },
    { pre: firstChars(1), either: [isLowerCase, "_"], error: "username's first char must be lowercase or underscore" },
    { pre: lastChars(1), either: [isLowerCase, isDigit, "_", "-", "$"], error: "username's last char must be lowercase, digit, underscore, hyphen, or dollar" },
    {
        inCase: { length: { greater: 2 } },
        post: substring(1, -2),
        every: { either: [isLowerCase, isDigit, "_", "-"] },
        error: "every username's char (except first and last) must be lowercase, digit, underscore, or hyphen"
    }
];



