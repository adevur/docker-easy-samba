
// we need "child_process" and "fs"
const { exec, execSync, spawnSync, spawn } = require("child_process");
const fs = require("fs");



// call the main function of this script
fnMain();



async function fnMain(){
    // load configuration from JSON file "/share/config.json"
    const config = fnLoadConfig("/share/config.json");
    
    // if configuration file doesn't exist or it's not in JSON format, exit
    if (config === false){
        console.log("[ERROR] '/share/config.json' could not be loaded or it is not in JSON format.");
        process.exitCode = 1;
        return;
    }
    console.log("[LOG] '/share/config.json' has been correctly loaded.");
    
    // check if configuration file's syntax is correct
    const validateConfig = fnValidateConfig(config);
    if (validateConfig !== true){
        console.log("[ERROR] '/share/config.json' syntax is not correct: " + validateConfig + ".");
        process.exitCode = 1;
        return;
    }
    console.log("[LOG] '/share/config.json' syntax is correct.");

    // reset permissions of "/share"
    try {
        execSync("setfacl -R -bn /share", { stdio: [undefined, undefined, undefined] });
        execSync("chmod -R a+rX /share", { stdio: [undefined, undefined, undefined] });
    }
    catch (error){
        console.log("[ERROR] permissions of '/share' could not be reset.");
        process.exitCode = 1;
        return;
    }
    console.log("[LOG] permissions of '/share' have been correctly reset.");
    
    // set permissions of "/share"
    // EXPLAIN: at first, we set that "/share" and all its children are owned by root:root
    //   and that only root can read or make changes to them
    try {
        execSync("chown -R root:root /share", { stdio: [undefined, undefined, undefined] });
        execSync("setfacl -R -m 'u::rwx,g::rwx,o::x' /share", { stdio: [undefined, undefined, undefined] });
        execSync("setfacl -R -dm 'u::rwx,g::rwx,o::x' /share", { stdio: [undefined, undefined, undefined] });
    }
    catch (error){
        console.log("[ERROR] permissions of '/share' could not be set.");
        process.exitCode = 1;
        return;
    }
    console.log("[LOG] permissions of '/share' have been correctly set.");

    // TODO: add the capability of creating an anonymous share
    /*if (config["guest"] !== false){
        fnCreateGuest(config["guest"]);
    }*/

    // add the users in the container's OS and in SAMBA
    const createUsers = fnCreateUsers(config["users"]);
    if (createUsers !== true){
        console.log("[ERROR] users could not be created: " + createUsers + ".");
        process.exitCode = 1;
        return;
    }
    console.log("[LOG] users have been correctly created.");

    // create the shares (if they don't exist) and set the correct ACLs for them
    const createShares = fnCreateShares(config["shares"]);
    if (createShares !== true){
        console.log("[ERROR] shares could not be created: " + createShares + ".");
        process.exitCode = 1;
        return;
    }
    console.log("[LOG] shares have been correctly created.");

    // generate the SAMBA server configuration and write it to "/etc/samba/smb.conf"
    try {
        const smbconf = fnGenSmbConf(config["domain"], /*config["guest"]*/ false, config["shares"]);
        fs.writeFileSync("/etc/samba/smb.conf", smbconf);
    }
    catch (error){
        console.log("[ERROR] '/etc/samba/smb.conf' could not be generated or written.");
        process.exitCode = 1;
        return;
    }
    console.log("[LOG] '/etc/samba/smb.conf' has been correctly generated and written.");

    // start "nmbd" daemon
    try {
        spawn("/usr/sbin/nmbd", ["--daemon", "--no-process-group"], { stdio: [undefined, undefined, undefined] });
    }
    catch (error){
        console.log("[ERROR] 'nmbd' could not be started.");
        process.exitCode = 1;
        return;
    }
    console.log("[LOG] 'nmbd' has been correctly started.");

    // wait 2 seconds
    console.log("[LOG] waiting 2 seconds before starting 'smbd'...");
    await fnSleep(2000);

    // start "smbd" daemon
    try {
        spawn("/usr/sbin/smbd", ["--daemon", "--no-process-group"], { stdio: [undefined, undefined, undefined] });
    }
    catch (error){
        console.log("[ERROR] 'smbd' could not be started.");
        process.exitCode = 1;
        return;
    }
    console.log("[LOG] 'smbd' has been correctly started.");

    // script has been executed, now the SAMBA server is ready
    console.log("[LOG] SAMBA server is now ready.");

    // prevent this script from exiting, so that this container doesn't stop
    // TODO: find a better alternative
    // HINT: process.stdin.resume() doesn't seem to work...
    forever();
}



