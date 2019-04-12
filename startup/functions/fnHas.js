


// exports
module.exports = fnHas;



// dependencies
const fnIsArray = require("/startup/functions/fnIsArray.js");



// FUNCTION: fnHas()
// INPUT: "obj" is the object to check; "keys" is the property (or the properties) that "obj" must have
//   "keys" can be either a string (if there's only one property) or an array of strings (if more than one property must be checked)
// OUTPUT: true in case of success, otherwise false
// PURPOSE: check that a given javascript object has some property
// EXAMPLE: const myvar = {hello: "world"}; fnHas(myvar, "hello") === true; fnHas(myvar, ["hello", "bye"]) === false
function fnHas(obj, keys){
    const has = (obj, key) => { return Object.prototype.hasOwnProperty.call(obj, key); };

    if (fnIsArray(keys)){
        return keys.every((key) => { return has(obj, key); });
    }
    else {
        return has(obj, keys);
    }
}
