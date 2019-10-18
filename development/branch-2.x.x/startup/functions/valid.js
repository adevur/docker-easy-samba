


// dependencies
const assert = require("assert");


// several utilities for input validation
const utils = {
    isString: input => input === String(input),
    isNEString: input => utils.isString(input) && input.length > 0,
    isLowerCase: input => utils.isString(input) && input === input.toLowerCase() && input !== input.toUpperCase(),
    isUpperCase: input => utils.isString(input) && input === input.toUpperCase() && input !== input.toLowerCase(),
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
    isPrintable: input => utils.isString(input) && input.split("").every(e => utils.isInRange(32, 126)(e.charCodeAt(0))),
    isASCII: input => utils.isString(input) && input.split("").every(e => utils.isInRange(0, 127)(e.charCodeAt(0))),
    isArray: Array.isArray,
    isBool: input => [true, false].includes(input),
    isFunction: input => typeof(input) === "function",
    has: (source) => {
        return (input) => {
            return source !== undefined && source !== null && utils.isNEString(input) && source.hasOwnProperty(input);
        };
    },
    isPropOf: (source) => {
        return (input) => {
            return source !== undefined && source !== null && utils.isNEString(input) && source.hasOwnProperty(input);
        };
    },
    isIncludedIn: (source) => {
        return (input) => {
            return (utils.isArray(source) && source.includes(input)) || (utils.isString(source) && utils.isString(input) && source.includes(input));
        };
    },
    areIncludedIn: (source) => {
        return (input) => {
            return utils.isArray(input) && input.every(utils.isIncludedIn(source));
        };
    },
    startsWith: (source) => {
        return (input) => {
            return utils.isString(input) && utils.isString(source) && input.startsWith(source);
        };
    },
    isJSON: (input) => {
        try {
            assert( utils.isString(input) );
            const temp = JSON.parse(input);
            return true;
        }
        catch (error){
            return false;
        }
    },
    parseJSON: (input) => {
        try {
            assert( utils.isString(input) );
            return JSON.parse(input);
        }
        catch (error){
            return undefined;
        }
    },
    toUpperCase: (input) => {
        return utils.isString(input) ? input.toUpperCase() : undefined;
    },
    toLowerCase: (input) => {
        return utils.isString(input) ? input.toLowerCase() : undefined;
    },
    firstChars: (num) => {
        return (input) => {
            return (utils.isInt(num) && utils.isString(input) && num <= input.length) ? input.slice(0, num) : undefined;
        };
    },
    lastChars: (num) => {
        return (input) => {
            return (utils.isInt(num) && utils.isString(input) && num <= input.length) ? input.slice(input.length - num, input.length) : undefined;
        };
    },
    isDigit: (input) => {
        return utils.isString(input) && input.split("").every((e) => { return utils.isInRange(48, 57)(e.charCodeAt(0)); });
    },
    isAlpha: input => utils.isString(input) && input.split("").every(e => e.toUpperCase() !== e.toLowerCase()),
    isAlphaNum: input => utils.isString(input) && input.split("").every(e => utils.isAlpha(e) || utils.isDigit(e)),
    substring: (start, end = undefined) => {
        return (input) => {
            if (utils.isString(input) !== true){
                return undefined;
            }
            end = (end === undefined) ? input.length - 1 : end;
            if ([start, end].every(utils.isInt) !== true){
                return undefined;
            }
            const startAbs = (start >= 0) ? start : (input.length + start);
            const endAbs = (end >= 0) ? end : (input.length + end);
            if ([startAbs, endAbs].every(utils.isInRange(0, input.length - 1)) !== true || startAbs > endAbs){
                return undefined;
            }
            return input.slice(startAbs, endAbs + 1);
        };
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
    const temp = valid(input, test, vars);
    assert( temp === true, temp );
}



function voodoo(input, test, vars = {}){
    const c = class {
        constructor(res, err){
            this.res = res;
            this.err = err;
            return this;
        }
        
        yay(callback){
            if (this.res === true){
                callback();
            }
            return this;
        }
        
        oops(callback){
            if (this.res !== true){
                callback(this.err);
            }
            return this;
        }
        
        always(callback){
            callback(this.res, this.err);
            return this;
        }
    };
    
    const result = valid(input, test, vars);
    if (result === true){
        return new c(true, undefined);
    }
    else {
        return new c(false, result);
    }
}



// FUNCTION: valid()
// INPUT: 'input' to validate, and 'test' which contains the rules to validate input against
// OUTPUT: true or false
function valid(input, test, vars = {}){
    if (utils.isFunction(test)){
        try {
            const temp = test(input);
            return (temp === true) ? true : temp;
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
        return input === test;
    }
    else if (utils.isArray(test)){
        let err = false;
        let res = true;
        let i = 0;
        
        for (i = 0; i < test.length; i++){
            err = valid(input, test[i], vars);
            if (err !== true){
                res = false;
                break;
            }
        }
        
        return (res === true) ? true : err;
    }
    
    let canTest = true;
    
    if (utils.has(test)("pull")){
        input = utils.has(vars)(test["pull"]) ? vars[test["pull"]] : undefined;
    }
    
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
                counter += (valid(e, test["count"], vars) === true) ? 1 : 0;
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
    else if (utils.has(test)("always") && canTest){
        result = test["always"] === true;
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
    else if (utils.has(test)("charcode") && canTest){
        result = (utils.isString(input) && input.length >= 1) ? valid(input.charCodeAt(0), test["charcode"], vars) : false;
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
        if (utils.isArray(input) !== true && utils.isString(input) !== true){
            result = false;
        }
        const temp = utils.isArray(input) ? input : input.split("");
        
        let err = false;
        let res = true;
        let i = 0;
        
        for (i = 0; i < temp.length; i++){
            err = valid(temp[i], test["every"], vars);
            if (err !== true){
                res = false;
                break;
            }
        }
        
        result = (res === true) ? true : err;
    }
    else if (utils.has(test)("everyElem") && canTest){
        if (utils.isArray(input) !== true){
            result = false;
        }
        const temp = input;
        
        let err = false;
        let res = true;
        let i = 0;
        
        for (i = 0; i < temp.length; i++){
            err = valid(temp[i], test["everyElem"], vars);
            if (err !== true){
                res = false;
                break;
            }
        }
        
        result = (res === true) ? true : err;
    }
    else if (utils.has(test)("everyChar") && canTest){
        if (utils.isString(input) !== true){
            result = false;
        }
        const temp = input.split("");
        
        let err = false;
        let res = true;
        let i = 0;
        
        for (i = 0; i < temp.length; i++){
            err = valid(temp[i], test["everyChar"], vars);
            if (err !== true){
                res = false;
                break;
            }
        }
        
        result = (res === true) ? true : err;
    }
    else if (utils.has(test)("some") && canTest){
        if (utils.isArray(input)){
            result = input.some(e => valid(e, test["some"], vars) === true);
        }
        else if (utils.isString(input)){
            result = input.split("").some(e => valid(e, test["some"], vars) === true);
        }
        else {
            result = false;
        }
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
            return valid(input, e, vars) === true;
        });
    }
    else if (utils.has(test)("between") && canTest){
        result = utils.isArray(test["between"]) && test["between"].length === 2 && test["between"].every(utils.isNum) && utils.isInRange(...test["between"])(input);
    }
    else if (utils.has(test)("betweenInt") && canTest){
        result = utils.isArray(test["betweenInt"]) && test["betweenInt"].length === 2 && test["betweenInt"].every(utils.isInt) && utils.isIntInRange(...test["betweenInt"])(input);
    }
    
    let realRes = false;
    let error = false;
    
    if (canTest !== true){
        realRes = false;
    }
    else if (utils.has(test)("and")){
        if (result === true){
            const and = valid(input, test["and"], vars);
            error = (and !== true) ? and : error;
            realRes = and === true;
        }
        else {
            error = result;
            realRes = false;
        }
    }
    else if (utils.has(test)("or")){
        if (result === true){
            realRes = true;
        }
        else {
            error = result;
            const or = valid(input, test["or"], vars);
            realRes = or === true;
        }
    }
    else {
        error = (result !== true) ? result : error;
        realRes = result === true;
    }
    
    if (utils.has(test)("put") && utils.isNEString(test["put"])){
        try {
            if (realRes === true){
                vars[test["put"]] = input;
            }
        }
        catch (error){
            // do nothing
        }
    }
    
    error = utils.has(test)("error") ? test["error"] : error;
    
    error = utils.isFunction(error) ? error(input) : error;
    
    if (realRes === true && utils.has(test)("doo") && utils.isFunction(test["doo"])){
        try {
            test["doo"](input);
        }
        catch (error){
            // do nothing
        }
    }
    
    return (realRes === true) ? true : error;
}





