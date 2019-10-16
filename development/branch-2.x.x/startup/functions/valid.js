


// dependencies
const assert = require("assert");


// several utilities for input validation
const utils = {
    isString: input => input === String(input),
    isNEString: input => utils.isString(input) && input.length > 0,
    isNum: input => input === Number(input),
    isInt: Number.isInteger,
    isPosInt: input => utils.isInt(input) && input > 0,
    isNegInt: input => utils.isInt(input) && input < 0,
    isInRange: (min, max) => {
        return (input) => {
            return [min, max, input].every(utils.isNum) && input >= min && input <= max;
        };
    },
    isIntInRange: (min, max) => {
        return (input) => {
            return [min, max, input].every(utils.isInt) && input >= min && input <= max;
        };
    },
    isArray: Array.isArray,
    isBool: input => [true, false].includes(input),
    isFunction: input => typeof(input) === "function",
    has: (source) => {
        return (input) => {
            return source !== undefined && source !== null && utils.isNEString(input) && source.hasOwnProperty(input);
        };
    },
    isIncludedIn: (source) => {
        return (input) => {
            return (utils.isArray(source) && source.includes(input)) || (utils.isString(source) && utils.isString(input) && source.includes(input));
        };
    },
    startsWith: (source) => {
        return (input) => {
            return utils.isString(input) && utils.isString(source) && input.startsWith(source);
        };
    },
    isJSON: (input) => {
        try {
            const temp = JSON.parse(input);
            return true;
        }
        catch (error){
            return false;
        }
    },
    parseJSON: (input) => {
        try {
            return JSON.parse(input);
        }
        catch (error){
            return undefined;
        }
    },
};



// export 'utils'
module.exports = { ...(module.exports), ...utils };

// export 'valid'
module.exports = { ...(module.exports), valid: valid };

// export 'vassert'
module.exports = { ...(module.exports), vassert: vassert };

// export 'voodoo'
module.exports = { ...(module.exports), voodoo: voodoo };



function vassert(input, test, vars = {}){
    assert( valid(input, test, vars) === true );
}

function voodoo(input, test, fn, vars = {}){
    if (valid(input, test, vars) === true){
        fn();
    }
}



// FUNCTION: valid()
// INPUT: 'input' to validate, and 'test' which contains the rules to validate input against
// OUTPUT: true or false
function valid(input, test, vars = {}){
    if (utils.isFunction(test)){
        try {
            return test(input) ? true : false;
        }
        catch (error){
            return false;
        }
    }
    else if (utils.isNum(test)){
        return input === test;
    }
    else if (utils.isString(test)){
        return input === test;
    }
    else if ([true, false, undefined, null].includes(test)){
        return test;
    }
    
    let canTest = true;
    
    if (utils.has(test)("pre") && utils.isFunction(test["pre"])){
        try {
            input = test["pre"](input);
        }
        catch (error){
            input = undefined;
        }
    }
    
    if (utils.has(test)("inCase")){
        if (valid(input, test["inCase"], vars) !== true){
            return true;
        }
    }
    
    if (utils.has(test)("prop")){
        if (utils.isArray(test["prop"])){
            temp = [];
            test["prop"].forEach((e) => {
                if (utils.has(input)(e)){
                    temp.push(input[e]);
                }
                else {
                    canTest = false;
                }
            });
            input = temp;
        }
        else {
            if (utils.has(input)(test["prop"])){
                input = input[test["prop"]];
            }
            else {
                canTest = false;
            }
        }
    }
    
    if (utils.has(test)("elem") && canTest){
        if (utils.isArray(input) && utils.isInt(test["elem"]) && utils.isInRange(0, input.length - 1)(test["elem"])){
            input = input[test["elem"]];
        }
        else {
            canTest = false;
        }
    }
    
    if (utils.has(test)("count") && canTest){
        if (utils.isArray(input) || utils.isString(input)){
            const splitted = utils.isArray(input) ? input : input.split("");
            let counter = 0;
            splitted.forEach((e) => {
                counter += valid(e, test["count"], vars) ? 1 : 0;
            });
            input = counter;
        }
        else {
            canTest = false;
        }
    }
    
    if (utils.has(test)("post") && utils.isFunction(test["post"]) && canTest){
        try {
            input = test["post"](input);
        }
        catch (error){
            input = undefined;
        }
    }
    
    let result = false;
    
    if (utils.has(test)("not") && canTest){
        result = valid(input, test["not"], vars) !== true;
    }
    else if (utils.has(test)("check") && canTest){
        result = valid(input, test["check"], vars);
    }
    else if (utils.has(test)("length") && canTest){
        result = valid(input.length, test["length"], vars);
    }
    else if (utils.has(test)("strLength") && canTest){
        result = utils.isString(input) ? valid(input.length, test["strLength"], vars) : false;
    }
    else if (utils.has(test)("arrLength") && canTest){
        result = utils.isArray(input) ? valid(input.length, test["arrLength"], vars) : false;
    }
    else if (utils.has(test)("greater") && canTest){
        result = utils.isNum(input) && input > test["greater"];
    }
    else if (utils.has(test)("greaterEq") && canTest){
        result = utils.isNum(input) && input >= test["greaterEq"];
    }
    else if (utils.has(test)("less") && canTest){
        result = utils.isNum(input) && input < test["less"];
    }
    else if (utils.has(test)("lessEq") && canTest){
        result = utils.isNum(input) && input <= test["lessEq"];
    }
    else if (utils.has(test)("every") && canTest){
        if (utils.isArray(input)){
            result = input.every(e => valid(e, test["every"], vars));
        }
        else if (utils.isString(input)){
            result = input.split("").every(e => valid(e, test["every"], vars));
        }
        else {
            result = false;
        }
    }
    else if (utils.has(test)("some") && canTest){
        if (utils.isArray(input)){
            result = input.some(e => valid(e, test["some"], vars));
        }
        else if (utils.isString(input)){
            result = input.split("").some(e => valid(e, test["some"], vars));
        }
        else {
            result = false;
        }
    }
    else if (utils.has(test)("everyElem") && canTest){
        result = utils.isArray(input) ? input.every(e => valid(e, test["everyElem"], vars)) : false;
    }
    else if (utils.has(test)("everyChar") && canTest){
        result = utils.isString(input) ? input.split("").every(e => valid(e, test["everyChar"], vars)) : false;
    }
    else if (utils.has(test)("has") && canTest){
        const keys = utils.isArray(test["has"]) ? test["has"] : [test["has"]];
        result = keys.every((e) => {
            return utils.has(input)(e);
        });
    }
    else if (utils.has(test)("hasEither") && canTest){
        const keys = utils.isArray(test["hasEither"]) ? test["hasEither"] : [test["hasEither"]];
        result = keys.some((e) => {
            return utils.has(input)(e);
        });
    }
    else if (utils.has(test)("either") && canTest){
        result = test["either"].some((e) => {
            return valid(input, e, vars);
        });
    }
    
    let realRes = false;
    
    if (canTest !== true){
        realRes = false;
    }
    else if (utils.has(test)("and")){
        realRes = result && valid(input, test["and"], vars);
    }
    else if (utils.has(test)("or")){
        realRes = result || valid(input, test["or"], vars);
    }
    else {
        realRes = result;
    }
    
    if (utils.has(test)("put") && utils.isNEString(test["put"])){
        try {
            if (realRes){
                vars[test["put"]] = input;
            }
        }
        catch (error){
            // do nothing
        }
    }
    
    return realRes;
}





