


// exports
module.exports = fnGenSmbConf;



// dependencies
const fnHas = require("/startup/functions/fnHas.js");



// FUNCTION: fnGenSmbConf()
// INPUT: "config", as parsed from "/share/config.json"
// OUTPUT: "/etc/samba/smb.conf" generated content
// PURPOSE: generate "/etc/samba/smb.conf"
function fnGenSmbConf(config){
    const domain = config["domain"];
    const guest = config["guest"];
    const shares = config["shares"];

    // final result will be written into "result" variable
    let result = "";
    
    // add the global section
    result += `[global]\n`;
    result += `workgroup = ${domain}\n`;
    result += `security = user\n`;
    result += (guest !== false || shares.some((share) => { return fnHas(share, "guest"); })) ? `map to guest = Bad User\n` : `map to guest = Never\n`;
    result += `unix charset = UTF-8\n`;
    result += `dos charset = CP850\n`;
    result += `mangled names = yes\n`;
    result += `vfs objects = acl_xattr\n`;
    result += `map acl inherit = yes\n`;
    result += `store dos attributes = yes\n`;

    // add custom global entries from "global" property of "config.json"
    if (fnHas(config, "global")){
        result += config["global"].map((line) => { return (line + "\n"); }).join("");
    }
    result += "\n";

    // add guest share
    if (guest !== false){
        result += `[guest]\n`;
        result += `path = "${guest}"\n`;
        result += `browsable = yes\n`;
        result += `writable = yes\n`;
        result += `read only = no\n`;
        result += `guest ok = yes\n`;
        result += `force user = nobody\n\n`;
    }

    // for each "share" in "shares" ...
    shares.forEach((share) => {
        // if share is a guest share
        if (fnHas(share, "guest")){
            const perms = (share["guest"] === "rw") ? ["yes", "no"] : ["no", "yes"];
            result += `[${share["name"]}]\n`;
            result += `path = "${share["path"]}"\n`;
            result += `browsable = yes\n`;
            result += `writable = ${perms[0]}\n`;
            result += `read only = ${perms[1]}\n`;
            result += `guest ok = yes\n`;
            result += `force user = nobody\n\n`;            
        }
        else {
            // add the share in the configuration
            // EXAMPLE: share == { "name": "public", "path": "/share/public", "users": ["rw:user1", "ro:user2"] } --->
            //   result += "
            //     [public]
            //     path = /share/public
            //     browsable = yes
            //     writable = yes
            //     read only = no
            //     guest ok = no
            //     valid users = user1 user2
            //   ";
            const users = [];
            share["users"].forEach((user) => {
                users.push(user.substring(3));
            });
            result += `[${share["name"]}]\n`;
            result += `path = "${share["path"]}"\n`;
            result += `browsable = yes\n`;
            result += `writable = yes\n`;
            result += `read only = no\n`;
            result += `guest ok = no\n`;
            result += `valid users = ${users.join(" ")}\n\n`;
        }
    });

    return result;
}



