


// exports
module.exports = fnEasySambaLoop;



// dependencies
const fs = require("fs");
const fnIsRunning = require("/startup/functions/fnIsRunning.js");
const fnSleep = require("/startup/functions/fnSleep.js");
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const fnLoadConfig = require("/startup/functions/fnLoadConfig.js");
const fnUpdateConfig = require("/startup/functions/fnUpdateConfig.js");
const fnSpawn = require("/startup/functions/fnSpawn.js");



// FUNCTION: fnEasySambaLoop()
// INPUT: N/A
// OUTPUT: N/A
async function fnEasySambaLoop(){
    let counter = 0;
    let previousConfig = undefined;

    // loop every 10 seconds
    while (true){
        // execute "/share/config.gen.js" in case "/share/config.json" is missing
        if (fs.existsSync("/share/config.json") !== true && fs.existsSync("/share/config.gen.js") === true){
            if (fnIsRunning("node /share/config.gen.js") !== true){
                fnSpawn("node", ["/share/config.gen.js"]);
                await fnSleep(2000);
            }
        }

        // load configuration
        const { config, rawConfig } = fnLoadConfig();

        // check for changes
        let somethingChanged = false;
        let sambaCrashed = false;
        if (previousConfig === undefined){
            somethingChanged = true;
        }
        else if (rawConfig !== false && rawConfig !== previousConfig){
            somethingChanged = true;
        }
        else if (fnIsRunning("/usr/sbin/nmbd --foreground --no-process-group") !== true || fnIsRunning("/usr/sbin/smbd --foreground --no-process-group") !== true){
            somethingChanged = true;
            sambaCrashed = true;
        }

        // if something changed, update running configuration
        //  TODO: could be cleaned up to reduce code lines
        if (somethingChanged && config === false && previousConfig === undefined){
            console.log(`------ EASY-SAMBA CONFIGURATION PROCESS #${counter.toString()} ------`);
            console.log(`[ERROR] easy-samba configuration file could not be loaded or it is not in JSON format.`);

            fnDeleteFile("/startup/easy-samba.running");
            console.log(`[WARNING] configuration process has failed, re-trying in 10 seconds.`);

            console.log(`------ EASY-SAMBA CONFIGURATION PROCESS FINISHED ------\n`);
            counter += 1;
        }
        else if (somethingChanged && config !== false){
            console.log(`------ EASY-SAMBA CONFIGURATION PROCESS #${counter.toString()} ------`);
            console.log(`[LOG] SAMBA server configuration process has started.`);
            const res = await fnUpdateConfig(config);

            // in case configuration updated successfully
            if (res === true){
                previousConfig = rawConfig;
                try { fs.writeFileSync("/startup/easy-samba.running", ""); } catch (error){}
            }
            // in case it's not been possible to update configuration
            else {
                fnDeleteFile("/startup/easy-samba.running");
                console.log(`[WARNING] configuration process has failed, re-trying in 10 seconds.`);
            }

            console.log(`------ EASY-SAMBA CONFIGURATION PROCESS FINISHED ------\n`);
            counter += 1;
        }
        else if (somethingChanged && sambaCrashed && config === false && previousConfig !== undefined){
            console.log(`------ EASY-SAMBA CONFIGURATION PROCESS #${counter.toString()} ------`);
            console.log(`[WARNING] 'smbd' or 'nmbd' crashed unexpectedly.`);
            console.log(`[LOG] SAMBA server configuration process has started.`);
            const res = await fnUpdateConfig(JSON.parse(previousConfig));

            // in case configuration updated successfully
            if (res === true){
                try { fs.writeFileSync("/startup/easy-samba.running", ""); } catch (error){}
            }
            // in case it's not been possible to update configuration
            else {
                fnDeleteFile("/startup/easy-samba.running");
                console.log(`[WARNING] configuration process has failed, re-trying in 10 seconds.`);
            }

            console.log(`------ EASY-SAMBA CONFIGURATION PROCESS FINISHED ------\n`);
            counter += 1;
        }

        await fnSleep(10000);
    }

    return;
}



