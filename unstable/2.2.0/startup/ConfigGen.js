/*
    LIST OF METHODS

    [static] [property] ConfigGen.version
    [static] ConfigGen.fromObject()
    [static] ConfigGen.fromJson()
    [static] ConfigGen.fromFile()
    [static] ConfigGen.fromRemote()
    [static] ConfigGen.genRandomPassword()

    config.saveToJson()
    config.saveToFile()
    config.saveToObject()
    config.saveToRemote()

    config.on()

    config.domain()
    config.version()

    config.users.add()
    config.users.addArray()
    config.users.remove()
    config.users.get()
    config.users.getAll()
    config.users.setPassword()

    config.groups.add()
    config.groups.addArray()
    config.groups.remove()
    config.groups.get()
    config.groups.getAll()
    config.groups.getMembers()
    config.groups.addMembers()
    config.groups.removeMembers()

    config.shares.add()
    config.shares.addArray()
    config.shares.remove()
    config.shares.get()
    config.shares.getAll()
    config.shares.getAccess()
    config.shares.setAccess()
    config.shares.addRules()
    config.shares.addRuleAt()
    config.shares.removeRuleAt()
    config.shares.removeAllRules()
    config.shares.setPath()
    config.shares.setGuest()
    config.shares.setFixedRules()
    config.shares.setBaseRules()
    config.shares.setSoftQuota()

    [static] ConfigGen.remote()
    remote.getConfig()
    remote.setConfig()
    remote.getInfo()
    remote.isReachable()
    remote.isTokenValid()
    remote.getRemoteLogs()
    remote.getAvailableAPI()
    remote.getConfigHash()
    remote.getConfigPath()
    remote.changeRemoteToken()
    remote.stopEasySamba()
    remote.pauseEasySamba()
    remote.startEasySamba()
    remote.certNego()

*/



// dependencies
const fs = require("fs");
const crypto = require("crypto");
const assert = require("assert");
const https = require("https");
const url = require("url");

// global variables
const globalVersion = "2.2";



// local utility functions

// fnIsArray()
//   checks if a given "input" is a valid Javascript array
const fnIsArray = (input) => {
    return Array.isArray(input);
};

// fnIsString()
//   checks if a given "input" is a valid Javascript string
const fnIsString = (input) => {
    return (input === String(input));
};

// fnHas()
//   checks if a given Javascript object "obj" has one or more specified properties
const fnHas = (obj, keys) => {
    if (obj === undefined || obj === null){
        return false;
    }

    const has = (obj, key) => { return Object.prototype.hasOwnProperty.call(obj, key); };

    const temp = (fnIsArray(keys)) ? keys : [keys];

    return temp.every((key) => { return has(obj, key); });
};

// fnIsInteger()
//   checks if a given Javascript object "input" is a valid integer
const fnIsInteger = (input) => {
    return Number.isInteger(input);
};

// fnIsFunction()
//   checks if a given Javascript object "obj" is a valid Javascript function
const fnIsFunction = (obj) => {
    return (obj === undefined || obj === null) ? false : (obj && {}.toString.call(obj) === "[object Function]");
};

// fnCopy()
//   makes a copy of a Javascript object
const fnCopy = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

// fnEqualArrays()
//   checks if two arrays are equal
const fnEqualArrays = (arr1, arr2) => {
    return (arr1.length === arr2.length && arr1.filter((e, i) => { return (e === arr2[i]); }).length === arr1.length);
};

// fnArrayEndsWith()
//   checks if a given array "obj" ends with elements "elems"
const fnArrayEndsWith = (obj, elems) => {
    if (elems.length === 0){
        return true;
    }
    if (obj.length < elems.length){
        return false;
    }
    const end = obj.slice(obj.length - elems.length, obj.length);
    return fnEqualArrays(end, elems);
};

// fnArrayStartsWith()
//   checks if a given array "obj" starts with elements "elems"
const fnArrayStartsWith = (obj, elems) => {
    if (elems.length === 0){
        return true;
    }
    if (obj.length < elems.length){
        return false;
    }
    const start = obj.slice(0, elems.length);
    return fnEqualArrays(start, elems);
};

// fnRemoveDuplicates()
//   returns input array without duplicates
// EXAMPLE: fnRemoveDuplicates([1, 2, 1, 3]) === [1, 2, 3]
const fnRemoveDuplicates = (input) => {
    let result = fnCopy(input);
    result = result.filter((e, i) => {
        return (result.indexOf(e) === i);
    });
    return result;
};

// fnRequestHTTPS()
//   makes an HTTPS request and returns a Promise
const fnRequestHTTPS = (urlStr, options, data = undefined) => {
    return new Promise((resolve, reject) => {
        let result = [];

        try {
            const req = https.request(urlStr, options, (res) => {
                res.on("data", (chunk) => {
                    result.push(chunk);
                });

                res.on("end", () => {
                    result = Buffer.concat(result).toString();
                    resolve(result);
                });
            });

            req.on("error", () => {
                reject(new Error("CANNOT-CONNECT"));
            });

            if (data !== undefined){
                req.write(data);
            }
            
            req.end();
        }
        catch (error){
            reject(new Error("CANNOT-CONNECT"));
        }
    });
};



