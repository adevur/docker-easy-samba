


// exports
module.exports = fnEasySambaLoop;



// dependencies
const fs = require("fs");
const assert = require("assert");
const log = require("/startup/functions/fnLog.js")("/share/logs/easy-samba.logs");
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
const fnIsString = require("/startup/functions/fnIsString.js");
const fnDiskUsage = require("/startup/functions/fnDiskUsage.js");
const CFG = require("/startup/functions/fnGetConfigDir.js")();



// FUNCTION: fnEasySambaLoop()
// INPUT: N/A
// OUTPUT: N/A
async function fnEasySambaLoop(){
    const vars = {
        counter: 0,
        previousConfig: undefined,
        shares: undefined,
        paused: false,
        pausedAware: false,
        quotaBroken: false,
        remoteApiConfig: undefined
    };

    // loop every 10 seconds
    while (true){
        await fnEasySambaCycle(vars);
        await fnSleep(10000);
    }

    return;
}



async function fnEasySambaCycle(vars){
    // in case someone used Remote API "stop-easy-samba"
    fnEasySambaCycleManageStop();
    
    // in case someone has "paused" easy-samba via Remote API "pause-easy-samba"
    fnEasySambaCycleManagePause(vars);

    // manage "config.gen.js" file
    await fnEasySambaCycleManageConfigGen(vars);

    // start EasySamba Remote API
    await fnStartRemoteAPI(vars);
    
    // apply soft-quota
    fnEasySambaCycleQuota(vars);

    // start easy-samba configuration process
    await fnEasySambaCycleProcess(vars);
}



function fnEasySambaCycleManageStop(){
    if (fs.existsSync("/startup/easy-samba.stop")){
        let message = "";
        try {
            message = JSON.parse( fs.readFileSync("/startup/easy-samba.stop", "utf8") );
            assert( fnIsString(message) );
        }
        catch (error){
            message = "";
        }
        try {
            log(`[WARNING] easy-samba is being stopped via Remote API.`);
            if (message.length > 0){
                log(`[LOG] ${message}`);
            }
        }
        catch (error){
            // do nothing
        }
        fnKill("/usr/sbin/smbd --foreground --no-process-group");
        fnKill("/usr/sbin/nmbd --foreground --no-process-group");
        fnKill(`node ${CFG}/config.gen.js`);
        fnKill("node /startup/remote-api/index.js");
        process.exit(0);
    }
}



function fnEasySambaCycleManagePause(vars){
    if (fs.existsSync("/startup/easy-samba.pause")){
        vars["paused"] = true;
    }
    else {
        if (vars["paused"] === true){
            log(`[LOG] easy-samba has been resumed from pause, and it will now restart again.\n`);
        }
        vars["paused"] = false;
        vars["pausedAware"] = false;
    }
}



async function fnEasySambaCycleManageConfigGen(vars){
    // if easy-samba is paused, kill "config.gen.js"
    if (vars["paused"] === true){
        fnKill(`node ${CFG}/config.gen.js`);
    }
    // execute "config.gen.js" in case "config.json" is missing
    else if (fs.existsSync(`${CFG}/config.json`) !== true && fs.existsSync(`${CFG}/config.gen.js`) === true){
        if (fnIsRunning(`node ${CFG}/config.gen.js`) !== true){
            log(`[LOG] executing '${CFG}/config.gen.js'...\n`);
            fnSpawn("node", [`${CFG}/config.gen.js`]);
            await fnSleep(2000);
        }
    }
    // kill "config.gen.js" in case it doesn't exist
    else if (fs.existsSync(`${CFG}/config.gen.js`) !== true){
        fnKill(`node ${CFG}/config.gen.js`);
    }
}



