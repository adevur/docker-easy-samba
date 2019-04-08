
const { exec, execSync } = require("child_process");
const fs = require("fs");

fnMain();

async function fnMain(){
    const config = JSON.parse(fs.readFileSync("/share/config.json", "utf8"));

    // set permissions of /share
    execSync("chown root:root /share");
    execSync("setfacl -R -m 'u::rwx,g::rwx,o::rwx' /share");
    execSync("setfacl -R -dm 'u::rwx,g::rwx,o::rwx' /share");

    /*if (config["guest"] !== false){
        fnCreateGuest(config["guest"]);
    }*/

    fnCreateUsers(config["users"]);

    fnCreateUsersShares(config["shares"]);

    const smbconf = fnGenSmbConf(config["domain"], config["guest"], config["shares"]);
    fs.writeFileSync("/etc/samba/smb.conf", smbconf);

    exec("/usr/sbin/nmbd --daemon --no-process-group");
    await fnSleep(2000);
    exec("/usr/sbin/smbd --daemon --no-process-group");
    forever();
}

function fnCreateUsersShares(shares){
    let i = 0;
    while (i < shares.length){
        if (fs.existsSync(shares[i]["path"]) !== true){
            fs.mkdirSync(shares[i]["path"]);
        }
        let j = 0;
        let entries = [];
        while (j < shares[i]["users"].length){
            entries.push("u:" + shares[i]["users"][j] + ":rwx,g:" + shares[i]["users"][j] + ":rwx");
            j++;
        }
        entries = entries.join(",");
        execSync("chown root:root '" + shares[i]["path"] + "'");
        execSync("setfacl -R -m 'u::rwx,g::rwx,o::x," + entries + "' '" + shares[i]["path"] + "'");
        execSync("setfacl -R -dm 'u::rwx,g::rwx,o::x," + entries + "' '" + shares[i]["path"] + "'");
        i++;
    }
}

function fnCreateUsers(users){
    let i = 0;
    while (i < users.length){
        execSync("useradd " + users[i]["name"]);
        execSync("echo '" + users[i]["password"] + "' | passwd " + users[i]["name"] + " --stdin");
        execSync("(echo '" + users[i]["password"] + "'; echo '" + users[i]["password"] + "') | smbpasswd -a " + users[i]["name"] + " -s");
        i++;
    }
}

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

function fnGenSmbConf(domain, guest, shares){
    let result = "[global]\nworkgroup = " + domain + "\nsecurity = user\n\n";

    if (guest !== false){
        result += "[guest]\npath = " + guest + "\nbrowsable = yes\nwritable = yes\nread only = no\nguest ok = yes\nforce user = guest\n\n";
    }

    let i = 0;
    while (i < shares.length){
        result += "[" + shares[i]["name"] + "]\npath = " + shares[i]["path"] + "\nbrowsable = yes\nwritable = yes\nread only = no\nguest ok = no\nvalid users = " + shares[i]["users"].join(" ") + "\n\n";
        i++;
    }

    return result;
}

function fnSleep(milliseconds){
    return new Promise((resolve, reject) => {
        setTimeout(() => { resolve(); }, milliseconds);
    });
}

function forever(){
    setTimeout(() => { forever(); }, 5000);
}

