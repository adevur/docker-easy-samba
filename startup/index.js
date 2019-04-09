
// we need "child_process" and "fs"
const { exec, execSync } = require("child_process");
const fs = require("fs");

// call the main function of this script
fnMain();

async function fnMain(){
    // load configuration from JSON file "/share/config.json"
    // TODO: what if this file doesn't exist? (HINT: abort)
    // TODO: what if this file isn't in JSON format? (HINT: abort)
    const config = JSON.parse(fs.readFileSync("/share/config.json", "utf8"));
    
    // TODO: chech if config.json has valid syntax and it's correct
    // HINT: if config isn't valid, then abort
    // fnValidateConfig(config);

    // reset permissions of "/share"
    execSync("setfacl -R -bn /share");
    execSync("chmod -R a+rX /share");
    
    // set permissions of "/share"
    // EXPLAIN: at first, we set that "/share" and all its children are owned by root:root
    //   and that only root can read or make changes to them
    execSync("chown -R root:root /share");
    execSync("setfacl -R -m 'u::rwx,g::rwx,o::x' /share");
    execSync("setfacl -R -dm 'u::rwx,g::rwx,o::x' /share");

    // TODO: add the capability of creating an anonymous share
    /*if (config["guest"] !== false){
        fnCreateGuest(config["guest"]);
    }*/

    // add the users in the container's OS and in SAMBA
    fnCreateUsers(config["users"]);

    // create the shares (if they don't exist) and set the correct ACLs for them
    fnCreateUsersShares(config["shares"]);

    // generate the SAMBA server configuration and write it to "/etc/samba/smb.conf"
    const smbconf = fnGenSmbConf(config["domain"], /*config["guest"]*/ false, config["shares"]);
    fs.writeFileSync("/etc/samba/smb.conf", smbconf);

    // start "nmbd" daemon, wait 2 seconds, and then start "smbd" daemon
    exec("/usr/sbin/nmbd --daemon --no-process-group");
    await fnSleep(2000);
    exec("/usr/sbin/smbd --daemon --no-process-group");
    
    // trick so that this script never exits
    // TODO: other alternatives must be considered
    forever();
}

// FUNCTION: fnCreateUsersShares()
// INPUT: "shares" object, as described in "/share/config.json"
// PURPOSE: create the shares (if they don't exist) and set the correct ACLs for them
function fnCreateUsersShares(shares){
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
}

// FUNCTION: fnCreateUsers()
// INPUT: "users" object, as described in "/share/config.json"
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
// PURPOSE: generate "/etc/samba/smb.conf"
// TODO: it's not safe
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

// sleep function based on setTimeout() and promises
function fnSleep(milliseconds){
    return new Promise((resolve, reject) => {
        setTimeout(() => { resolve(); }, milliseconds);
    });
}

// function so that this script never exits
// forever() just calls itself every 5 seconds
function forever(){
    setTimeout(() => { forever(); }, 5000);
}