async function fnEasySambaCycleProcess(vars){
    // if easy-samba is paused, and we are already aware of that,
    //   we do nothing
    if (vars["paused"] === true && vars["pausedAware"] === true){
        return;
    }
    // if easy-samba has been paused and we're not aware of it yet,
    //   we stop everything
    else if (vars["paused"] === true && vars["pausedAware"] !== true){
        fnDeleteFile("/startup/easy-samba.running");
        fnKill("/usr/sbin/smbd --foreground --no-process-group");
        fnKill("/usr/sbin/nmbd --foreground --no-process-group");
        vars["previousConfig"] = undefined;
        vars["shares"] = undefined;
        vars["quotaBroken"] = false;
        log(`[WARNING] easy-samba has been paused via Remote API. It will not restart until you send command 'start-easy-samba' via Remote API.\n`);
        vars["pausedAware"] = true;
        return;
    }

    // load configuration
    const { config, rawConfig, sourceConfig } = fnLoadConfig();

    // check for changes
    let somethingChanged = false;
    let sambaCrashed = false;
    if (rawConfig !== false && rawConfig !== vars["previousConfig"]){
        somethingChanged = true;
    }
    if (vars["previousConfig"] !== undefined && (fnIsRunning("/usr/sbin/nmbd --foreground --no-process-group") !== true || fnIsRunning("/usr/sbin/smbd --foreground --no-process-group") !== true)){
        sambaCrashed = true;
    }

    // update running configuration,
    //   in case it's first startup, something changed, there's no configuration file anymore, or SAMBA crashed
    if (vars["previousConfig"] === undefined || somethingChanged || rawConfig === false || sambaCrashed){
        log(`------ EASY-SAMBA CONFIGURATION PROCESS #${vars["counter"]} ------`);
        let res = false;
        
        vars["shares"] = undefined;
        
        if (config === false){
            log(`[ERROR] easy-samba configuration file could not be loaded or it is not in JSON format.`);
            res = false;
        }
        else {
            log(`[LOG] SAMBA server configuration process has started.`);
            log(`[LOG] easy-samba configuration has been retrieved from file '${sourceConfig}'.`);
            res = await fnUpdateConfig(config);
            vars["previousConfig"] = rawConfig;
        }
        
        // in case configuration updated successfully
        if (fnHas(res, "shares")){
            fnWriteFile("/startup/easy-samba.running");
            vars["shares"] = res.shares;
        }
        // in case it's not been possible to update configuration
        else {
            fnDeleteFile("/startup/easy-samba.running");
            fnKill("/usr/sbin/smbd --foreground --no-process-group");
            fnKill("/usr/sbin/nmbd --foreground --no-process-group");
            vars["previousConfig"] = undefined;
            vars["shares"] = undefined;
            vars["quotaBroken"] = false;
            log(`[WARNING] configuration process has failed, re-trying in 10 seconds.`);
        }

        log(`------ EASY-SAMBA CONFIGURATION PROCESS FINISHED ------\n`);
        vars["counter"] += 1;
    }
}



function fnEasySambaCycleQuota(vars){
    if (vars["shares"] !== undefined && fs.existsSync("/startup/easy-samba.running")){
        // get the list of shared folders with broken soft-quota
        let s = [];
        vars["shares"].forEach((e) => {
            if (fnHas(e, "$soft-quota")){
                const du = fnDiskUsage(e["path"]);
                if (du >= e["$soft-quota"]["limit"]){
                    s.push(e["path"]);
                }
            }
        });
        s = s.map((e) => { return `'${e}'`; });
        const broken = (s.length > 0);
        
        // if limit has been broken
        if (broken && vars["quotaBroken"] !== true){
            log(`[WARNING] soft-quota limit has been broken by the following shared folders: ${s.join(", ")}.\n`);
            vars["quotaBroken"] = true;
            fnKill("/usr/sbin/smbd --foreground --no-process-group");
            fnKill("/usr/sbin/nmbd --foreground --no-process-group");
        }
        // if limit has been restored
        else if (broken !== true && vars["quotaBroken"]){
            vars["quotaBroken"] = false;
            fnKill("/usr/sbin/smbd --foreground --no-process-group");
            fnKill("/usr/sbin/nmbd --foreground --no-process-group");
        }
    }
}