// FUNCTION: forever()
// PURPOSE: prevent the script from exiting
function forever(){
    // forever() just calls itself every 5 seconds
    setTimeout(() => { forever(); }, 5000);
}



// FUNCTION: fnLoadConfig()
// INPUT: "path": path of the configuration file
// OUTPUT: the content of the config file, already parsed; it returns false in case of errors
// PURPOSE: load the configuration file
function fnLoadConfig(path){
    try {
        return JSON.parse(fs.readFileSync(path, "utf8"));
    }
    catch (error){
        return false;
    }
}



// FUNCTION: fnValidateConfig()
// INPUT: configuration, as parsed from "/share/config.json"
// OUTPUT: true in case of no errors, otherwise a string that describes the error
// PURPOSE: check if config file syntax is correct
// TODO: check "users" and "shares"
function fnValidateConfig(config){
    // "config" must contain "domain", "users" and "shares" properties
    if (
        config.hasOwnProperty("domain") !== true ||
        config.hasOwnProperty("users") !== true ||
        config.hasOwnProperty("shares") !== true
    ){
        return "DOESN'T CONTAIN 'domain', 'users' AND 'shares'";
    }

    // "domain" must be a valid NetBIOS name
    if (fnCheckNetBIOSname(String(config["domain"])) !== true){
        return "'domain' IS NOT A VALID NETBIOS NAME";
    }

    // TODO: check if all usernames in config["users"] are correct UNIX usernames (according to useradd man page)

    // TODO: check if all shares in config["shares"] are valid shares
    // EXPLAIN: "name" of the share must be a valid name; "path" must a valid children path of "/share"; "users" must be valid

    return true;
}



// FUNCTION: fnCheckNetBIOSname()
// INPUT: "name": name to validate
// OUTPUT: true in case the name is valid, otherwise false
// PURPOSE: check that a given name is a valid NetBIOS Name
// SOURCE: https://en.wikipedia.org/wiki/NetBIOS#NetBIOS_name
function fnCheckNetBIOSname(name){
    // minimum length: 1 character, maximum length: 15 characters
    if (name.length < 1 || name.length > 15){
        return false;
    }

    // check if "name" is an ASCII string
    if (fnIsAsciiString(name) !== true){
        return false;
    }

    // first character must be alphanumeric
    if (fnIsAlphanumericString(name.charAt(0)) !== true){
        return false;
    }

    // last character must be alphanumeric
    if (fnIsAlphanumericString(name.charAt(name.length - 1)) !== true){
        return false;
    }

    // "name" cannot be made entirely of digits
    if (fnIsNumericString(name) === true){
        return false;
    }

    // if "name" has more than two characters, all of them (except first and last) may be alphanumeric or hyphen
    if (name.length > 2 && fnIsAlphanumericString(name.substring(1).slice(0, -1), true) !== true){
        return false;
    }

    return true;
}



// FUNCTION: fnIsAsciiString()
// INPUT: "str" is the string to check
// OUTPUT: true in case "str" is a string made of only ASCII chars, otherwise false
// PURPOSE: check if a string only contains ASCII characters
function fnIsAsciiString(str){
    // check that every char in "str" has a code between 0 and 127
    let i = 0;
    while (i < str.length){
        if (str.charCodeAt(i) < 0 || str.charCodeAt(i) > 127){
            return false;
        }
        i++;
    }

    return true;
}