// ConfigGen
//   this is the main class of the ConfigGen.js library
//   that is later exported
const ConfigGen = class {
    // this is the constructor
    //   it doesn't accept any parameters
    constructor(){
        // internal variables used by an instance of ConfigGen
        this["$domain"] = "WORKGROUP";
        this["$version"] = undefined;
        this["$users"] = [];
        this["$groups"] = [];
        this["$shares"] = [];
        
        // internal variable used for Remote API hash-checking
        this["$remote-hash"] = undefined;

        // events
        this["$on-user-add"] = [];
        this["$on-user-remove"] = [];
        this["$on-user-change"] = [];
        this["$on-user-change-password"] = [];
        this["$on-group-add"] = [];
        this["$on-group-remove"] = [];
        this["$on-group-change"] = [];
        this["$on-group-change-members"] = [];
        this["$on-share-add"] = [];
        this["$on-share-remove"] = [];
        this["$on-share-change"] = [];
        this["$on-share-change-access"] = [];
        this["$on-share-change-path"] = [];
        this["$on-share-change-guest"] = [];
        this["$on-share-change-softquota"] = [];

        // internal trigger function for events
        this["$trigger-stack"] = [];
        this["$trigger"] = (event, current, previous = undefined) => {
            if (fnHas(this, `$on-${event}`) !== true){
                return;
            }

            const cbs = this[`$on-${event}`];
            cbs.forEach((cb) => {
                if (this["$trigger-stack"].includes(cb)){
                    return;
                }
                this["$trigger-stack"].push(cb);
                try {
                    if (previous !== undefined){
                        cb(current, previous);
                    }
                    else {
                        cb(current);
                    }
                }
                catch (error){
                    // do nothing
                }
                this["$trigger-stack"].splice(this["$trigger-stack"].indexOf(cb), 1);
            });
        };

        // internal variable for config.shares.setFixedRules() function
        this["$fixedrules"] = { "shares": undefined, "rules": [] };

        // internal variable for config.shares.setBaseRules() function
        this["$baserules"] = { "shares": undefined, "rules": [] };

        // "users" namespace
        //   where functions like "config.users.add(...)" are located
        this.users = {
            // config.users.add()
            add: (...args) => {
                let username = undefined;
                let password = undefined;

                if (args.length === 1){
                    username = args[0];
                }
                else if (args.length === 2){
                    username = args[0];
                    password = args[1];
                }
                else {
                    throw new Error("INVALID-INPUT");
                }

                if (password === undefined || fnIsInteger(password)){
                    const len = (password === undefined || password < 4) ? 12 : password;
                    password = this.constructor.genRandomPassword(len);
                }

                if (fnIsString(username) !== true || username.length < 1 || fnIsString(password) !== true){
                    throw new Error("INVALID-INPUT");
                }

                if (this.users.get().includes(username) || this.groups.get().includes(username)){
                    throw new Error("INVALID-INPUT");
                }

                this["$users"].push({ "name": username, "password": password });

                // trigger event "user-add"
                this["$trigger"]("user-add", this.users.get(username));

                return this;
            },

            // config.users.addArray()
            addArray: (input) => {
                if (fnIsArray(input) !== true){
                    throw new Error("INVALID-INPUT");
                }

                input.forEach((elem) => {
                    try {
                        assert( fnHas(elem, "name") );
                        this.users.add(elem["name"], (fnHas(elem, "password")) ? elem["password"] : undefined);
                    }
                    catch (error){
                        throw new Error("INVALID-INPUT");
                    }
                });

                return this;
            },

            // config.users.remove()
            remove: (username) => {
                if (fnIsArray(username)){
                    username.forEach((e) => {
                        this.users.remove(e);
                    });
                    return this;
                }

                if (fnIsString(username) !== true){
                    throw new Error("INVALID-INPUT");
                }

                const index = this.users.get().indexOf(username);

                let removedUser = undefined;
                if (index >= 0){
                    removedUser = this.users.get(username);
                    this["$users"].splice(index, 1);
                }

                // trigger event "user-remove"
                if (removedUser !== undefined){
                    this["$trigger"]("user-remove", removedUser);
                }

                return this;
            },

            // config.users.get()
            get: (...args) => {
                if (args.length < 1){
                    return this["$users"].map((e) => { return e["name"]; });
                }

                const username = args[0];
                if (fnIsString(username) !== true){
                    throw new Error("INVALID-INPUT");
                }

                const index = this.users.get().indexOf(username);

                if (index < 0){
                    throw new Error("NOT-FOUND");
                }

                return fnCopy(this["$users"][index]);
            },

            // config.users.getAll()
            getAll: () => {
                return fnCopy(this["$users"]);
            },

            // config.users.setPassword()
            setPassword: (username, password) => {
                if (fnIsString(username) !== true || fnIsString(password) !== true){
                    throw new Error("INVALID-INPUT");
                }

                const index = this.users.get().indexOf(username);

                if (index < 0){
                    throw new Error("NOT-FOUND");
                }

                const previous = this.users.get(username);
                this["$users"][index]["password"] = password;

                // trigger event "user-change" and "user-change-password"
                const current = this.users.get(username);
                if (current["password"] !== previous["password"]){
                    this["$trigger"]("user-change", current, previous);
                    this["$trigger"]("user-change-password", current, previous);
                }

                return this;
            }
        };

        // "groups" namespace
        //   where functions like "config.groups.add(...)" are located
        this.groups = {
            // config.groups.add()
            add: (groupname, members) => {
                try {
                    assert( fnIsString(groupname) && groupname.length >= 1 );
                    assert( fnIsArray(members) && members.every(fnIsString) );
                    assert( this.groups.get().includes(groupname) !== true && this.users.get().includes(groupname) !== true );
                }
                catch (error){
                    throw new Error("INVALID-INPUT");
                }

                const members_unique = fnRemoveDuplicates(members);

                this["$groups"].push({ "name": groupname, "members": members_unique });

                // trigger event "group-add"
                this["$trigger"]("group-add", this.groups.get(groupname));

                return this;
            },

            // config.groups.addArray()
            addArray: (input) => {
                if (fnIsArray(input) !== true){
                    throw new Error("INVALID-INPUT");
                }

                input.forEach((elem) => {
                    try {
                        assert( fnHas(elem, ["name", "members"]) );
                        this.groups.add(elem["name"], elem["members"]);
                    }
                    catch (error){
                        throw new Error("INVALID-INPUT");
                    }
                });

                return this;
            },

            // config.groups.remove()
            remove: (groupname) => {
                if (fnIsArray(groupname)){
                    groupname.forEach((e) => {
                        this.groups.remove(e);
                    });
                    return this;
                }

                if (fnIsString(groupname) !== true){
                    throw new Error("INVALID-INPUT");
                }

                const index = this.groups.get().indexOf(groupname);

                let removedGroup = undefined;
                if (index >= 0){
                    removedGroup = this.groups.get(groupname);
                    this["$groups"].splice(index, 1);
                }

                // trigger event "group-remove"
                if (removedGroup !== undefined){
                    this["$trigger"]("group-remove", removedGroup);
                }

                return this;
            },

            // config.groups.get()
            get: (...args) => {
                if (args.length < 1){
                    return this["$groups"].map((e) => { return e["name"]; });
                }

                const groupname = args[0];

                if (fnIsString(groupname) !== true){
                    throw new Error("INVALID-INPUT");
                }

                const index = this.groups.get().indexOf(groupname);

                if (index < 0){
                    throw new Error("NOT-FOUND");
                }

                return fnCopy(this["$groups"][index]);
            },

            // config.groups.getAll()
            getAll: () => {
                return fnCopy(this["$groups"]);
            },

            // config.groups.getMembers()
            // TODO: make it possible to retrieve members of a deleted group
            getMembers: (groupname) => {
                try {
                    assert( fnIsString(groupname) );
                    assert( this.groups.get().includes(groupname) );
                }
                catch (error){
                    throw new Error("INVALID-INPUT");
                }

                let result = [groupname];
                const stack = [];
                let members = [];
                while ( fnEqualArrays(result, members) !== true ){
                    members = result;
                    result = [];
                    members.forEach((e) => {
                        if (this.groups.get().includes(e) && stack.includes(e) !== true){
                            stack.push(e);
                            result = result.concat(this.groups.get(e)["members"]);
                        }
                        else if (this.users.get().includes(e)){
                            result.push(e);
                        }
                    });
                }

                result = fnRemoveDuplicates(result);

                return fnCopy(result);
            },

            // config.groups.addMembers()
            addMembers: (groupname, members) => {
                if (fnIsString(groupname) !== true){
                    throw new Error("INVALID-INPUT");
                }

                if (fnIsArray(members) !== true || members.every(fnIsString) !== true){
                    throw new Error("INVALID-INPUT");
                }

                const index = this.groups.get().indexOf(groupname);

                if (index < 0){
                    throw new Error("NOT-FOUND");
                }

                const previous = this.groups.get(groupname);
                members.forEach((member) => {
                    if (this["$groups"][index]["members"].includes(member) !== true){
                        this["$groups"][index]["members"].push(member);
                    }
                });

                // trigger event "group-change" and "group-change-members"
                const current = this.groups.get(groupname);
                if (fnEqualArrays(current["members"], previous["members"]) !== true){
                    this["$trigger"]("group-change", current, previous);
                    this["$trigger"]("group-change-members", current, previous);
                }

                return this;
            },

            // config.groups.removeMembers()
            removeMembers: (groupname, members) => {
                if (fnIsString(groupname) !== true){
                    throw new Error("INVALID-INPUT");
                }

                if (fnIsArray(members) !== true || members.every(fnIsString) !== true){
                    throw new Error("INVALID-INPUT");
                }

                const index = this.groups.get().indexOf(groupname);

                if (index < 0){
                    throw new Error("NOT-FOUND");
                }

                const previous = this.groups.get(groupname);
                members.forEach((member) => {
                    const memberIndex = this["$groups"][index]["members"].indexOf(member);
                    if (memberIndex >= 0){
                        this["$groups"][index]["members"].splice(memberIndex, 1);
                    }
                });

                // trigger event "group-change" and "group-change-members"
                const current = this.groups.get(groupname);
                if (fnEqualArrays(current["members"], previous["members"]) !== true){
                    this["$trigger"]("group-change", current, previous);
                    this["$trigger"]("group-change-members", current, previous);
                }

                return this;
            }
        };

        // "shares" namespace
        //   where functions like "config.shares.add(...)" are located
        this.shares = {
            // config.shares.add()
            add: (...args) => {
                let sharename = undefined;
                let path = undefined;
                let access = undefined;
                let guest = "no";
                let softquota = undefined;

                if (args.length === 3){
                    sharename = args[0];
                    path = args[1];
                    access = args[2];
                }
                else if (args.length === 4){
                    sharename = args[0];
                    path = args[1];
                    access = args[2];
                    guest = args[3];
                }
                else if (args.length === 5){
                    sharename = args[0];
                    path = args[1];
                    access = args[2];
                    guest = args[3];
                    softquota = args[4];
                }
                else {
                    throw new Error("INVALID-INPUT");
                }

                if (fnIsString(sharename) !== true){
                    throw new Error("INVALID-INPUT");
                }

                if (fnIsString(path) !== true){
                    throw new Error("INVALID-INPUT");
                }

                if (this.shares.get().includes(sharename)){
                    throw new Error("INVALID-INPUT");
                }

                if (fnIsArray(access) !== true || access.every(fnIsString) !== true){
                    throw new Error("INVALID-INPUT");
                }

                if (guest !== "rw" && guest !== "ro" && guest !== "no") {
                    throw new Error("INVALID-INPUT");
                }
                
                if (softquota !== undefined){
                    try {
                        assert( fnHas(softquota, ["limit", "whitelist"]) );
                        assert( fnIsString(softquota["limit"]) );
                        assert( fnIsArray(softquota["whitelist"]) );
                        assert( softquota["whitelist"].every(fnIsString) );
                    }
                    catch (error){
                        throw new Error("INVALID-INPUT");
                    }
                }

                const share = { "name": sharename, "path": path, "access": fnCopy(access) };
                if (guest !== "no"){
                    share["guest"] = guest;
                }
                if (softquota !== undefined){
                    share["soft-quota"] = fnCopy(softquota);
                }
                this["$shares"].push(share);

                // trigger event "share-add"
                this["$trigger"]("share-add", this.shares.get(sharename));

                return this;
            },

            // config.shares.addArray()
            addArray: (input) => {
                if (fnIsArray(input) !== true){
                    throw new Error("INVALID-INPUT");
                }

                input.forEach((elem) => {
                    try {
                        assert( fnHas(elem, ["name", "path"]) );
                        assert( fnHas(elem, "access") || fnHas(elem, "guest") );
                        this.shares.add(elem["name"], elem["path"], (fnHas(elem, "access")) ? elem["access"] : [], (fnHas(elem, "guest")) ? elem["guest"] : "no", (fnHas(elem, "soft-quota")) ? elem["soft-quota"] : undefined);
                    }
                    catch (error){
                        throw new Error("INVALID-INPUT");
                    }
                });

                return this;
            },

            // config.shares.remove()
            remove: (sharename) => {
                if (fnIsArray(sharename)){
                    sharename.forEach((e) => {
                        this.shares.remove(e);
                    });
                    return this;
                }

                if (fnIsString(sharename) !== true){
                    throw new Error("INVALID-INPUT");
                }

                const index = this.shares.get().indexOf(sharename);

                let removedShare = undefined;
                if (index >= 0){
                    removedShare = this.shares.get(sharename);
                    this["$shares"].splice(index, 1);
                }

                // trigger event "share-remove"
                if (removedShare !== undefined){
                    this["$trigger"]("share-remove", removedShare);
                }

                return this;
            },

            // config.shares.get()
            get: (...args) => {
                if (args.length < 1){
                    return this["$shares"].map((e) => { return e["name"]; });
                }

                const sharename = args[0];

                if (fnIsString(sharename) !== true){
                    throw new Error("INVALID-INPUT");
                }

                const index = this.shares.get().indexOf(sharename);

                if (index < 0){
                    throw new Error("NOT-FOUND");
                }

                return fnCopy(this["$shares"][index]);
            },

            // config.shares.getAll()
            getAll: () => {
                return fnCopy(this["$shares"]);
            },

            // config.shares.getAccess()
            getAccess: (share) => {
                let rules = undefined;

                try {
                    assert( (fnIsString(share) && this.shares.get().includes(share)) || (fnHas(share, "access") && fnIsArray(share["access"]) && share["access"].every(fnIsString)) );
                    rules = (fnIsString(share)) ? this.shares.get(share)["access"] : share["access"];
                }
                catch (error){
                    throw new Error("INVALID-INPUT");
                }

                const result = {};

                rules.forEach((rule) => {
                    if ((rule.startsWith("ro:") || rule.startsWith("rw:") || rule.startsWith("no:")) && rule.length < 4){
                        return;
                    }
                    else if (rule.length < 1){
                        return;
                    }

                    let perm = "rw";
                    perm = (rule.startsWith("ro:")) ? "ro" : perm;
                    perm = (rule.startsWith("rw:")) ? "rw" : perm;
                    perm = (rule.startsWith("no:")) ? "no" : perm;
                    const user = (rule.startsWith("ro:") || rule.startsWith("rw:") || rule.startsWith("no:")) ? rule.substring(3) : rule;

                    let users = [];
                    if (user === "*"){
                        users = this.users.get();
                    }
                    else if (this.groups.get().includes(user)){
                        users = this.groups.getMembers(user);
                    }
                    else if (this.users.get().includes(user)){
                        users = [user];
                    }
                    else {
                        return;
                    }

                    users = fnRemoveDuplicates(users);

                    users.forEach((e) => {
                        if (perm === "no" && fnHas(result, e)){
                            delete result[e];
                        }
                        else if (perm === "rw" || perm === "ro"){
                            result[e] = (perm === "rw") ? "rw" : "r";
                        }
                    });
                });

                this.groups.get().forEach((g) => {
                    const members = this.groups.getMembers(g);
                    let ro = 0;
                    let rw = 0;
                    members.forEach((e) => {
                        if (fnHas(result, e)){
                            ro += 1;
                            if (result[e] === "rw"){
                                rw += 1;
                            }
                        }
                    });
                    if (ro > 0 && ro === members.length){
                        result[g] = "r";
                    }
                    if (rw > 0 && rw === members.length){
                        result[g] = "rw";
                    }
                });

                return fnCopy(result);
            },

            // config.shares.setAccess()
            //   SUPPORTED PERMISSIONS: +r, +w, +rw, rw, ro, -r, -w, -rw
            setAccess: (sharename, subject, perm) => {
                try {
                    assert( fnIsString(sharename) );
                    assert( this.shares.get().includes(sharename) );
                    assert( fnIsString(subject) || (fnIsArray(subject) && subject.every(fnIsString)) );
                    assert( ["+r", "+w", "+rw", "rw", "ro", "-r", "-w", "-rw"].includes(perm) );
                }
                catch (error){
                    throw new Error("INVALID-INPUT");
                }

                const subj = (fnIsArray(subject)) ? subject : [subject];
                let users = [];

                subj.forEach((s) => {
                    if (s === "*"){
                        users = users.concat(this.users.get());
                    }
                    else if (this.groups.get().includes(s)){
                        users = users.concat(this.groups.getMembers(s));
                    }
                    else if (this.users.get().includes(s)){
                        users.push(s);
                    }
                    else {
                        return;
                    }
                });

                users = fnRemoveDuplicates(users);

                const previous = this.shares.get(sharename);

                const access = this.shares.getAccess(sharename);
                users.forEach((user) => {
                    const currperm = { r: false, w: false };
                    if (fnHas(access, user)){
                        currperm.r = true;
                        currperm.w = (access[user] === "rw") ? true : false;
                    }

                    currperm.r = (["+r", "+w", "+rw", "rw", "ro"].includes(perm)) ? true : currperm.r;
                    currperm.r = (["-r", "-rw"].includes(perm)) ? false : currperm.r;
                    currperm.w = (["+w", "+rw", "rw"].includes(perm)) ? true : currperm.w;
                    currperm.w = (["ro", "-r", "-w", "-rw"].includes(perm)) ? false : currperm.w;

                    let ruleToAdd = undefined;
                    ruleToAdd = (currperm.r === true && currperm.w === false) ? "r" : ruleToAdd;
                    ruleToAdd = (currperm.r === true && currperm.w === true) ? "rw" : ruleToAdd;

                    if (ruleToAdd !== undefined){
                        access[user] = ruleToAdd;
                    }
                    else if (ruleToAdd === undefined && fnHas(access, user)){
                        delete access[user];
                    }
                });

                const rules = [];
                this.users.get().forEach((e) => {
                    if (fnHas(access, e)){
                        const perm = (access[e] === "rw") ? "rw" : "ro";
                        rules.push(`${perm}:${e}`);
                    }
                });
                const shareIndex = this.shares.get().indexOf(sharename);
                while (this["$shares"][shareIndex]["access"].length > 0){
                    this["$shares"][shareIndex]["access"].splice(0, 1);
                }
                this["$shares"][shareIndex]["access"] = fnCopy(rules);

                // trigger event "share-change" and "share-change-access"
                const current = this.shares.get(sharename);
                if (fnEqualArrays(current["access"], previous["access"]) !== true){
                    this["$trigger"]("share-change", current, previous);
                    this["$trigger"]("share-change-access", current, previous);
                }

                return this;
            },

            // config.shares.addRules()
            addRules: (sharename, rules) => {
                if (fnIsString(sharename) !== true){
                    throw new Error("INVALID-INPUT");
                }

                if (fnIsArray(rules) !== true || rules.every(fnIsString) !== true){
                    throw new Error("INVALID-INPUT");
                }

                const index = this.shares.get().indexOf(sharename);
                if (index < 0){
                    throw new Error("NOT-FOUND");
                }

                this.shares.addRuleAt(sharename, rules, this.shares.get(sharename)["access"].length);

                return this;
            },

            // config.shares.addRuleAt()
            addRuleAt: (sharename, rule, ruleIndex) => {
                // check parameters
                if (fnIsString(sharename) !== true){
                    throw new Error("INVALID-INPUT");
                }

                if (fnIsString(rule) !== true && (fnIsArray(rule) !== true || rule.every(fnIsString) !== true)){
                    throw new Error("INVALID-INPUT");
                }

                if (fnIsInteger(ruleIndex) !== true || ruleIndex < 0){
                    throw new Error("INVALID-INPUT");
                }

                // find share's index
                const index = this.shares.get().indexOf(sharename);
                if (index < 0){
                    throw new Error("NOT-FOUND");
                }

                // check ruleIndex range
                if (ruleIndex > this.shares.get(sharename)["access"].length){
                    throw new Error("INVALID-INPUT");
                }

                const rules = (fnIsString(rule)) ? [rule] : rule;

                // add the rules at the specified ruleIndex
                const previous = this.shares.get(sharename);
                rules.forEach((e, i) => {
                    this["$shares"][index]["access"].splice(ruleIndex + i, 0, e);
                });

                // trigger event "share-change" and "share-change-access"
                const current = this.shares.get(sharename);
                if (fnEqualArrays(current["access"], previous["access"]) !== true){
                    this["$trigger"]("share-change", current, previous);
                    this["$trigger"]("share-change-access", current, previous);
                }

                return this;
            },

            // config.shares.removeAllRules()
            removeAllRules: (...args) => {
                let sharename = undefined;
                let rulesToDelete = undefined;

                if (args.length === 1 && fnIsString(args[0])){
                    sharename = args[0];
                    rulesToDelete = this.shares.get(sharename)["access"];
                }
                else if (args.length === 2 && fnIsString(args[0]) && fnIsArray(args[1]) && args[1].every(fnIsString)) {
                    sharename = args[0];
                    rulesToDelete = args[1];
                }
                else {
                    throw new Error("INVALID-INPUT");
                }

                if (this.shares.get().includes(sharename) !== true){
                    throw new Error("NOT-FOUND");
                }

                const indices = this.shares.get(sharename)["access"].filter((e) => {
                    return rulesToDelete.includes(e);
                }).map((e, i) => {
                    return i;
                });

                this.shares.removeRuleAt(sharename, indices);

                return this;
            },

            // config.shares.removeRuleAt()
            removeRuleAt: (sharename, ruleIndices) => {
                if (fnIsString(sharename) !== true){
                    throw new Error("INVALID-INPUT");
                }

                if (fnIsInteger(ruleIndices) !== true && (fnIsArray(ruleIndices) !== true || ruleIndices.every(fnIsInteger) !== true)){
                    throw new Error("INVALID-INPUT");
                }

                const index = this.shares.get().indexOf(sharename);

                if (index < 0){
                    throw new Error("NOT-FOUND");
                }

                const previous = this.shares.get(sharename);
                const indices = (fnIsInteger(ruleIndices)) ? [ruleIndices] : ruleIndices;
                this["$shares"][index]["access"] = this["$shares"][index]["access"].map((e, i) => {
                    return (indices.includes(i)) ? undefined : e;
                });
                while (this["$shares"][index]["access"].includes(undefined)){
                    this["$shares"][index]["access"].splice(this["$shares"][index]["access"].indexOf(undefined), 1);
                }

                // trigger event "share-change" and "share-change-access"
                const current = this.shares.get(sharename);
                if (fnEqualArrays(current["access"], previous["access"]) !== true){
                    this["$trigger"]("share-change", current, previous);
                    this["$trigger"]("share-change-access", current, previous);
                }

                return this;
            },

            // config.shares.setPath()
            setPath: (sharename, path) => {
                if (fnIsString(sharename) !== true){
                    throw new Error("INVALID-INPUT");
                }

                if (fnIsString(path) !== true){
                    throw new Error("INVALID-INPUT");
                }

                const index = this.shares.get().indexOf(sharename);

                if (index < 0){
                    throw new Error("NOT-FOUND");
                }

                const previous = this.shares.get(sharename);
                this["$shares"][index]["path"] = path;

                // trigger event "share-change" and "share-change-path"
                const current = this.shares.get(sharename);
                if (current["path"] !== previous["path"]){
                    this["$trigger"]("share-change", current, previous);
                    this["$trigger"]("share-change-path", current, previous);
                }

                return this;
            },

            // config.shares.setGuest()
            setGuest: (sharename, permission) => {
                if (fnIsString(sharename) !== true){
                    throw new Error("INVALID-INPUT");
                }

                if (fnIsString(permission) !== true){
                    throw new Error("INVALID-INPUT");
                }

                if (permission !== "rw" && permission !== "ro" && permission !== "no"){
                    throw new Error("INVALID-INPUT");
                }

                const index = this.shares.get().indexOf(sharename);

                if (index < 0){
                    throw new Error("NOT-FOUND");
                }

                const previous = this.shares.get(sharename);
                if (permission === "no" && fnHas(this["$shares"][index], "guest")){
                    delete this["$shares"][index]["guest"];
                }
                else if (permission === "rw" || permission === "ro") {
                    this["$shares"][index]["guest"] = permission;
                }

                // trigger event "share-change" and "share-change-guest"
                const current = this.shares.get(sharename);
                if (fnHas(current, "guest") !== fnHas(previous, "guest") || current["guest"] !== previous["guest"]){
                    this["$trigger"]("share-change", current, previous);
                    this["$trigger"]("share-change-guest", current, previous);
                }

                return this;
            },

            // config.shares.setFixedRules()
            setFixedRules: (...args) => {
                let shares = undefined;
                let rules = undefined;
                
                try {
                    assert( args.length === 1 || args.length === 2 );
                    
                    shares = (args.length === 1) ? undefined : args[0];
                    rules = (args.length === 1) ? args[0] : args[1];
                    
                    assert( shares === undefined || (fnIsArray(shares) && shares.every(fnIsString)) );
                    assert( rules === undefined || (fnIsArray(rules) && rules.every(fnIsString)) );
                }
                catch (error){
                    throw new Error("INVALID-INPUT");
                }

                this["$fixedrules"]["shares"] = (shares === undefined) ? undefined : fnCopy(shares);
                this["$fixedrules"]["rules"] = (rules === undefined) ? [] : fnCopy(rules);

                return this;
            },

            // config.shares.setBaseRules()
            setBaseRules: (...args) => {
                let shares = undefined;
                let rules = undefined;
                
                try {
                    assert( args.length === 1 || args.length === 2 );
                    
                    shares = (args.length === 1) ? undefined : args[0];
                    rules = (args.length === 1) ? args[0] : args[1];
                    
                    assert( shares === undefined || (fnIsArray(shares) && shares.every(fnIsString)) );
                    assert( rules === undefined || (fnIsArray(rules) && rules.every(fnIsString)) );
                }
                catch (error){
                    throw new Error("INVALID-INPUT");
                }

                this["$baserules"]["shares"] = (shares === undefined) ? undefined : fnCopy(shares);
                this["$baserules"]["rules"] = (rules === undefined) ? [] : fnCopy(rules);

                return this;
            },
            
            // config.shares.setSoftQuota()
            setSoftQuota: (sharename, softquota) => {
                if (fnIsString(sharename) !== true){
                    throw new Error("INVALID-INPUT");
                }

                if (softquota !== undefined){
                    try {
                        assert( fnHas(softquota, ["limit", "whitelist"]) );
                        assert( fnIsString(softquota["limit"]) );
                        assert( fnIsArray(softquota["whitelist"]) );
                        assert( softquota["whitelist"].every(fnIsString) );
                    }
                    catch (error){
                        throw new Error("INVALID-INPUT");
                    }
                }

                const index = this.shares.get().indexOf(sharename);

                if (index < 0){
                    throw new Error("NOT-FOUND");
                }

                const previous = this.shares.get(sharename);
                if (softquota === undefined && fnHas(this["$shares"][index], "soft-quota")){
                    delete this["$shares"][index]["soft-quota"];
                }
                else {
                    this["$shares"][index]["soft-quota"] = fnCopy(softquota);
                }

                // trigger event "share-change" and "share-change-softquota"
                const current = this.shares.get(sharename);
                try {
                    assert( fnHas(current, "soft-quota") === fnHas(previous, "soft-quota") );
                    if (fnHas(current, "soft-quota")){
                        assert( current["soft-quota"]["limit"] === previous["soft-quota"]["limit"] );
                        assert( fnEqualArrays(current["soft-quota"]["whitelist"], previous["soft-quota"]["whitelist"]) );
                    }
                }
                catch (error){
                    this["$trigger"]("share-change", current, previous);
                    this["$trigger"]("share-change-softquota", current, previous);
                }

                return this;
            }
        };

        return this;
    }

    // ConfigGen.version
    static get version(){
        return globalVersion;
    }
    static set version(value){
        try {
            assert( fnHas(value, "question") );
            assert( fnIsString(value["question"]) );
            assert( value["question"] === "Is there an easter egg here?" );
            delete value["question"];
            value["M"] = "A";
            value["R"] = "T";
            value["I"] = "N";
            value["A"] = "!";
        }
        catch (error){
            throw new Error("READ-ONLY-PROPERTY");
        }
    }

    // ConfigGen.fromObject()
    static fromObject(input){
        const result = new this();

        try {
            if (fnHas(input, "domain")){
                result.domain(input["domain"]);
            }

            if (fnHas(input, "guest")){
                result.guest(input["guest"]);
            }

            if (fnHas(input, "version")){
                result.version(input["version"]);
            }

            if (fnHas(input, "users") && fnIsArray(input["users"])){
                result.users.addArray(input["users"]);
            }

            if (fnHas(input, "groups") && fnIsArray(input["groups"])){
                result.groups.addArray(input["groups"]);
            }

            if (fnHas(input, "shares") && fnIsArray(input["shares"])){
                result.shares.addArray(input["shares"]);
            }
            
            return result;
        }
        catch (error){
            throw new Error("INVALID-INPUT");
        }
    }

    // ConfigGen.fromJson()
    static fromJson(input){
        try {
            assert(fnIsString(input));
            const json = JSON.parse(input);
            return this.fromObject(json);
        }
        catch (error){
            throw new Error("INVALID-INPUT");
        }
    }

    // ConfigGen.fromFile()
    static fromFile(input){
        try {
            assert(fnIsString(input));
            const file = fs.readFileSync(input, "utf8");
            assert( fnIsString(file) );
            return this.fromJson(file);
        }
        catch (error){
            throw new Error("INVALID-INPUT");
        }
    }

    // ConfigGen.fromRemote()
    static async fromRemote(remote){
        let res = undefined;
        try {
            res = await remote.getConfig();
        }
        catch (error){
            throw new Error(error.message);
        }

        try {
            const ret = this.fromJson(res);
            ret["$remote-hash"] = remote.getConfigHash(res);
            return ret;
        }
        catch (error){
            throw new Error("INVALID-REMOTE-CONFIG");
        }
    }

    // ConfigGen.remote()
    static remote(hostname, port, token, ca = undefined){
        const c = class {
            constructor(hostname, port, token, ca = undefined){
                assert( fnIsString(hostname) );
                assert( fnIsInteger(port) && port > 0 );
                assert( fnIsString(token) );
                assert( ca === undefined || fnIsString(ca) );

                this["$url"] = url.parse("https://localhost:9595/api", true);
                this["$url"].hostname = hostname;
                this["$url"].port = port.toString();
                this.token = token;
                this.ca = ca;

                return this;
            }
            
            // remote.certNego()
            async certNego(){
                const salt = crypto.randomBytes(5).toString("hex").toUpperCase();
                const urlStr = url.format({
                    protocol: "https",
                    hostname: this["$url"].hostname,
                    port: this["$url"].port,
                    pathname: "/cert-nego-v3",
                    query: {
                        salt: salt
                    }
                });
                const token = this.token;
                
                // check if remote container is reachable
                try {
                    const tempRemote = ConfigGen.remote(this["$url"].hostname, parseInt(this["$url"].port, 10), token, "unsafe");
                    assert( (await tempRemote.isReachable()) === true );
                }
                catch (error){
                    throw new Error("CANNOT-CONNECT");
                }
                
                // get remote container's response and check that response is valid
                let certHash = undefined;
                let httpsCert = undefined;
                try {
                    const options = {
                        method: "GET",
                        rejectUnauthorized: false,
                        requestCert: true
                    };
                    
                    let result = await fnRequestHTTPS(urlStr, options);
                    result = JSON.parse(result);
                    assert( fnHas(result, ["jsonrpc", "result"]) );
                    assert( result["jsonrpc"] === "2.0" );
                    assert( fnHas(result["result"], ["cert", "hash"]) );
                    assert( [result.result.cert, result.result.hash].every(fnIsString) );
                    assert( fnHas(result, "error") ? (result["error"] === null) : true );
                    
                    httpsCert = result["result"]["cert"];
                    certHash = result["result"]["hash"];
                }
                catch (error){
                    throw new Error(`CERT-NEGO-NOT-SUPPORTED`);
                }
                
                // check if remote certificate is authentic
                try {
                    assert( certHash.toUpperCase() === crypto.createHash("sha512").update(`${httpsCert}:${token}:${salt}`, "utf8").digest("hex").toUpperCase() );
                    return httpsCert;
                }
                catch (error){
                    throw new Error(`INVALID-TOKEN`);
                }
            }
            
            async cmd(method, other = {}, tk = undefined){
                const urlStr = url.format(this["$url"]);
                const token = (tk === undefined) ? this.token : tk;
                let ca = this.ca;
                
                if (ca === undefined){
                    try {
                        ca = await this.certNego();
                        this.ca = ca;
                    }
                    catch (error){
                        if (error.message === "CANNOT-CONNECT"){
                            return { res: undefined, err: "CANNOT-CONNECT" };
                        }
                        else if (error.message === "INVALID-TOKEN"){
                            return { res: undefined, err: "REMOTE-API:INVALID-TOKEN" };
                        }
                        else {
                            ca = "global";
                            this.ca = "global";
                        }
                    }
                }
                
                const id = crypto.randomBytes(16).toString("hex").toUpperCase();
                const body = { "token": token };
                if (fnHas(other, "config.json")){
                    body["config.json"] = other["config.json"];
                }
                if (fnHas(other, "hash")){
                    body["hash"] = other["hash"];
                }
                if (fnHas(other, "new-token")){
                    body["new-token"] = other["new-token"];
                }
                if (fnHas(other, "message")){
                    body["message"] = other["message"];
                }
                const data = Buffer.from(JSON.stringify({ "jsonrpc": "2.0", "method": method, "id": id, "params": body }), "utf8");

                const options = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Length": data.length
                    }
                };
                if (ca === "unsafe") {
                    options.rejectUnauthorized = false;
                    options.requestCert = true;
                }
                else if (ca === "global"){
                    // do nothing
                }
                else if (fnIsString(ca)){
                    options.ca = ca;
                }
                
                let result = undefined;
                try {
                    result = await fnRequestHTTPS(urlStr, options, data);
                }
                catch (error){
                    return { res: undefined, err: "CANNOT-CONNECT" };
                }
                
                try {
                    result = JSON.parse(result);
                    assert( fnHas(result, ["jsonrpc", "result", "id"]) );
                    assert( result["jsonrpc"] === "2.0" );
                    assert( result["id"] === id );
                    assert( fnHas(result, "error") ? (result["error"] === null || fnIsString(result["error"])) : true );
                    
                    if (fnHas(result, "error") && result["error"] !== null){
                        return { res: undefined, err: result["error"] };
                    }
                    
                    return { res: result["result"], err: false };
                }
                catch (error){
                    return { res: undefined, err: "INVALID-RESPONSE" };
                }
            }

            // remote.getConfig()
            async getConfig(){
                const { res, err } = await this.cmd("get-config");
                try {
                    assert( err === false );
                    assert( fnIsString(res) );
                    return res;
                }
                catch (error){
                    throw new Error((err !== false) ? err : "INVALID-RESPONSE");
                }
            }
            
            // remote.getConfigHash()
            getConfigHash(input){
                try {
                    assert( fnIsString(input) );
                    return crypto.createHash("md5").update(input, "utf8").digest("hex").toUpperCase();
                }
                catch (error){
                    throw new Error("INVALID-INPUT");
                }
            }

            // remote.setConfig()
            async setConfig(configjson, hash = undefined){
                if (fnIsString(configjson) !== true || (hash !== undefined && fnIsString(hash) !== true)){
                    throw new Error("INVALID-INPUT");
                }
                
                const params = { "config.json": configjson };
                if (hash !== undefined){
                    params.hash = hash.toUpperCase();
                }
                const { res, err } = await this.cmd("set-config", params);
                try {
                    assert( err === false );
                    assert( res === "SUCCESS" );
                    return true;
                }
                catch (error){
                    if (err === "REMOTE-API:SET-CONFIG:CANNOT-WRITE"){
                        return false;
                    }
                    else {
                        throw new Error((err !== false) ? err : "INVALID-RESPONSE");
                    }
                }
            }

            // remote.getInfo()
            async getInfo(){
                const { res, err } = await this.cmd("get-info");
                try {
                    assert( err === false );
                    assert( fnHas(res, ["running", "version"]) );
                    assert( res["running"] === true || res["running"] === false );
                    assert( fnIsString(res["version"]) );
                    assert( fnHas(res, "config-path") ? fnIsString(res["config-path"]) : true );
                    return res;
                }
                catch (error){
                    throw new Error((err !== false) ? err : "INVALID-RESPONSE");
                }
            }
            
            // remote.isReachable()
            async isReachable(){
                const { res, err } = await this.cmd("hello", {}, "");
                
                if (err === "REMOTE-API:INVALID-TOKEN" || err === "REMOTE-API:API-NOT-SUPPORTED" || res === "world"){
                    return true;
                }
                else if (err === "CANNOT-CONNECT"){
                    return false;
                }
                else {
                    throw new Error(err);
                }
            }
            
            // remote.isTokenValid()
            async isTokenValid(customToken = undefined){
                if (customToken !== undefined){
                    if (fnIsString(customToken) !== true || customToken.length < 1){
                        return false;
                    }
                }
            
                const { res, err } = await this.cmd("hello", {}, customToken);
                
                if (res === "world" || err === "REMOTE-API:API-NOT-SUPPORTED"){
                    return true;
                }
                else if (err === "REMOTE-API:INVALID-TOKEN"){
                    return false;
                }
                else {
                    throw new Error(err);
                }
            }
            
            // remote.getRemoteLogs()
            async getRemoteLogs(){
                const { res, err } = await this.cmd("get-logs");
                try {
                    assert( err === false );
                    assert( fnHas(res, "easy-samba-logs") );
                    assert( fnIsString(res["easy-samba-logs"]) );
                    assert( fnHas(res, "remote-api-logs") ? fnIsString(res["remote-api-logs"]) : true );
                    return res;
                }
                catch (error){
                    throw new Error((err !== false) ? err : "INVALID-RESPONSE");
                }
            }
            
            // remote.getAvailableAPI()
            async getAvailableAPI(){
                const { res, err } = await this.cmd("get-available-api");
                try {
                    assert( err === false );
                    assert( fnHas(res, "available-api") );
                    assert( fnIsArray(res["available-api"]) );
                    assert( res["available-api"].every(fnIsString) );
                    return res["available-api"];
                }
                catch (error){
                    throw new Error((err !== false) ? err : "INVALID-RESPONSE");
                }
            }
            
            // remote.getConfigPath()
            async getConfigPath(){
                const { res, err } = await this.cmd("get-info");
                try {
                    assert( err === false );
                    assert( fnHas(res, "config-path") ? fnIsString(res["config-path"]) : true );
                }
                catch (error){
                    throw new Error((err !== false) ? err : "INVALID-RESPONSE");
                }
                
                if (fnHas(res, "config-path")){
                    return res["config-path"];
                }
                else {
                    throw new Error("UNKNOWN-INFORMATION");
                }
            }
            
            // remote.changeRemoteToken()
            async changeRemoteToken(newToken){
                try {
                    assert( fnIsString(newToken) );
                    assert( newToken.length > 0 );
                }
                catch (error){
                    throw new Error("INVALID-INPUT");
                }
            
                const { res, err } = await this.cmd("change-token", { "new-token": newToken });
                try {
                    assert( err === false );
                    assert( res === "SUCCESS" );
                    this.token = newToken;
                    return true;
                }
                catch (error){
                    if (err === "REMOTE-API:CHANGE-TOKEN:ERROR"){
                        return false;
                    }
                    else {
                        throw new Error((err !== false) ? err : "INVALID-RESPONSE");
                    }
                }
            }
            
            // remote.stopEasySamba()
            async stopEasySamba(message = ""){
                try {
                    assert( fnIsString(message) );
                }
                catch (error){
                    throw new Error("INVALID-INPUT");
                }
            
                const { res, err } = await this.cmd("stop-easy-samba", { "message": message });
                try {
                    assert( err === false );
                    assert( res === "SUCCESS" );
                    return true;
                }
                catch (error){
                    if (err === "REMOTE-API:STOP-EASY-SAMBA:ERROR"){
                        return false;
                    }
                    else {
                        throw new Error((err !== false) ? err : "INVALID-RESPONSE");
                    }
                }
            }
            
            // remote.pauseEasySamba()
            async pauseEasySamba(){
                const { res, err } = await this.cmd("pause-easy-samba");
                try {
                    assert( err === false );
                    assert( res === "SUCCESS" );
                    return true;
                }
                catch (error){
                    if (err === "REMOTE-API:PAUSE-EASY-SAMBA:ERROR"){
                        return false;
                    }
                    else {
                        throw new Error((err !== false) ? err : "INVALID-RESPONSE");
                    }
                }
            }
            
            // remote.startEasySamba()
            async startEasySamba(){
                const { res, err } = await this.cmd("start-easy-samba");
                try {
                    assert( err === false );
                    assert( res === "SUCCESS" );
                    return true;
                }
                catch (error){
                    if (err === "REMOTE-API:START-EASY-SAMBA:ERROR"){
                        return false;
                    }
                    else {
                        throw new Error((err !== false) ? err : "INVALID-RESPONSE");
                    }
                }
            }
        };

        let ret = undefined;
        try {
            ret = new c(hostname, port, token, ca);
        }
        catch (error){
            throw new Error("INVALID-INPUT");
        }

        return ret;
    }

    // ConfigGen.genRandomPassword()
    static genRandomPassword(len = 12){
        // check parameter "len"
        if (fnIsInteger(len) !== true || len < 4){
            throw new Error("INVALID-INPUT");
        }

        const randomNumber = (range) => {
            const TEMP = 256 % range;
            let result = undefined;
            while (result === undefined){
                const r = crypto.randomBytes(1).readUInt8(0);
                if (r >= TEMP){
                    result = r % range;
                }
            }
            return result;
        };

        const TABLE = [undefined, undefined, undefined, undefined];
        TABLE[0] = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];
        TABLE[1] = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
        TABLE[2] = ["0","1","2","3","4","5","6","7","8","9"];
        TABLE[3] = ["","!","\"","#","$","%","&","'","(",")","*","+",",","-",".","/",":",";","<","=",">","?","@","[","\\","]","^","_","`","{","|","}","~"];

        // generate a random string of (len - 4) length
        let result = [];
        while (result.length < len - 4){
            const r = randomNumber(95) + 32;
            const c = String.fromCharCode(r);
            result.push(c);
        }
        
        // insert 4 random chars of different kind inside the random string,
        //   so that the final string will have at least 1 lowercase letter, 1 uppercase letter, 1 digit and 1 symbol
        const kinds = [0, 1, 2, 3];
        while (kinds.length > 0){
            const r = randomNumber(kinds.length);
            const t = TABLE[kinds[r]];
            const r2 = randomNumber(t.length);
            const c = t[r2];
            
            const i = randomNumber(result.length + 1);
            if (i === result.length){
                result.push(c);
            }
            else {
                result.splice(i, 0, c);
            }
            
            kinds.splice(r, 1);
        }
        
        return result.join("");
    }
    
    // ConfigGen.getConfigPath()
    static getConfigPath(){
        try {
            assert( fs.existsSync("/startup/configdir.json") );
            const configdir = fs.readFileSync("/startup/configdir.json", "utf8");
            assert( fnIsString(configdir) );
            const path = JSON.parse(configdir);
            assert( fnIsString(path) );
            assert( fs.existsSync(path) );
            return path;
        }
        catch (error){
            return "/share/config";
        }
    }

    // config.saveToFile()
    saveToFile(path){
        try {
            fs.writeFileSync(path, this.saveToJson());
        }
        catch (error){
            throw new Error("CANNOT-SAVE-TO-FILE");
        }

        return this;
    }

    // config.saveToObject()
    saveToObject(){
        const result = {};

        if (fnIsString(this["$domain"]) !== true){
            throw new Error("INVALID-INPUT");
        }
        result["domain"] = this["$domain"];

        if (fnIsString(this["$version"])){
            result["version"] = this["$version"];
        }

        result["users"] = this["$users"];

        if (this["$groups"].length > 0){
            result["groups"] = this["$groups"];
        }

        result["shares"] = fnCopy(this["$shares"]);

        // apply base rules
        result["shares"].forEach((share) => {
            if (this["$baserules"]["shares"] !== undefined && this["$baserules"]["shares"].includes(share["name"]) !== true){
                return;
            }
            if (fnArrayStartsWith(share["access"], this["$baserules"]["rules"]) !== true){
                share["access"] = this["$baserules"]["rules"].concat(share["access"]);
            }
        });

        // apply fixed rules
        result["shares"].forEach((share) => {
            if (this["$fixedrules"]["shares"] !== undefined && this["$fixedrules"]["shares"].includes(share["name"]) !== true){
                return;
            }
            if (fnArrayEndsWith(share["access"], this["$fixedrules"]["rules"]) !== true){
                this["$fixedrules"]["rules"].forEach((rule) => {
                    while (share["access"].includes(rule)){
                        share["access"].splice(share["access"].indexOf(rule), 1);
                    }
                });
                this["$fixedrules"]["rules"].forEach((rule) => {
                    share["access"].push(rule);
                });
            }
        });

        return fnCopy(result);
    }

    // config.saveToJson()
    saveToJson(){
        try {
            const result = JSON.stringify(this.saveToObject());
            assert( fnIsString(result) );
            return result;
        }
        catch (error){
            throw new Error("CANNOT-SAVE-TO-JSON");
        }
    }

    // config.saveToRemote()
    async saveToRemote(remote, options = {}){
        let configjson = undefined;
        try {
            configjson = this.saveToJson();
        }
        catch (error){
            throw new Error("CANNOT-SAVE-TO-JSON");
        }

        let res = undefined;
        try {
            res = await remote.setConfig(configjson, (fnHas(options, "checkSavedHash") && options["checkSavedHash"] === true) ? this["$remote-hash"] : undefined);
        }
        catch (error){
            throw new Error(error.message);
        }
        
        try{
            assert( res === true );
            this["$remote-hash"] = (fnHas(options, "checkSavedHash") && options["checkSavedHash"] === true) ? remote.getConfigHash(configjson) : this["$remote-hash"];
            return true;
        }
        catch (error){
            return false;
        }
    }

    // config.on()
    on(event, cb){
        if (fnIsArray(event) && event.every(fnIsString)){
            event.forEach((e) => {
                this.on(e, cb);
            });
            return this;
        }

        if (fnIsString(event) !== true || fnHas(this, `$on-${event}`) !== true){
            throw new Error("INVALID-INPUT");
        }

        if (fnIsFunction(cb) !== true){
            throw new Error("INVALID-INPUT");
        }

        this[`$on-${event}`].push(cb);

        return this;
    }

    // config.domain()
    domain(input = undefined){
        if (arguments.length < 1){
            return this["$domain"];
        }

        if (fnIsString(input)){
            this["$domain"] = input;
            return this;
        }

        throw new Error("INVALID-INPUT");
    }

    // config.version()
    version(input = undefined){
        if (arguments.length < 1){
            return this["$version"];
        }

        if (fnIsString(input) || input === undefined){
            this["$version"] = input;
            return this;
        }

        throw new Error("INVALID-INPUT");
    }
};



// exports
module.exports = ConfigGen;



