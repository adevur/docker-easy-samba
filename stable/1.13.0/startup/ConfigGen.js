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
    config.groups.addMembers()
    config.groups.removeMembers()

    config.shares.add()
    config.shares.addArray()
    config.shares.remove()
    config.shares.get()
    config.shares.getAll()
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

    [static] ConfigGen.remote()
    remote.getConfig()
    remote.setConfig()
    remote.getInfo()
    remote.hello()

*/



// dependencies
const fs = require("fs");
const crypto = require("crypto");
const assert = require("assert");
const https = require("https");

// global variables
const globalVersion = "1.13";



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



// ConfigGen
//   this is the main class of the ConfigGen.js library
//   that is later exported
const ConfigGen = class {
    // this is the constructor
    //   it doesn't accept any parameters
    constructor(){
        // in order to know which ConfigGen.js version we're using
        this.easysambaVersion = globalVersion;

        // internal variables used by an instance of ConfigGen
        this["$domain"] = "WORKGROUP";
        this["$version"] = undefined;
        this["$global"] = undefined;
        this["$users"] = [];
        this["$groups"] = [];
        this["$shares"] = [];

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

                if (fnIsString(username) !== true || fnIsString(password) !== true){
                    throw new Error("ERROR: USERNAME AND PASSWORD MUST BE STRINGS");
                }

                if (this.users.get().includes(username)){
                    throw new Error("ERROR: USER ALREADY EXISTS");
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
                if (fnIsString(groupname) !== true){
                    throw new Error("ERROR: GROUP NAME MUST BE A STRING");
                }

                if (fnIsArray(members) !== true || members.every(fnIsString) !== true){
                    throw new Error("ERROR: MEMBERS MUST BE AN ARRAY OF STRINGS");
                }

                if (this.groups.get().includes(groupname)){
                    throw new Error("ERROR: GROUP ALREADY EXISTS");
                }

                const members_unique = members.filter((e) => { return (members.indexOf(e) === members.lastIndexOf(e)); });

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

                const share = { "name": sharename, "path": path, "access": fnCopy(access) };
                if (guest !== "no"){
                    share["guest"] = guest;
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
                    this.shares.add(elem["name"], elem["path"], (fnHas(elem, "access")) ? elem["access"] : [], (fnHas(elem, "guest")) ? elem["guest"] : "no");
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

                const indices = rules.map((e) => {
                    const i = this.shares.get(sharename)["access"].indexOf(e);
                    return (i < 0) ? undefined : i;
                }).filter((e, i, arr) => {
                    return (arr.indexOf(e) === arr.lastIndexOf(e) && e !== undefined);
                });

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
            assert( fnIsString(res) );
        }
        catch (error){
            throw new Error("ERROR: COULD NOT CONNECT TO REMOTE API");
        }

        try {
            return this.fromJson(res);
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
                                    assert(fnHas(result, ["jsonrpc", "result", "id"]));
                                    assert(result["jsonrpc"] === "2.0");
                                    assert(result["id"] === id);
                                    resolve({ res: result["result"], err: false });
                                }
                                catch (error){
                                    resolve({ res: undefined, err: "INVALID RESPONSE FROM REMOTE API" });
                                }
                            });
                        });

                        req.on("error", () => {
                            resolve({ res: undefined, err: "COULD NOT CONNECT TO REMOTE API" });
                        });

                        req.write(data);
                        req.end();
                    }
                    catch (error){
                        resolve({ res: undefined, err: "COULD NOT CONNECT TO REMOTE API" });
                    }
                });
            }

            // remote.getConfig()
            async getConfig(){
                const { res, err } = await this.cmd("get-config");
                if (err !== false){
                    throw new Error("ERROR: COULD NOT CONNECT TO REMOTE API");
                }
                return res;
            }

            // remote.setConfig()
            async setConfig(configjson){
                const { res, err } = await this.cmd("set-config", { "config.json": configjson });
                if (err !== false || res !== "SUCCESS"){
                    throw new Error("ERROR: COULD NOT CONNECT TO REMOTE API");
                }
                return true;
            }

            // remote.getInfo()
            async getInfo(){
                const { res, err } = await this.cmd("get-info");
                if (err !== false || fnHas(res, ["running", "version"]) !== true){
                    throw new Error("ERROR: COULD NOT CONNECT TO REMOTE API");
                }
                return { running: res.running, version: res.version };
            }

            // remote.hello()
            async hello(){
                const { res, err } = await this.cmd("hello");
                if (err !== false || res !== "world"){
                    throw new Error("ERROR: COULD NOT CONNECT TO REMOTE API");
                }
                return "world";
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
                remote = this.constructor.remote(u.hostname, parseInt(u.port, 10), token, ca);
            }
        }
        catch (error){
            throw new Error("ERROR: INVALID INPUT");
        }

        try {
            const res = await remote.setConfig(this.saveToJson());
            assert( res === true );
            return true;
        }
        catch (error){
            throw new Error("ERROR: COULD NOT CONNECT TO REMOTE API");
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
    unsetGlobal(){
        console.log(`[WARNING] 'config.unsetGlobal()' is deprecated. Use 'config.global(undefined)'.`);
        this.global(undefined);
        return this;
    }
};



// exports
module.exports = ConfigGen;



