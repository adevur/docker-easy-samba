/*
    LIST OF METHODS

    [static] [property] ConfigGen.version
    [static] ConfigGen.fromObject()
    [static] ConfigGen.fromJson()
    [static] ConfigGen.fromFile()
    [static] ConfigGen.fromRemote()
    [static] ConfigGen.genRandomPassword()

    [deprecated] [property] config.easysambaVersion

    config.saveToJson()
    config.saveToFile()
    config.saveToObject()
    config.saveToRemote()

    config.on()

    config.domain()
    [deprecated] config.guest()
    [deprecated] config.unsetGuest()
    config.version()
    [deprecated] config.unsetVersion()
    config.global()
    [deprecated] config.unsetGlobal()

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
    [deprecated] config.shares.removeRules()
    config.shares.removeRuleAt()
    config.shares.removeAllRules()
    config.shares.setPath()
    config.shares.setGuest()
    config.shares.setFixedRules()
    [deprecated] config.shares.unsetFixedRules()
    config.shares.setBaseRules()
    config.shares.setSoftQuota()

    [static] ConfigGen.remote()
    remote.getConfig()
    remote.setConfig()
    remote.getInfo()
    remote.hello()
    [deprecated] remote.getLogs()
    remote.getRemoteLogs()
    remote.getAvailableAPI()
    remote.getConfigHash()
    remote.getConfigPath()

*/



// dependencies
const fs = require("fs");
const crypto = require("crypto");
const assert = require("assert");
const https = require("https");

// global variables
const globalVersion = "1.16";



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
    const has = (obj, key) => { return Object.prototype.hasOwnProperty.call(obj, key); };

    const temp = (fnIsArray(keys)) ? keys : [keys];

    return temp.every((key) => { return has(obj, key); });
};

// fnIsInteger()
//   checks if a given Javascript object "input" is a valid integer
const fnIsInteger = (input) => {
    return ( input !== undefined && input === parseInt(String(input), 10) && Number.isNaN(input) !== true );
};

