


// exports
module.exports = fnEasySambaLoop;



// dependencies
const fs = require("fs");
const assert = require("assert");
const fnIsRunning = require("/startup/functions/fnIsRunning.js");
const fnSleep = require("/startup/functions/fnSleep.js");
const fnDeleteFile = require("/startup/functions/fnDeleteFile.js");
const fnWriteFile = require("/startup/functions/fnWriteFile.js");
const fnLoadConfig = require("/startup/functions/fnLoadConfig.js");
const fnUpdateConfig = require("/startup/functions/fnUpdateConfig.js");
const fnSpawn = require("/startup/functions/fnSpawn.js");
const fnStartRemoteAPI = require("/startup/functions/fnStartRemoteAPI.js");
const fnKill = require("/startup/functions/fnKill.js");
const fnCreateShares = require("/startup/functions/fnCreateShares.js");
const fnHas = require("/startup/functions/fnHas.js");
const CFG = require("/startup/functions/fnGetConfigDir.js")();



// FUNCTION: fnEasySambaLoop()
// INPUT: N/A
// OUTPUT: N/A
async function fnEasySambaLoop(){
    let counter = 0;
    let previousConfig = undefined;
    let shares = undefined;

    // loop every 10 seconds
    while (true){
        // execute "config.gen.js" in case "config.json" is missing
        if (fs.existsSync(`${CFG}/config.json`) !== true && fs.existsSync(`${CFG}/config.gen.js`) === true){
            if (fnIsRunning(`node ${CFG}/config.gen.js`) !== true){
                console.log(`[LOG] executing '${CFG}/config.gen.js'...\n`);
                fnSpawn("node", [`${CFG}/config.gen.js`]);
                await fnSleep(2000);
            }
        }

        // start EasySamba Remote API
        await fnStartRemoteAPI();

        // load configuration
        const { config, rawConfig } = fnLoadConfig();

        // check for changes
        let somethingChanged = false;
        let sambaCrashed = false;
        if (rawConfig !== false && rawConfig !== previousConfig){
            somethingChanged = true;
        }
        if (previousConfig !== undefined && (fnIsRunning("/usr/sbin/nmbd --foreground --no-process-group") !== true || fnIsRunning("/usr/sbin/smbd --foreground --no-process-group") !== true)){
            sambaCrashed = true;
        }

        // update running configuration,
        //   in case it's first startup, something changed, or SAMBA crashed
        if (previousConfig === undefined || somethingChanged || sambaCrashed){
            console.log(`------ EASY-SAMBA CONFIGURATION PROCESS #${counter.toString()} ------`);
            let res = false;
            
            shares = undefined;
            
            // if SAMBA crashed, show a warning
            if (sambaCrashed){
                console.log(`[WARNING] 'smbd' or 'nmbd' crashed unexpectedly.`);
            }
            
            if (previousConfig !== undefined || config !== false){
                console.log(`[LOG] SAMBA server configuration process has started.`);
            }
            
            if (previousConfig === undefined && config === false){
                console.log(`[ERROR] easy-samba configuration file could not be loaded or it is not in JSON format.`);
                res = false;
            }
            else if (previousConfig === undefined && config !== false){
                res = await fnUpdateConfig(config);
                previousConfig = rawConfig;
            }
            else if (previousConfig !== undefined && config === false){
                res = await fnUpdateConfig(JSON.parse(previousConfig));
            }
            else if (previousConfig !== undefined && config !== false){
                res = await fnUpdateConfig(config);
                previousConfig = rawConfig;
            }
            
            // in case configuration updated successfully
            if (fnHas(res, "shares")){
                fnWriteFile("/startup/easy-samba.running");
                shares = res.shares;
            }
            // in case it's not been possible to update configuration
            else {
                fnDeleteFile("/startup/easy-samba.running");
                fnKill("/usr/sbin/smbd --foreground --no-process-group");
                fnKill("/usr/sbin/nmbd --foreground --no-process-group");
                console.log(`[WARNING] configuration process has failed, re-trying in 10 seconds.`);
                previousConfig = undefined;
                shares = undefined;
            }

            console.log(`------ EASY-SAMBA CONFIGURATION PROCESS FINISHED ------\n`);
            counter += 1;
        }
        
        // apply soft-quota
        if (shares !== undefined && fs.existsSync("/startup/easy-samba.running")){
            // if there's at least one shared folder with soft-quota
            if (shares.some((e) => { return fnHas(e, "$soft-quota"); })){
                try {
                    assert( fnCreateShares(shares) === true );
                }
                catch (error){
                    console.log("[WARNING] it's not been possible to apply soft-quota to shared folders.\n");
                }
            }
        }

        await fnSleep(10000);
    }

    return;
}



