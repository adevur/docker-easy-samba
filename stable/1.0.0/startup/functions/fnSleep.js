


// exports
module.exports = fnSleep;



// dependencies
// N/A



// FUNCTION: fnSleep()
// INPUT: "milliseconds" is the number of milliseconds to sleep
// PURPOSE: sleep function based on setTimeout() and promises
function fnSleep(milliseconds){
    return new Promise((resolve, reject) => {
        setTimeout(() => { resolve(); }, milliseconds);
    });
}
