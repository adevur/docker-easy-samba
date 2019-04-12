


// exports
module.exports = fnGenSmbConf;



// dependencies
// N/A



// FUNCTION: fnGenSmbConf()
// INPUT: "domain": workgroup name; "guest": ignore for now; "shares": as in "/share/config.json"
// OUTPUT: "/etc/samba/smb.conf" generated content
// PURPOSE: generate "/etc/samba/smb.conf"
// NOTE: this function is safe because both "domain" and "shares" have been validated early
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
    result += "[global]\nworkgroup = " + domain + "\nsecurity = user\n\n";

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
        result += "[guest]\npath = " + guest + "\nbrowsable = yes\nwritable = yes\nread only = no\nguest ok = yes\nforce user = nobody\n\n";
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