// fnIsFunction()
//   checks if a given Javascript object "obj" is a valid Javascript function
const fnIsFunction = (obj) => {
    return (obj && {}.toString.call(obj) === "[object Function]");
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



// ConfigGen
//   this is the main class of the ConfigGen.js library
//   that is later exported
const ConfigGen = class {
    // this is the constructor
    //   it doesn't accept any parameters
    constructor(){
        // in order to know which ConfigGen.js version we're using
        // DEPRECATED
        this.easysambaVersion = globalVersion;

        // internal variables used by an instance of ConfigGen
        this["$domain"] = "WORKGROUP";
        this["$version"] = undefined;
        this["$global"] = undefined;
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
                if (previous !== undefined){
                    cb(current, previous);
                }
                else {
                    cb(current);
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
                    throw new Error("ERROR: INVALID ARGUMENTS");
                }

                if (password === undefined || fnIsInteger(password)){
                    const len = (password === undefined || password < 4) ? 12 : password;
                    password = this.constructor.genRandomPassword(len);
                }

                if (fnIsString(username) !== true || username.length < 1 || fnIsString(password) !== true){
                    throw new Error("ERROR: USERNAME AND PASSWORD MUST BE NON-EMPTY STRINGS");
                }

                if (this.users.get().includes(username) || this.groups.get().includes(username)){
                    throw new Error("ERROR: USERNAME ALREADY USED");
                }

                this["$users"].push({ "name": username, "password": password });

                // trigger event "user-add"
                this["$trigger"]("user-add", this.users.get(username));

                return this;
            },

            // config.users.addArray()
            addArray: (input) => {
                if (fnIsArray(input) !== true){
                    throw new Error("ERROR: INPUT MUST BE AN ARRAY");
                }

                input.forEach((elem) => {
                    if (fnHas(elem, "name") !== true){
                        throw new Error("ERROR: INPUT IS NOT VALID");
                    }
                    this.users.add(elem["name"], (fnHas(elem, "password")) ? elem["password"] : undefined);
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
                    throw new Error("ERROR: USERNAME MUST BE A STRING");
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
                    throw new Error("ERROR: USERNAME MUST BE A STRING");
                }

                const index = this.users.get().indexOf(username);

                if (index < 0){
                    throw new Error("ERROR: USER NOT FOUND");
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
                    throw new Error("ERROR: USERNAME AND PASSWORD MUST BE STRINGS");
                }

                const index = this.users.get().indexOf(username);

                if (index < 0){
                    throw new Error("ERROR: USER NOT FOUND");
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
                if (fnIsString(groupname) !== true || groupname.length < 1){
                    throw new Error("ERROR: GROUP NAME MUST BE A NON-EMPTY STRING");
                }

                if (fnIsArray(members) !== true || members.every(fnIsString) !== true){
                    throw new Error("ERROR: MEMBERS MUST BE AN ARRAY OF STRINGS");
                }

                if (this.groups.get().includes(groupname) || this.users.get().includes(groupname)){
                    throw new Error("ERROR: GROUP NAME ALREADY USED");
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
                    throw new Error("ERROR: INPUT MUST BE AN ARRAY");
                }

                input.forEach((elem) => {
                    if (fnHas(elem, ["name", "members"]) !== true){
                        throw new Error("ERROR: INPUT IS NOT VALID");
                    }
                    this.groups.add(elem["name"], elem["members"]);
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
                    throw new Error("ERROR: GROUP NAME MUST BE A STRING");
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
                    throw new Error("ERROR: GROUP NAME MUST BE A STRING");
                }

                const index = this.groups.get().indexOf(groupname);

                if (index < 0){
                    throw new Error("ERROR: GROUP NOT FOUND");
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
                    throw new Error("ERROR: INVALID INPUT");
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
                const addMember = (groupname, member) => {
                    if (this["$groups"][index]["members"].includes(member) !== true){
                        this["$groups"][index]["members"].push(member);
                    }
                };

                if (fnIsString(groupname) !== true){
                    throw new Error("ERROR: GROUP NAME MUST BE A STRING");
                }

                if (fnIsArray(members) !== true || members.every(fnIsString) !== true){
                    throw new Error("ERROR: MEMBERS MUST BE AN ARRAY OF STRINGS");
                }

                const index = this.groups.get().indexOf(groupname);

                if (index < 0){
                    throw new Error("ERROR: GROUP NOT FOUND");
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
                    throw new Error("ERROR: GROUP NAME MUST BE A STRING");
                }

                if (fnIsArray(members) !== true || members.every(fnIsString) !== true){
                    throw new Error("ERROR: MEMBERS MUST BE AN ARRAY OF STRINGS");
                }

                const index = this.groups.get().indexOf(groupname);

                if (index < 0){
                    throw new Error("ERROR: GROUP NOT FOUND");
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
                    access = (fnIsArray(args[2])) ? args[2] : [];
                    guest = (fnIsString(args[2])) ? args[2] : "no";
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
                    throw new Error("ERROR: INPUT IS NOT VALID");
                }

                if (fnIsString(sharename) !== true){
                    throw new Error("ERROR: SHARE NAME MUST BE A STRING");
                }

                if (fnIsString(path) !== true){
                    throw new Error("ERROR: SHARE PATH MUST BE A STRING");
                }

                if (this.shares.get().includes(sharename)){
                    throw new Error("ERROR: SHARE ALREADY EXISTS");
                }

                if (fnIsArray(access) !== true || access.every(fnIsString) !== true){
                    throw new Error("ERROR: SHARE ACCESS RULES MUST BE AN ARRAY OF STRINGS");
                }

                if (guest !== "rw" && guest !== "ro" && guest !== "no") {
                    throw new Error("ERROR: SHARE GUEST PROPERTY MUST BE EQUAL TO 'rw', 'ro' OR 'no'");
                }
                
                if (softquota !== undefined){
                    try {
                        assert( fnHas(softquota, ["limit", "whitelist"]) );
                        assert( fnIsString(softquota["limit"]) );
                        assert( fnIsArray(softquota["whitelist"]) );
                        assert( softquota["whitelist"].every(fnIsString) );
                    }
                    catch (error){
                        throw new Error("ERROR: SHARE SOFT-QUOTA IS INVALID");
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
                    throw new Error("ERROR: INPUT MUST BE AN ARRAY");
                }

                input.forEach((elem) => {
                    if (fnHas(elem, ["name", "path"]) !== true){
                        throw new Error("ERROR: INPUT IS NOT VALID");
                    }
                    if (fnHas(elem, "access") !== true && fnHas(elem, "guest") !== true){
                        throw new Error("ERROR: INPUT IS NOT VALID");
                    }
                    this.shares.add(elem["name"], elem["path"], (fnHas(elem, "access")) ? elem["access"] : [], (fnHas(elem, "guest")) ? elem["guest"] : "no", (fnHas(elem, "soft-quota")) ? elem["soft-quota"] : undefined);
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
                    throw new Error("ERROR: SHARE NAME MUST BE A STRING");
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
                    throw new Error("ERROR: SHARE NAME MUST BE A STRING");
                }

                const index = this.shares.get().indexOf(sharename);

                if (index < 0){
                    throw new Error("ERROR: SHARE NOT FOUND");
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
                    throw new Error("ERROR: INVALID INPUT");
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
                    throw new Error("ERROR: INVALID INPUT");
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
                    throw new Error("ERROR: SHARE NAME MUST BE A STRING");
                }

                if (fnIsArray(rules) !== true || rules.every(fnIsString) !== true){
                    throw new Error("ERROR: RULES MUST BE AN ARRAY OF STRINGS");
                }

                const index = this.shares.get().indexOf(sharename);
                if (index < 0){
                    throw new Error("ERROR: SHARE NOT FOUND");
                }

                this.shares.addRuleAt(sharename, rules, this.shares.get(sharename)["access"].length);

                return this;
            },

            // config.shares.addRuleAt()
            addRuleAt: (sharename, rule, ruleIndex) => {
                // check parameters
                if (fnIsString(sharename) !== true){
                    throw new Error("ERROR: SHARE NAME MUST BE A STRING");
                }

                if (fnIsString(rule) !== true && (fnIsArray(rule) !== true || rule.every(fnIsString) !== true)){
                    throw new Error("ERROR: RULE MUST BE A STRING OR AN ARRAY OF STRINGS");
                }

                if (fnIsInteger(ruleIndex) !== true || ruleIndex < 0){
                    throw new Error("ERROR: INDEX MUST BE A POSITIVE INTEGER");
                }

                // find share's index
                const index = this.shares.get().indexOf(sharename);
                if (index < 0){
                    throw new Error("ERROR: SHARE NOT FOUND");
                }

                // check ruleIndex range
                if (ruleIndex > this.shares.get(sharename)["access"].length){
                    throw new Error("ERROR: INDEX OUT OF RANGE");
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

            // config.shares.removeRules()
            // DEPRECATED
            removeRules: (sharename, rules) => {
                console.log("[WARNING] 'config.shares.removeRules() is deprecated. Use 'config.shares.removeRuleAt()', instead.'");

                if (fnIsString(sharename) !== true){
                    throw new Error("ERROR: SHARE NAME MUST BE A STRING");
                }

                if (fnIsArray(rules) !== true || rules.every(fnIsString) !== true){
                    throw new Error("ERROR: RULES MUST BE AN ARRAY OF STRINGS");
                }

                const index = this.shares.get().indexOf(sharename);
                if (index < 0){
                    throw new Error("ERROR: SHARE NOT FOUND");
                }

                let indices = rules.map((e) => {
                    const i = this.shares.get(sharename)["access"].indexOf(e);
                    return (i < 0) ? undefined : i;
                }).filter((e) => {
                    return (e !== undefined);
                });

                indices = fnRemoveDuplicates(indices);

                this.shares.removeRuleAt(sharename, indices);

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
                    throw new Error("ERROR: INPUT IS NOT VALID");
                }

                if (this.shares.get().includes(sharename) !== true){
                    throw new Error("ERROR: SHARE NOT FOUND");
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
                    throw new Error("ERROR: SHARE NAME MUST BE A STRING");
                }

                if (fnIsInteger(ruleIndices) !== true && (fnIsArray(ruleIndices) !== true || ruleIndices.every(fnIsInteger) !== true)){
                    throw new Error("ERROR: RULE INDEX MUST BE A POSITIVE INTEGER OR AN ARRAY OF POSITIVE INTEGERS");
                }

                const index = this.shares.get().indexOf(sharename);

                if (index < 0){
                    throw new Error("ERROR: SHARE NOT FOUND");
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
                    throw new Error("ERROR: SHARE NAME MUST BE A STRING");
                }

                if (fnIsString(path) !== true){
                    throw new Error("ERROR: PATH MUST BE A STRING");
                }

                const index = this.shares.get().indexOf(sharename);

                if (index < 0){
                    throw new Error("ERROR: SHARE NOT FOUND");
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
                    throw new Error("ERROR: SHARE NAME MUST BE A STRING");
                }

                if (fnIsString(permission) !== true){
                    throw new Error("ERROR: PERMISSION MUST BE A STRING");
                }

                if (permission !== "rw" && permission !== "ro" && permission !== "no"){
                    throw new Error("ERROR: PERMISSION MUST BE EQUAL TO 'rw', 'ro' OR 'no'");
                }

                const index = this.shares.get().indexOf(sharename);

                if (index < 0){
                    throw new Error("ERROR: SHARE NOT FOUND");
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

                if (args.length === 1 && fnIsArray(args[0]) && args[0].every(fnIsString)){
                    rules = args[0];
                }
                else if (args.length === 2 && fnIsArray(args[0]) && args[0].every(fnIsString) && fnIsArray(args[1]) && args[1].every(fnIsString)){
                    shares = args[0];
                    rules = args[1];
                }
                else {
                    throw new Error("ERROR: INVALID INPUT");
                }

                this["$fixedrules"]["shares"] = (shares === undefined) ? undefined : fnCopy(shares);
                this["$fixedrules"]["rules"] = fnCopy(rules);

                return this;
            },

            // config.shares.unsetFixedRules()
            // DEPRECATED
            unsetFixedRules: () => {
                console.log(`[WARNING] 'config.shares.unsetFixedRules()' is deprecated. Use 'config.shares.setFixedRules([])'.`);
                this.shares.setFixedRules([]);
                return this;
            },

            // config.shares.setBaseRules()
            setBaseRules: (...args) => {
                let shares = undefined;
                let rules = undefined;

                if (args.length === 1 && fnIsArray(args[0]) && args[0].every(fnIsString)){
                    rules = args[0];
                }
                else if (args.length === 2 && fnIsArray(args[0]) && args[0].every(fnIsString) && fnIsArray(args[1]) && args[1].every(fnIsString)){
                    shares = args[0];
                    rules = args[1];
                }
                else {
                    throw new Error("ERROR: INVALID INPUT");
                }

                this["$baserules"]["shares"] = (shares === undefined) ? undefined : fnCopy(shares);
                this["$baserules"]["rules"] = fnCopy(rules);

                return this;
            },
            
            // config.shares.setSoftQuota()
            setSoftQuota: (sharename, softquota) => {
                if (fnIsString(sharename) !== true){
                    throw new Error("ERROR: SHARE NAME MUST BE A STRING");
                }

                if (softquota !== undefined){
                    try {
                        assert( fnHas(softquota, ["limit", "whitelist"]) );
                        assert( fnIsString(softquota["limit"]) );
                        assert( fnIsArray(softquota["whitelist"]) );
                        assert( softquota["whitelist"].every(fnIsString) );
                    }
                    catch (error){
                        throw new Error("ERROR: SHARE SOFT-QUOTA IS INVALID");
                    }
                }

                const index = this.shares.get().indexOf(sharename);

                if (index < 0){
                    throw new Error("ERROR: SHARE NOT FOUND");
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
        throw new Error("ERROR: YOU CANNOT MODIFY 'ConfigGen.version' PROPERTY");
    }

    // ConfigGen.fromObject()
    static fromObject(input){
        const result = new this();

        if (fnHas(input, "domain")){
            result.domain(input["domain"]);
        }

        if (fnHas(input, "guest")){
            result.guest(input["guest"]);
        }

        if (fnHas(input, "version")){
            result.version(input["version"]);
        }

        if (fnHas(input, "global")){
            result.global(input["global"]);
        }

        if (fnHas(input, "users") && fnIsArray(input["users"])){
            result.users.addArray(input["users"]);
        }

        if (fnHas(input, "groups") && fnIsArray(input["groups"])){
            const groups = fnCopy(input["groups"]);
            groups.forEach((group) => {
                if (fnHas(group, "users") && fnHas(group, "members") !== true && fnIsArray(group["users"]) && group["users"].every(fnIsString)){
                    const backup = fnCopy(group["users"]);
                    delete group["users"];
                    group["members"] = backup;
                }
            });
            result.groups.addArray(groups);
        }

        if (fnHas(input, "shares") && fnIsArray(input["shares"])){
            result.shares.addArray(input["shares"]);
        }

        return result;
    }

    // ConfigGen.fromJson()
    static fromJson(input){
        try {
            assert(fnIsString(input));
            const json = JSON.parse(input);
            return this.fromObject(json);
        }
        catch (error){
            throw new Error("ERROR: INVALID INPUT");
        }
    }

    // ConfigGen.fromFile()
    static fromFile(input){
        try {
            assert(fnIsString(input));
            const file = fs.readFileSync(input, "utf8");
            return this.fromJson(file);
        }
        catch (error){
            throw new Error("ERROR: INVALID INPUT");
        }
    }

    // ConfigGen.fromRemote()
    static async fromRemote(...args){
        let remote = undefined;
        let url = undefined;
        let token = undefined;
        let ca = undefined;

        if (args.length === 1){
            remote = args[0];
        }
        else if (args.length === 2){
            url = args[0];
            token = args[1];
        }
        else if (args.length === 3){
            url = args[0];
            token = args[1];
            ca = args[2];
        }
        else {
            throw new Error("ERROR: INVALID INPUT");
        }

        try {
            if (remote === undefined){
                assert( fnIsString(url) && fnIsString(token) );
                const u = new URL(url);
                remote = this.remote(u.hostname, parseInt(u.port, 10), token, ca);
            }
        }
        catch (error){
            throw new Error("ERROR: INVALID INPUT");
        }

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
            throw new Error("ERROR: REMOTE CONFIGURATION FILE IS NOT VALID");
        }
    }

    // ConfigGen.remote()
    static remote(hostname, port, token, ca = undefined){
        const c = class {
            constructor(hostname, port, token, ca = undefined){
                assert( fnIsString(hostname) );
                assert( fnIsInteger(port) );
                assert( fnIsString(token) );
                assert( ca === undefined || fnIsString(ca) );

                this.url = new URL("https://localhost:9595/api");
                this.url.hostname = hostname;
                this.url.port = port;
                this.url = this.url.toString();
                this.token = token;
                this.ca = ca;

                return this;
            }

            cmd(method, other = {}){
                const url = this.url;
                const token = this.token;
                const ca = this.ca;

                return new Promise((resolve, reject) => {
                    const id = crypto.randomBytes(16).toString("hex").toUpperCase();
                    const body = { "token": token };
                    if (fnHas(other, "config.json")){
                        body["config.json"] = other["config.json"];
                    }
                    if (fnHas(other, "hash")){
                        body["hash"] = other["hash"];
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
                    else if (fnIsString(ca)){
                        options.ca = ca;
                    }

                    let result = [];

                    try {
                        const req = https.request(url, options, (res) => {
                            res.on("data", (chunk) => {
                                result.push(chunk);
                            });

                            res.on("end", () => {
                                try {
                                    result = Buffer.concat(result).toString();
                                    result = JSON.parse(result);
                                    assert( fnHas(result, ["jsonrpc", "result", "id"]) );
                                    assert( result["jsonrpc"] === "2.0" );
                                    assert( result["id"] === id );
                                    assert( fnHas(result, "error") ? (result["error"] === null || fnIsString(result["error"])) : true );
                                    
                                    if (fnHas(result, "error") && result["error"] !== null){
                                        resolve({ res: undefined, err: result["error"] });
                                        return;
                                    }
                                    
                                    resolve({ res: result["result"], err: false });
                                }
                                catch (error){
                                    resolve({ res: undefined, err: "INVALID-RESPONSE" });
                                }
                            });
                        });

                        req.on("error", () => {
                            resolve({ res: undefined, err: "CANNOT-CONNECT" });
                        });

                        req.write(data);
                        req.end();
                    }
                    catch (error){
                        resolve({ res: undefined, err: "CANNOT-CONNECT" });
                    }
                });
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
                    throw new Error("ERROR: INVALID INPUT");
                }
            }

            // remote.setConfig()
            async setConfig(configjson, hash = undefined){
                if (fnIsString(configjson) !== true || (hash !== undefined && fnIsString(hash) !== true)){
                    throw new Error("ERROR: INVALID INPUT");
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
                    throw new Error((err !== false) ? err : "INVALID-RESPONSE");
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
                    return { running: res.running, version: res.version };
                }
                catch (error){
                    throw new Error((err !== false) ? err : "INVALID-RESPONSE");
                }
            }

            // remote.hello()
            async hello(){
                const { res, err } = await this.cmd("hello");
                try {
                    assert( err === false );
                    assert( res === "world" );
                    return "world";
                }
                catch (error){
                    throw new Error((err !== false) ? err : "INVALID-RESPONSE");
                }
            }
            
            // remote.getLogs()
            // DEPRECATED
            async getLogs(){
                const { res, err } = await this.cmd("get-logs");
                try {
                    assert( err === false );
                    assert( fnHas(res, "easy-samba-logs") );
                    assert( fnIsString(res["easy-samba-logs"]) );
                    return res["easy-samba-logs"];
                }
                catch (error){
                    throw new Error((err !== false) ? err : "INVALID-RESPONSE");
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
        };

        let ret = undefined;
        try {
            ret = new c(hostname, port, token, ca);
        }
        catch (error){
            throw new Error("ERROR: INVALID INPUT");
        }

        return ret;
    }

    // ConfigGen.genRandomPassword()
    static genRandomPassword(len = 12){
        // check parameter "len"
        if (fnIsInteger(len) !== true || len < 4){
            throw new Error("ERROR: PASSWORD LENGTH MUST BE AT LEAST 4");
        }

        const TABLE = {};
        TABLE["lcl"] = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];
        TABLE["ucl"] = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
        TABLE["dig"] = ["0","1","2","3","4","5","6","7","8","9"];
        TABLE["sym"] = ["","!","\"","#","$","%","&","'","(",")","*","+",",","-",".","/",":",";","<","=",">","?","@","[","\\","]","^","_","`","{","|","}","~"];

        let result = Array.from({ length: len }, () => { return undefined; });
        let lcl = 0;
        let ucl = 0;
        let dig = 0;
        let sym = 0;
        let missing = undefined;

        while (result.includes(undefined)){
            result = result.map((e) => {
                if (e === undefined && missing === undefined){
                    let c = crypto.randomBytes(1).readUInt8();
                    c = (c % 95) + 32;
                    c = String.fromCharCode(c);
                    return c;
                }
                else if (e === undefined && missing !== undefined){
                    let c = crypto.randomBytes(1).readUInt8();
                    c = c % TABLE[missing].length;
                    c = TABLE[missing][c];
                    return c;
                }
                else {
                    return e;
                }
            });

            lcl = 0;
            ucl = 0;
            dig = 0;
            sym = 0;
            missing = undefined;

            result.forEach((c) => {
                lcl = (TABLE["lcl"].includes(c)) ? (lcl + 1) : lcl;
                ucl = (TABLE["ucl"].includes(c)) ? (ucl + 1) : ucl;
                dig = (TABLE["dig"].includes(c)) ? (dig + 1) : dig;
            });
            sym = result.length - lcl - ucl - dig;

            missing = (lcl === 0) ? "lcl" : missing;
            missing = (ucl === 0) ? "ucl" : missing;
            missing = (dig === 0) ? "dig" : missing;
            missing = (sym === 0) ? "sym" : missing;

            if (missing !== undefined){
                let running = true;
                result = result.map((e) => {
                    if (running === true && lcl > 1 && TABLE["lcl"].includes(e)){
                        running = false;
                        return undefined;
                    }
                    else if (running === true && ucl > 1 && TABLE["ucl"].includes(e)){
                        running = false;
                        return undefined;
                    }
                    else if (running === true && dig > 1 && TABLE["dig"].includes(e)){
                        running = false;
                        return undefined;
                    }
                    else if (running === true && sym > 1 && TABLE["sym"].includes(e)){
                        running = false;
                        return undefined;
                    }
                    else {
                        return e;
                    }
                });
            }
        }

        result = result.join("");

        return result;
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
            return "/share";
        }
    }

    // config.saveToFile()
    saveToFile(path){
        try {
            fs.writeFileSync(path, this.saveToJson());
        }
        catch (error){
            throw new Error("ERROR: CANNOT SAVE TO FILE");
        }

        return this;
    }

    // config.saveToObject()
    saveToObject(){
        const result = {};

        if (fnIsString(this["$domain"]) !== true){
            throw new Error("ERROR: DOMAIN SECTION IS MISSING");
        }
        result["domain"] = this["$domain"];

        if (fnIsString(this["$version"])){
            result["version"] = this["$version"];
        }

        if (fnIsArray(this["$global"]) && this["$global"].length > 0){
            result["global"] = this["$global"];
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
        return JSON.stringify(this.saveToObject());
    }

    // config.saveToRemote()
    async saveToRemote(...args){
        let remote = undefined;
        let url = undefined;
        let token = undefined;
        let ca = undefined;
        let options = {};

        if (args.length === 1){
            remote = args[0];
        }
        else if (args.length === 2){
            if (fnIsString(args[0]) && fnIsString(args[1])){
                url = args[0];
                token = args[1];
            }
            else {
                remote = args[0];
                options = args[1];
            }
        }
        else if (args.length === 3){
            url = args[0];
            token = args[1];
            ca = args[2];
        }
        else {
            throw new Error("ERROR: INVALID INPUT");
        }

        try {
            if (remote === undefined){
                assert( fnIsString(url) && fnIsString(token) );
                const u = new URL(url);
                remote = this.constructor.remote(u.hostname, parseInt(u.port, 10), token, ca);
            }
        }
        catch (error){
            throw new Error("ERROR: INVALID INPUT");
        }
        
        let configjson = "";
        try {
            configjson = this.saveToJson();
            assert( fnIsString(configjson) );
        }
        catch (error){
            throw new Error("ERROR: IT'S NOT BEEN POSSIBLE TO RUN 'config.saveToJson()'");
        }

        try {
            const res = await remote.setConfig(configjson, (fnHas(options, "checkSavedHash") && options["checkSavedHash"] === true) ? this["$remote-hash"] : undefined);
            this["$remote-hash"] = (fnHas(options, "checkSavedHash") && options["checkSavedHash"] === true) ? remote.getConfigHash(configjson) : this["$remote-hash"];
            return true;
        }
        catch (error){
            throw new Error(error.message);
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
            throw new Error("ERROR: INVALID EVENT");
        }

        if (fnIsFunction(cb) !== true){
            throw new Error("ERROR: CALLBACK IS NOT A FUNCTION");
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

        throw new Error("ERROR: DOMAIN NAME MUST BE A STRING");
    }

    // config.guest()
    // DEPRECATED
    guest(input = undefined){
        if (arguments.length < 1){
            console.log(`[WARNING] 'config.guest()' and 'config.unsetGuest()' are deprecated.`);
            return (this.shares.get().includes("guest")) ? this.shares.get("guest")["path"] : undefined;
        }

        if (fnIsString(input)){
            console.log(`[WARNING] 'config.guest()' and 'config.unsetGuest()' are deprecated.`);
            if (this.shares.get().includes("guest")){
                this.shares.setPath("guest", input);
            }
            else {
                this.shares.add("guest", input, [], "rw");
            }
            return this;
        }
        else if (input === false){
            this.unsetGuest();
            return this;
        }

        throw new Error("ERROR: GUEST MUST BE false OR A STRING");
    }

    // config.unsetGuest()
    // DEPRECATED
    unsetGuest(){
        console.log(`[WARNING] 'config.guest()' and 'config.unsetGuest()' are deprecated.`);

        if (this.shares.get().includes("guest")){
            this.shares.remove("guest");
        }
        return this;
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

        throw new Error("ERROR: VERSION MUST BE A STRING");
    }

    // config.unsetVersion()
    // DEPRECATED
    unsetVersion(){
        console.log(`[WARNING] 'config.unsetVersion()' is deprecated. Use 'config.version(undefined)'.`);
        this.version(undefined);
        return this;
    }

    // config.global()
    global(input = undefined){
        if (arguments.length < 1){
            return this["$global"];
        }

        if (input === undefined || (fnIsArray(input) && input.every(fnIsString))){
            this["$global"] = (input === undefined) ? undefined : fnCopy(input);
            return this;
        }

        throw new Error("ERROR: GLOBAL MUST BE AN ARRAY OF STRINGS");
    }

    // config.unsetGlobal()
    // DEPRECATED
    unsetGlobal(){
        console.log(`[WARNING] 'config.unsetGlobal()' is deprecated. Use 'config.global(undefined)'.`);
        this.global(undefined);
        return this;
    }
};



// exports
module.exports = ConfigGen;