// FUNCTION: fnIsAlphanumericString()
// INPUT: "str" is the string to check; "includeHyphen" specifies if the string can contain hyphens
// OUTPUT: true in case validation went well, otherwise false
// PURPOSE: check if a string only contains alphanumeric characters; if "includeHyphen" is true, then "str" can also contain hyphens
function fnIsAlphanumericString(str, includeHyphen = false){
    // check that every char in "str" is between "a-z", between "A-Z" or between "0-9"
    // if "includeHyphen" is true, then "str" can also include hyphens ("-")
    const codes = { "a": 97, "z": 122, "A": 65, "Z": 90, "0": 48, "9": 57, "-": 45 };
    let i = 0;
    while (i < str.length){
        if (
            (str.charCodeAt(i) < codes["a"] || str.charCodeAt(i) > codes["z"]) &&
            (str.charCodeAt(i) < codes["A"] || str.charCodeAt(i) > codes["Z"]) &&
            (str.charCodeAt(i) < codes["0"] || str.charCodeAt(i) > codes["9"]) &&
            ( (includeHyphen) ? (str.charCodeAt(i) !== codes["-"]) : true )
        ){
            return false;
        }
        i++;
    }

    return true;
}



// FUNCTION: fnIsNumericString()
// INPUT: "str" is the string to check
// OUTPUT: true in case "str" is a numeric string, otherwise false
// PURPOSE: check if a string only contains numeric characters ("0"-"9")
function fnIsNumericString(str){
    // check that every char in "str" is between "0" and "9"
    const codes = {"0": 48, "9": 57};
    let i = 0;
    while (i < str.length){
        if (str.charCodeAt(i) < codes["0"] || str.charCodeAt(i) > codes["9"]){
            return false;
        }
        i++;
    }

    return true;
}



// FUNCTION: fnCreateUsers()
// INPUT: "users" object, as described in "/share/config.json"
// OUTPUT: true in case of no errors, otherwise a string that describes the error
// PURPOSE: add the users in the container's OS and in SAMBA
function fnCreateUsers(users){
    // for each "user" in "users" ...
    let i = 0;
    while (i < users.length){
        
        // add the user to the OS
        // TODO: this use of execSync() is very dangerous (HINT: use "stdin" option of execSync)
        // EXAMPLE: users[i] == { "name": "user1", "password": "123456" } --->
        //   execSync(" useradd user1 ");
        //   execSync(" echo '123456' | passwd user1 --stdin ");
        execSync("useradd " + users[i]["name"]);
        execSync("echo '" + users[i]["password"] + "' | passwd " + users[i]["name"] + " --stdin");
        
        // add the user to SAMBA
        // TODO: this use of execSync() is very dangerous (HINT: use "stdin" option of execSync)
        // EXAMPLE: users[i] == { "name": "user1", "password": "123456" } --->
        //   execSync(" (echo '123456'; echo '123456') | smbpasswd -a user1 -s ");
        execSync("(echo '" + users[i]["password"] + "'; echo '" + users[i]["password"] + "') | smbpasswd -a " + users[i]["name"] + " -s");
        
        i++;
    }

    return true;
}



