


// exports
module.exports = fnStringContains;



// dependencies
// N/A



// TODO: describe
function fnStringContains(str, chars){
    let result = false;

    chars.forEach((char) => {
        if (char.length === 1){
            result = (str.includes(char)) ? true : result;
        }
        else {
            str.split("").forEach((c) => {
                result = (c.charCodeAt(0) >= char.charCodeAt(0) && c.charCodeAt(0) <= char.charCodeAt(1)) ? true : result;
            });
        }
    });

    return result;
}
