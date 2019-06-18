/*
    LIST OF METHODS

    [static] ConfigGen.fromObject()
    [static] ConfigGen.fromJson()
    [static] ConfigGen.genRandomPassword()

    [property] config.easysambaVersion

    config.saveToJson()
    config.saveToFile()
    config.saveToObject()

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
    config.shares.removeRules()
    config.shares.removeRuleAt()
    config.shares.removeAllRules()
    config.shares.setPath()
    config.shares.setGuest()
    config.shares.setFixedRules()
    config.shares.unsetFixedRules()

*/



// dependencies
const fs = require("fs");
const crypto = require("crypto");
const assert = require("assert");



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
    const check = end.every((e, i) => { return (e === elems[i]); });
    if (check !== true){
        return false;
    }
    return true;
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



// ConfigGen
//   this is the main class of the ConfigGen.js library
//   that is later exported
const ConfigGen = class {
    // this is the constructor
    //   it doesn't accept any parameters
    constructor(){
        // in order to know which ConfigGen.js version we're using
        this.easysambaVersion = "1.9";

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
        this["$trigger"] = (event, current, previous = undefined) => {
            if (fnHas(this, `$on-${event}`) !== true){
                return;
            }

            const cbs = this[`$on-${event}`];
            cbs.forEach((cb) => {
                if (previous !== undefined){
                    cb(current, previous);
                }
                else {
                    cb(current);
                }
            });
        };

        // internal variable for config.shares.setFixedRules() function
        this["$fixedrules"] = { "shares": undefined, "rules": [] };

        // event handlers for config.shares.setFixedRules() function
        this["$fixedrules-current"] = undefined;
        this["$fixedrules-handler"] = (share) => {
            if (this["$fixedrules-current"] === share["name"]){
                return;
            }

            this["$fixedrules-current"] = share["name"];
            if (this["$fixedrules"]["shares"] !== undefined && this["$fixedrules"]["shares"].includes(share["name"]) !== true){
                return;
            }
            if (fnArrayEndsWith(this.shares.get(share["name"])["access"], this["$fixedrules"]["rules"]) !== true){
                this.shares.removeAllRules(share["name"], this["$fixedrules"]["rules"]);
                this.shares.addRules(share["name"], this["$fixedrules"]["rules"]);
            }

            this["$fixedrules-current"] = undefined;
        };
        this.on(["share-add", "share-change-access"], this["$fixedrules-handler"]);

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
            add: (sharename, path, rules) => {
                if (fnIsString(sharename) !== true){
                    throw new Error("ERROR: SHARE NAME MUST BE A STRING");
                }

                if (fnIsString(path) !== true){
                    throw new Error("ERROR: SHARE PATH MUST BE A STRING");
                }

                if (this.shares.get().includes(sharename)){
                    throw new Error("ERROR: SHARE ALREADY EXISTS");
                }

                if (fnIsArray(rules) && rules.every(fnIsString)){
                    this["$shares"].push({ "name": sharename, "path": path, "access": fnCopy(rules) });
                }
                else if (fnIsString(rules) && (rules === "rw" || rules === "ro")) {
                    this["$shares"].push({ "name": sharename, "path": path, "access": [], "guest": rules });
                }
                else {
                    throw new Error("ERROR: INPUT IS NOT VALID");
                }

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
                    this.shares.add(elem["name"], elem["path"], (fnHas(elem, "guest")) ? elem["guest"] : elem["access"]);
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

                // trigger fixed rules handler right now for existing shares
                this.shares.getAll().forEach((share) => {
                    this["$fixedrules-handler"](share);
                });

                return this;
            },

            // config.shares.unsetFixedRules()
            unsetFixedRules: () => {
                this.shares.setFixedRules([]);
                return this;
            }
        };

        return this;
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
            result.groups.addArray(input["groups"]);
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

    // ConfigGen.genRandomPassword()
    // TODO: should be transformed from recursive to iterative
    //   in order to avoid possible stack overflows
    static genRandomPassword(len = 12){
        // check parameter "len"
        if (fnIsInteger(len) !== true || len < 4){
            throw new Error("ERROR: PASSWORD LENGTH MUST BE AT LEAST 4");
        }

        // create a new empty array
        let result = Array.from({ length: len }, () => 0);

        // fill the array with random numbers (between 0 and 255)
        result.forEach((n, i) => {
            result[i] = crypto.randomBytes(1).readUInt8();
        });

        // adjust numbers to fit range from 32 to 126 (ASCII codes of printable chars)
        result.forEach((n, i) => {
            result[i] = (n % 95) + 32;
        });

        // convert ASCII codes to strings
        result.forEach((n, i) => {
            result[i] = String.fromCharCode(n);
        });

        // convert "result" from array of chars to string
        result = result.join("");

        // count lowercase letters, uppercase letters, digits and symbols in "result"
        let lcl = 0;
        let ucl = 0;
        let dig = 0;
        let sym = 0;
        result.split("").forEach((c) => {
            lcl = (c === c.toLowerCase() && c !== c.toUpperCase()) ? (lcl + 1) : lcl;
            ucl = (c === c.toUpperCase() && c !== c.toLowerCase()) ? (ucl + 1) : ucl;
            dig = (c === String(parseInt(c, 10))) ? (dig + 1) : dig;
        });
        sym = result.length - lcl - ucl - dig;

        // make sure that "result" contains at least 1 lowercase letter, 1 uppercase letter, 1 symbol and 1 digit
        //   otherwise, generate a new password
        if (lcl === 0 || ucl === 0 || dig === 0 || sym === 0){
            return this.genRandomPassword(len);
        }
        else {
            return result;
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

        result["shares"] = this["$shares"];
        result["shares"].forEach((e) => {
            if (fnHas(e, ["guest", "access"])){
                delete e["access"];
            }
        });

        return result;
    }

    // config.saveToJson()
    saveToJson(){
        return JSON.stringify(this.saveToObject());
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
                this.shares.add("guest", input, "rw");
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



