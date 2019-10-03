


// exports
module.exports = fnRemoveDuplicates;



// dependencies
// N/A



// FUNCTION: fnRemoveDuplicates()
// INPUT: "input" is a Javascript array
// OUTPUT: a clone of "input", but without duplicates
// EXAMPLE: fnRemoveDuplicates([1, 2, 1, 3]) === [1, 2, 3]
function fnRemoveDuplicates(input){
    return input.filter((e, i) => {
        return (input.indexOf(e) === i);
    });
}