// FUNCTION: fnCreateShares()
// INPUT: "shares" object, as described in "/share/config.json"
// OUTPUT: true in case of no errors, otherwise a string that describes the error
// PURPOSE: create the shares (if they don't exist) and set the correct ACLs for them
function fnCreateShares(shares){
    // for each share ...
    let i = 0;
    while (i < shares.length){
        
        // if it doesn't exist on disk, create it
        // TODO: using fs.existsSync() is an obsolete method
        if (fs.existsSync(shares[i]["path"]) !== true){
            fs.mkdirSync(shares[i]["path"]);
        }
        
        // for each "user" of the share, generate the ACLs
        // EXAMPLE: shares[i]["users"] == ["user1", "user2"] --->
        //   entries == "u:user1:rwx,g:user1:rwx,u:user2:rwx,g:user2:rwx"
        let j = 0;
        let entries = [];
        while (j < shares[i]["users"].length){
            entries.push("u:" + shares[i]["users"][j] + ":rwx,g:" + shares[i]["users"][j] + ":rwx");
            j++;
        }
        entries = entries.join(",");
        
        // set the correct ACLs for the share
        // TODO: this use of execSync() is very dangerous
        // EXAMPLE: shares[i]["path"] == "/share/public" --->
        //   execSync(" chown root:root '/share/public' ");
        //   execSync(" setfacl -R -m 'u::rwx,g::rwx,o::x,u:user1:rwx,g:user1:rwx,u:user2:rwx,g:user2:rwx' '/share/public' ");
        //   execSync(" setfacl -R -dm 'u::rwx,g::rwx,o::x,u:user1:rwx,g:user1:rwx,u:user2:rwx,g:user2:rwx' '/share/public' ");
        execSync("chown root:root '" + shares[i]["path"] + "'");
        execSync("setfacl -R -m 'u::rwx,g::rwx,o::x," + entries + "' '" + shares[i]["path"] + "'");
        execSync("setfacl -R -dm 'u::rwx,g::rwx,o::x," + entries + "' '" + shares[i]["path"] + "'");
        
        i++;
    }

    return true;
}



// TODO: review this function
function fnCreateGuest(guestdir){
    execSync("useradd guest");
    execSync("echo 'guest' | passwd guest --stdin");

    if (fs.existsSync(guestdir) !== true){
        fs.mkdirSync(guestdir);
    }

    execSync("chown root:root '" + guestdir + "'");
    execSync("setfacl -R -m 'u::rwx,g::rwx,o::rwx,u:guest:rwx,g:guest:rwx' '" + guestdir + "'");
    execSync("setfacl -R -dm 'u::rwx,g::rwx,o::rwx,u:guest:rwx,g:guest:rwx' '" + guestdir + "'");
}



// FUNCTION: fnGenSmbConf()
// INPUT: "domain": workgroup name; "guest": ignore for now; "shares": as in "/share/config.json"
// OUTPUT: "/etc/samba/smb.conf" generated content
// PURPOSE: generate "/etc/samba/smb.conf"
// NOTE: this function is safe because both "domain" and "shares" have been validated early
function fnGenSmbConf(domain, guest, shares){
    // final result will be written into "result" variable
    let result = "";
    
    // add the workgroup
    // EXAMPLE: domain == "WORKGROUP" --->
    //   result += "
    //     [global]
    //     workgroup = WORKGROUP
    //     security = user
    //   ";
    result += "[global]\nworkgroup = " + domain + "\nsecurity = user\n\n";

    // ignore for now
    if (guest !== false){
        result += "[guest]\npath = " + guest + "\nbrowsable = yes\nwritable = yes\nread only = no\nguest ok = yes\nforce user = guest\n\n";
    }

    // for each "share" in "shares" ...
    let i = 0;
    while (i < shares.length){
        
        // add the share in the configuration
        // EXAMPLE: shares[i] == { "name": "public", "path": "/share/public", "users": ["user1", "user2"] } --->
        //   result += "
        //     [public]
        //     path = /share/public
        //     browsable = yes
        //     writable = yes
        //     read only = no
        //     guest ok = no
        //     valid users = user1 user2
        //   ";
        result += "[" + shares[i]["name"] + "]\npath = " + shares[i]["path"] + "\nbrowsable = yes\nwritable = yes\nread only = no\nguest ok = no\nvalid users = " + shares[i]["users"].join(" ") + "\n\n";
        
        i++;
    }

    return result;
}



// FUNCTION: fnSleep()
// INPUT: "milliseconds" is the number of milliseconds to sleep
// PURPOSE: sleep function based on setTimeout() and promises
function fnSleep(milliseconds){
    return new Promise((resolve, reject) => {
        setTimeout(() => { resolve(); }, milliseconds);
    });
}


