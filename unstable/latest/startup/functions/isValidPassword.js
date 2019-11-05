


// dependencies
const { isString, isPrintable } = require("/startup/functions/valid.js");



// TEST: isValidPassword
// INPUT: "password" is a javascript object
// PURPOSE: check that "password" is a valid Linux password
// EXPLAIN: "password" must a string, must have a minimum length of 1 char,
//   and can only contain printable ASCII chars
module.exports = [
    { check: isString, error: "password must be a string" },
    { length: { greaterEq: 1 }, error: "password's length must be at least 1 char" },
    { check: isPrintable, error: "password must be a printable string" }
];
