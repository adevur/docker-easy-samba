


// exports
module.exports = fnStringContains;



// dependencies
// N/A



// TODO: describe
function fnStringContains(str, chars){
    return str.split("").some((c) => {
        return chars.some((char) => {
            if (char.length === 1){
                return (c === char);
            }
            else {
                const from = char.charCodeAt(0);
                const to = char.charCodeAt(1);
                return (c.charCodeAt(0) >= from && c.charCodeAt(0) <= to);
            }
        });
    });
}
