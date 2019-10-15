
module.exports = {
    valid: valid,
    isString: input => input === String(input),
    isNumber: input => input === Number(input),
    isInteger: Number.isInteger,
    isIncludedIn: (source) => {
        return (input) => {
            return Array.isArray(source) && source.includes(input);
        };
    },
    startsWith: (source) => {
        return (input) => {
            return (input === String(input)) && (source === String(source)) && input.startsWith(source);
        };
    },
};



function valid(input, test){
    if (typeof(test) === "function"){
        return test(input);
    }
    else if (test === Number(test)){
        return input === test;
    }
    else if (test === String(test)){
        return input === test;
    }
    else if (test === true){
        return true;
    }
    else if (test === false){
        return false;
    }
    
    let canTest = true;
    
    if (test.hasOwnProperty("inCase")){
        if (valid(input, test["inCase"]) !== true){
            return true;
        }
    }
    
    if (test.hasOwnProperty("prop")){
        if (Array.isArray(test["prop"])){
            temp = [];
            test["prop"].forEach((e) => {
                if (input.hasOwnProperty(e)){
                    temp.push(input[e]);
                }
                else {
                    canTest = false;
                }
            });
            input = temp;
        }
        else {
            if (input.hasOwnProperty(test["prop"])){
                input = input[test["prop"]];
            }
            else {
                canTest = false;
            }
        }
    }
    
    if (test.hasOwnProperty("elem")){
        input = input[test["elem"]];
    }
    
    if (test.hasOwnProperty("count")){
        const splitted = Array.isArray(input) ? input : input.split("");
        let counter = 0;
        splitted.forEach((e) => {
            counter += valid(e, test["count"]) ? 1 : 0;
        });
        input = counter;
    }
    
    if (test.hasOwnProperty("after")){
        input = test["after"](input);
    }
    
    let result = false;
    
    if (test.hasOwnProperty("not") && canTest){
        result = valid(input, test["not"]) !== true;
    }
    else if (test.hasOwnProperty("check") && canTest){
        result = valid(input, test["check"]);
    }
    else if (test.hasOwnProperty("length") && canTest){
        result = valid(input.length, test["length"]);
    }
    else if (test.hasOwnProperty("strLength") && canTest){
        result = (input === String(input)) ? valid(input.length, test["strLength"]) : false;
    }
    else if (test.hasOwnProperty("greater") && canTest){
        result = input > test["greater"];
    }
    else if (test.hasOwnProperty("greaterEq") && canTest){
        result = input >= test["greaterEq"];
    }
    else if (test.hasOwnProperty("less") && canTest){
        result = input < test["less"];
    }
    else if (test.hasOwnProperty("lessEq") && canTest){
        result = input <= test["lessEq"];
    }
    else if (test.hasOwnProperty("every") && Array.isArray(input) && canTest){
        result = input.every(e => valid(e, test["every"]));
    }
    else if (test.hasOwnProperty("every") && input === String(input) && canTest){
        result = input.split("").every(e => valid(e, test["every"]));
    }
    else if (test.hasOwnProperty("some") && Array.isArray(input) && canTest){
        result = input.some(e => valid(e, test["some"]));
    }
    else if (test.hasOwnProperty("some") && input === String(input) && canTest){
        result = input.split("").some(e => valid(e, test["some"]));
    }
    else if (test.hasOwnProperty("everyElem") && canTest){
        result = Array.isArray(input) ? input.every(e => valid(e, test["everyElem"])) : false;
    }
    else if (test.hasOwnProperty("has") && canTest){
        const keys = Array.isArray(test["has"]) ? test["has"] : [test["has"]];
        result = keys.every((e) => {
            return input.hasOwnProperty(e);
        });
    }
    else if (test.hasOwnProperty("hasEither") && canTest){
        const keys = Array.isArray(test["hasEither"]) ? test["hasEither"] : [test["hasEither"]];
        result = keys.some((e) => {
            return input.hasOwnProperty(e);
        });
    }
    else if (test.hasOwnProperty("either") && canTest){
        result = test["either"].some((e) => {
            return valid(input, e);
        });
    }
    
    if (canTest !== true){
        return false;
    }
    else if (test.hasOwnProperty("and")){
        return result && valid(input, test["and"]);
    }
    else if (test.hasOwnProperty("or")){
        return result || valid(input, test["or"]);
    }
    else {
        return result;
    }
}





