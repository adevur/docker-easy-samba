


// exports
module.exports = fnGenSmbConf;



// dependencies
const fnHas = require("/startup/functions/fnHas.js");



// FUNCTION: fnGenSmbConf()
// INPUT: "config", as parsed from "config.json"
// OUTPUT: "/etc/samba/smb.conf" generated content
// PURPOSE: generate "/etc/samba/smb.conf"
function fnGenSmbConf(config){
    const domain = config["domain"];
    const shares = config["shares"];

    // final result will be written into "result" variable
    let result = "";
    
    // add the global section
    result += `[global]\n`;
    result += `workgroup = ${domain}\n`;
    result += `security = user\n`;
    result += (shares.some((share) => { return fnHas(share, "guest"); })) ? `map to guest = Bad User\n` : `map to guest = Never\n`;
    result += (shares.some((share) => { return fnHas(share, "guest"); })) ? `guest account = nobody\n` : ``;
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

    // for each "share" in "shares" ...
    shares.forEach((share) => {
        // add the share in the configuration
        // EXAMPLE: share == { "name": "public", "path": "/share/public", "users": ["rw:user1", "ro:user2"] } --->
        //     [public]
        //     path = /share/public
        //     browsable = yes
        //     writable = yes
        //     read only = no
        //     guest ok = no
        //     valid users = user1 user2
        //     read list = user2
        //     write list = user1

        const all_users = share["users"].map((e) => { return e.substring(3); });
        const read_users = share["users"].filter((e) => { return e.startsWith("ro:"); }).map((e) => { return e.substring(3); });
        const write_users = share["users"].filter((e) => { return e.startsWith("rw:"); }).map((e) => { return e.substring(3); });

        if (fnHas(share, "guest")){
            all_users.push("nobody");
            if (share["guest"] === "rw"){
                write_users.push("nobody");
            }
            else {
                read_users.push("nobody");
            }
        }

        result += `[${share["name"]}]\n`;
        result += `path = "${share["path"]}"\n`;
        result += `browsable = yes\n`;
        result += `writable = yes\n`;
        result += `read only = no\n`;
        result += (fnHas(share, "guest")) ? `guest ok = yes\n` : `guest ok = no\n`;
        result += `valid users = ${all_users.join(" ")}\n`;
        result += (read_users.length > 0) ? `read list = ${read_users.join(" ")}\n` : ``;
        result += (write_users.length > 0) ? `write list = ${write_users.join(" ")}\n` : ``;
        result += `\n`;
    });

    return result;
}



