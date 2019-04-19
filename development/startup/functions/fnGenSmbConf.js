


// exports
module.exports = fnGenSmbConf;



// dependencies
// N/A



// FUNCTION: fnGenSmbConf()
// INPUT: "domain": workgroup name; "guest": guest share path (or "false"); "shares": as in "/share/config.json"
// OUTPUT: "/etc/samba/smb.conf" generated content
// PURPOSE: generate "/etc/samba/smb.conf"
function fnGenSmbConf(domain, guest, shares){
    // final result will be written into "result" variable
    let result = "";
    
    // add the workgroup
    // EXAMPLE: "domain" == "WORKGROUP" --->
    //   result += "
    //     [global]
    //     workgroup = WORKGROUP
    //     security = user
    //   ";
    // TODO: add "unix charset = UTF-8", "dos charset = CP850" and "mangled names = no"
    result += `[global]\nworkgroup = ${domain}\nsecurity = user\n\n`;

    // add guest share
    // EXAMPLE: "guest" == "/share/guest" --->
    //   result += "
    //     [guest]
    //     path = /share/guest
    //     browsable = yes
    //     writable = yes
    //     read only = no
    //     guest ok = yes
    //     force user = nobody
    //   ";
    if (guest !== false){
        result += `[guest]\npath = ${guest}\nbrowsable = yes\nwritable = yes\nread only = no\nguest ok = yes\nforce user = nobody\n\n`;
    }

    // for each "share" in "shares" ...
    shares.forEach((share) => {
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
        result += `[${share["name"]}]\npath = ${share["path"]}\nbrowsable = yes\nwritable = yes\nread only = no\nguest ok = no\nvalid users = ${users.join(" ")}\n\n`;
    });

    return result;
}



