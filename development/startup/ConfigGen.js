/*
    LIST OF METHODS

    [static] ConfigGen.fromObject()
    [static] ConfigGen.fromJson()

    [property] config.easysambaVersion

    config.saveToJson()
    config.saveToFile()

    config.on()

    config.domain()
    config.guest()
    config.unsetGuest()
    config.version()
    config.unsetVersion()
    config.global()
    config.unsetGlobal()

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
    config.shares.setFixedRules()
    config.shares.unsetFixedRules()

*/



// dependencies
const fs = require("fs");
const crypto = require("crypto");



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



// ConfigGen
//   this is the main class of the ConfigGen.js library
//   that is later exported
const ConfigGen = class {
    // this is the constructor
    //   it doesn't accept any parameters
    constructor(){
        // in order to know which ConfigGen.js version we're using
        this.easysambaVersion = "1.7";

        // internal variables used by an instance of ConfigGen
        this["$domain"] = undefined;
        this["$guest"] = undefined;
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
        this["$fixedrules-handler-current"] = undefined;
        this["$fixedrules-handler"] = (share) => {
            if (this["$fixedrules-handler-current"] === share["name"]){
                return;
            }
            this["$fixedrules-handler-current"] = share["name"];
            if (this["$fixedrules"]["shares"] !== undefined && this["$fixedrules"]["shares"].includes(share["name"]) !== true){
                return;
            }
            if (fnArrayEndsWith(share["access"], this["$fixedrules"]["rules"]) !== true){
                this.shares.removeAllRules(share["name"], this["$fixedrules"]["rules"]);
                this.shares.addRules(share["name"], this["$fixedrules"]["rules"]);
            }
            this["$fixedrules-handler-current"] = undefined;
        };
        this.on("share-change-access", this["$fixedrules-handler"]);
        this.on("share-add", this["$fixedrules-handler"]);

        // "users" namespace
        //   where functions like "config.users.add(...)" are located
        this.users = {
            // users.add()
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

                if (password === undefined){
                    password = this.constructor.genRandomPassword();
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

            // users.addArray()
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

            // users.remove()
            remove: (username) => {
                if (fnIsArray(username)){
                    username.forEach((e) => {
                        this.users.remove(e);
                    });
                    return this;
                }

                let index = undefined;
                this["$users"].forEach((user, i) => {
                    if (user["name"] === username){
                        index = i;
                    }
                });

                let removedUser = undefined;
                if (index !== undefined && index >= 0){
                    removedUser = this.users.get(username);
                    this["$users"].splice(index, 1);
                }

                // trigger event "user-remove"
                if (removedUser !== undefined){
                    this["$trigger"]("user-remove", removedUser);
                }

                return this;
            },

            // users.get()
            get: (...args) => {
                if (args.length < 1){
                    const result = [];
                    this["$users"].forEach((user) => {
                        result.push(user["name"]);
                    });
                    return result;
                }

                const username = args[0];

                let index = undefined;
                this["$users"].forEach((user, i) => {
                    if (user["name"] === username){
                        index = i;
                    }
                });

                if (index === undefined){
                    throw new Error("ERROR: USER NOT FOUND");
                }

                return JSON.parse(JSON.stringify(this["$users"][index]));
            },

            // users.getAll()
            getAll: () => {
                const result = [];
                const elems = this.users.get();
                elems.forEach((elem) => {
                    result.push(this.users.get(elem));
                });
                return result;
            },

            // users.setPassword()
            setPassword: (username, password) => {
                if (fnIsString(password) !== true){
                    throw new Error("ERROR: PASSWORD MUST BE A STRING");
                }

                let index = undefined;
                this["$users"].forEach((user, i) => {
                    if (user["name"] === username){
                        index = i;
                    }
                });

                if (index === undefined){
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
            // groups.add()
            add: (groupname, members) => {
                if (fnIsString(groupname) !== true){
                    throw new Error("ERROR: GROUP NAME MUST BE A STRING");
                }

                if (fnIsArray(members) !== true){
                    throw new Error("ERROR: MEMBERS MUST BE AN ARRAY");
                }

                const members_safe = [];
                members.forEach((member) => {
                    if (fnIsString(member) !== true){
                        throw new Error("ERROR: MEMBERS MUST BE AN ARRAY OF STRINGS");
                    }
                    members_safe.push(member);
                });

                if (this.groups.get().includes(groupname)){
                    throw new Error("ERROR: GROUP ALREADY EXISTS");
                }

                this["$groups"].push({ "name": groupname, "members": members_safe });

                // trigger event "group-add"
                this["$trigger"]("group-add", this.groups.get(groupname));

                return this;
            },

            // groups.addArray()
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

            // groups.remove()
            remove: (groupname) => {
                if (fnIsArray(groupname)){
                    groupname.forEach((e) => {
                        this.groups.remove(e);
                    });
                    return this;
                }

                let index = undefined;
                this["$groups"].forEach((group, i) => {
                    if (group["name"] === groupname){
                        index = i;
                    }
                });

                let removedGroup = undefined;
                if (index !== undefined && index >= 0){
                    removedGroup = this.groups.get(groupname);
                    this["$groups"].splice(index, 1);
                }

                // trigger event "group-remove"
                if (removedGroup !== undefined){
                    this["$trigger"]("group-remove", removedGroup);
                }

                return this;
            },

            // groups.get()
            get: (...args) => {
                if (args.length < 1){
                    const result = [];
                    this["$groups"].forEach((group) => {
                        result.push(group["name"]);
                    });
                    return result;
                }

                const groupname = args[0];

                let index = undefined;
                this["$groups"].forEach((group, i) => {
                    if (group["name"] === groupname){
                        index = i;
                    }
                });

                if (index === undefined){
                    throw new Error("ERROR: GROUP NOT FOUND");
                }

                return JSON.parse(JSON.stringify(this["$groups"][index]));
            },

            // groups.getAll()
            getAll: () => {
                const result = [];
                const elems = this.groups.get();
                elems.forEach((elem) => {
                    result.push(this.groups.get(elem));
                });
                return result;
            },

            // groups.addMembers()
            addMembers: (groupname, members) => {
                const addMember = (groupname, member) => {
                    if (fnIsString(member) !== true){
                        throw new Error("ERROR: MEMBER MUST BE A STRING");
                    }

                    let index = undefined;
                    this["$groups"].forEach((group, i) => {
                        if (group["name"] === groupname){
                            index = i;
                        }
                    });

                    if (index === undefined){
                        throw new Error("ERROR: GROUP NOT FOUND");
                    }

                    if (this["$groups"][index]["members"].includes(member) !== true){
                        this["$groups"][index]["members"].push(member);
                    }
                };

                if (fnIsArray(members) !== true){
                    throw new Error("ERROR: MEMBERS MUST BE AN ARRAY");
                }

                const previous = this.groups.get(groupname);
                members.forEach((member) => {
                    addMember(groupname, member);
                });

                // trigger event "group-change" and "group-change-members"
                const current = this.groups.get(groupname);
                if (JSON.stringify(current["members"]) !== JSON.stringify(previous["members"])){
                    this["$trigger"]("group-change", current, previous);
                    this["$trigger"]("group-change-members", current, previous);
                }

                return this;
            },

            // groups.removeMembers()
            removeMembers: (groupname, members) => {
                const removeMember = (groupname, member) => {
                    if (fnIsString(member) !== true){
                        throw new Error("ERROR: MEMBER MUST BE A STRING");
                    }

                    let index = undefined;
                    this["$groups"].forEach((group, i) => {
                        if (group["name"] === groupname){
                            index = i;
                        }
                    });

                    if (index === undefined){
                        throw new Error("ERROR: GROUP NOT FOUND");
                    }

                    const temp = this["$groups"][index]["members"];
                    if (temp.includes(member) === true){
                        temp.splice(temp.indexOf(member), 1);
                    }
                };

                if (fnIsArray(members) !== true){
                    throw new Error("ERROR: MEMBERS MUST BE AN ARRAY");
                }

                const previous = this.groups.get(groupname);
                members.forEach((member) => {
                    removeMember(groupname, member);
                });

                // trigger event "group-change" and "group-change-members"
                const current = this.groups.get(groupname);
                if (JSON.stringify(current["members"]) !== JSON.stringify(previous["members"])){
                    this["$trigger"]("group-change", current, previous);
                    this["$trigger"]("group-change-members", current, previous);
                }

                return this;
            }
        };

        // "shares" namespace
        //   where functions like "config.shares.add(...)" are located
        this.shares = {
            // shares.add()
            add: (sharename, path, rules) => {
                if (fnIsString(sharename) !== true){
                    throw new Error("ERROR: SHARE NAME MUST BE A STRING");
                }

                if (fnIsString(path) !== true){
                    throw new Error("ERROR: SHARE PATH MUST BE A STRING");
                }

                if (fnIsArray(rules) !== true && fnIsString(rules) !== true){
                    throw new Error("ERROR: SHARE RULES MUST BE AN ARRAY OR A STRING");
                }

                if (fnIsString(rules) && rules !== "rw" && rules !== "ro"){
                    throw new Error("ERROR: GUEST MUST BE EQUAL TO 'rw' OR 'ro'");
                }

                if (fnIsArray(rules)){
                    const rules_safe = [];
                    rules.forEach((rule) => {
                        if (fnIsString(rule) !== true){
                            throw new Error("ERROR: SHARE RULES MUST BE AN ARRAY OF STRINGS");
                        }
                        rules_safe.push(rule);
                    });

                    if (this.shares.get().includes(sharename)){
                        throw new Error("ERROR: SHARE ALREADY EXISTS");
                    }

                    this["$shares"].push({ "name": sharename, "path": path, "access": rules_safe });
                }
                else {
                    this["$shares"].push({ "name": sharename, "path": path, "access": [], "guest": rules });
                }

                // trigger event "share-add"
                this["$trigger"]("share-add", this.shares.get(sharename));

                return this;
            },

            // shares.addArray()
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

            // shares.remove()
            remove: (sharename) => {
                if (fnIsArray(sharename)){
                    sharename.forEach((e) => {
                        this.shares.remove(e);
                    });
                    return this;
                }

                let index = undefined;
                this["$shares"].forEach((share, i) => {
                    if (share["name"] === sharename){
                        index = i;
                    }
                });

                let removedShare = undefined;
                if (index !== undefined && index >= 0){
                    removedShare = this.shares.get(sharename);
                    this["$shares"].splice(index, 1);
                }

                // trigger event "share-remove"
                if (removedShare !== undefined){
                    this["$trigger"]("share-remove", removedShare);
                }

                return this;
            },

            // shares.get()
            get: (...args) => {
                if (args.length < 1){
                    const result = [];
                    this["$shares"].forEach((share) => {
                        result.push(share["name"]);
                    });
                    return result;
                }

                const sharename = args[0];

                let index = undefined;
                this["$shares"].forEach((share, i) => {
                    if (share["name"] === sharename){
                        index = i;
                    }
                });

                if (index === undefined){
                    throw new Error("ERROR: SHARE NOT FOUND");
                }

                return JSON.parse(JSON.stringify(this["$shares"][index]));
            },

            // shares.getAll()
            getAll: () => {
                const result = [];
                const elems = this.shares.get();
                elems.forEach((elem) => {
                    result.push(this.shares.get(elem));
                });
                return result;
            },

            // shares.addRules()
            addRules: (sharename, rules) => {
                const addRule = (sharename, rule) => {
                    if (fnIsString(rule) !== true){
                        throw new Error("ERROR: RULE MUST BE A STRING");
                    }

                    let index = undefined;
                    this["$shares"].forEach((share, i) => {
                        if (share["name"] === sharename){
                            index = i;
                        }
                    });

                    if (index === undefined){
                        throw new Error("ERROR: SHARE NOT FOUND");
                    }

                    this["$shares"][index]["access"].push(rule);
                };

                if (fnIsArray(rules) !== true){
                    throw new Error("ERROR: RULES MUST BE AN ARRAY");
                }

                const previous = this.shares.get(sharename);
                rules.forEach((rule) => {
                    addRule(sharename, rule);
                });

                // trigger event "share-change" and "share-change-access"
                const current = this.shares.get(sharename);
                this["$trigger"]("share-change", current, previous);
                this["$trigger"]("share-change-access", current, previous);

                return this;
            },

            // shares.addRuleAt()
            addRuleAt: (sharename, rule, ruleIndex) => {
                // check parameters
                if (fnIsString(sharename) !== true){
                    throw new Error("ERROR: NAME OF SHARE MUST BE A STRING");
                }

                if (fnIsString(rule) !== true){
                    throw new Error("ERROR: RULE MUST BE A STRING");
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

                // add the rule at the specified ruleIndex
                const previous = this.shares.get(sharename);
                this["$shares"][index]["access"].splice(ruleIndex, 0, rule);

                // trigger event "share-change" and "share-change-access"
                const current = this.shares.get(sharename);
                this["$trigger"]("share-change", current, previous);
                this["$trigger"]("share-change-access", current, previous);

                return this;
            },

            // shares.removeRules()
            removeRules: (sharename, rules) => {
                const removeRule = (sharename, rule) => {
                    if (fnIsString(rule) !== true){
                        throw new Error("ERROR: RULE MUST BE A STRING");
                    }

                    let index = undefined;
                    this["$shares"].forEach((share, i) => {
                        if (share["name"] === sharename){
                            index = i;
                        }
                    });

                    if (index === undefined){
                        throw new Error("ERROR: SHARE NOT FOUND");
                    }

                    const temp = this["$shares"][index]["access"];
                    if (temp.includes(rule) === true){
                        temp.splice(temp.indexOf(rule), 1);
                    }
                };

                if (fnIsArray(rules) !== true){
                    throw new Error("ERROR: RULES MUST BE AN ARRAY");
                }

                const previous = this.shares.get(sharename);
                rules.forEach((rule) => {
                    removeRule(sharename, rule);
                });

                // trigger event "share-change" and "share-change-access"
                const current = this.shares.get(sharename);
                if (JSON.stringify(current["access"]) !== JSON.stringify(previous["access"])){
                    this["$trigger"]("share-change", current, previous);
                    this["$trigger"]("share-change-access", current, previous);
                }

                return this;
            },

            // shares.removeAllRules()
            removeAllRules: (...args) => {
                const sharename = args[0];

                if (this.shares.get().includes(sharename) !== true){
                    throw new Error("ERROR: SHARE NOT FOUND");
                }

                let rulesToDelete = undefined;

                if (args.length === 1){
                    rulesToDelete = this.shares.get(sharename)["access"];
                }
                else if (args.length > 1 && fnIsArray(args[1])) {
                    rulesToDelete = args[1];
                }
                else {
                    throw new Error("ERROR: RULES MUST BE AN ARRAY");
                }

                rulesToDelete.forEach((ruleToDelete) => {
                    while (this.shares.get(sharename)["access"].includes(ruleToDelete) === true){
                        this.shares.removeRules(sharename, [ruleToDelete]);
                    }
                });

                return this;
            },

            // shares.removeRuleAt()
            removeRuleAt: (sharename, ruleIndex) => {
                if (fnIsInteger(ruleIndex) !== true || ruleIndex < 0){
                    throw new Error("ERROR: RULE INDEX MUST BE A POSITIVE INTEGER");
                }

                let index = undefined;
                this["$shares"].forEach((share, i) => {
                    if (share["name"] === sharename){
                        index = i;
                    }
                });

                if (index === undefined){
                    throw new Error("ERROR: SHARE NOT FOUND");
                }

                const previous = this.shares.get(sharename);
                if (this["$shares"][index]["access"].length > ruleIndex){
                    this["$shares"][index]["access"].splice(ruleIndex, 1);
                }

                // trigger event "share-change" and "share-change-access"
                const current = this.shares.get(sharename);
                if (JSON.stringify(current["access"]) !== JSON.stringify(previous["access"])){
                    this["$trigger"]("share-change", current, previous);
                    this["$trigger"]("share-change-access", current, previous);
                }

                return this;
            },

            // shares.setPath()
            setPath: (sharename, path) => {
                if (fnIsString(path) !== true){
                    throw new Error("ERROR: PATH MUST BE A STRING");
                }

                let index = undefined;
                this["$shares"].forEach((share, i) => {
                    if (share["name"] === sharename){
                        index = i;
                    }
                });

                if (index === undefined){
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

            // shares.setGuest()
            setGuest: (sharename, permission) => {
                if (fnIsString(permission) !== true){
                    throw new Error("ERROR: PERMISSION MUST BE A STRING");
                }

                if (permission !== "rw" && permission !== "ro" && permission !== "no"){
                    throw new Error("ERROR: PERMISSION MUST BE EQUAL TO 'rw', 'ro' OR 'no'");
                }

                let index = undefined;
                this["$shares"].forEach((share, i) => {
                    if (share["name"] === sharename){
                        index = i;
                    }
                });

                if (index === undefined){
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

            // shares.setFixedRules()
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

                this["$fixedrules"]["shares"] = (shares === undefined) ? undefined : JSON.parse(JSON.stringify(shares));
                this["$fixedrules"]["rules"] = JSON.parse(JSON.stringify(rules));

                // trigger fixed rules handler right now for existing shares
                this.shares.getAll().forEach((share) => {
                    this["$fixedrules-handler"](share);
                });

                return this;
            },

            // shares.unsetFixedRules()
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
        return this.fromObject(JSON.parse(input));
    }

    static genRandomPassword(){
        // create a new empty array of 12 elements
        let result = Array.from({ length: 12 }, () => 0);

        // generate 12 random numbers (between 0 and 255)
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
            return this.genRandomPassword();
        }
        else {
            return result;
        }
    }

    // saveToFile()
    saveToFile(path){
        try {
            fs.writeFileSync(path, this.saveToJson());
        }
        catch (error){
            throw new Error("ERROR: CANNOT SAVE TO FILE");
        }

        return this;
    }

    // saveToJson()
    saveToJson(){
        const result = {};

        if (fnIsString(this["$domain"]) !== true){
            throw new Error("ERROR: DOMAIN SECTION IS MISSING");
        }
        result["domain"] = this["$domain"];

        if (this["$guest"] === false || fnIsString(this["$guest"]) === true){
            result["guest"] = this["$guest"];
        }

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

        return JSON.stringify(result);
    }

    // on()
    on(event, cb){
        if (fnHas(this, `$on-${event}`) !== true){
            throw new Error("ERROR: INVALID EVENT");
        }
        if (fnIsFunction(cb) !== true){
            throw new Error("ERROR: CALLBACK IS NOT A FUNCTION");
        }
        this[`$on-${event}`].push(cb);
        return this;
    }

    // domain()
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

    // guest()
    guest(input = undefined){
        if (arguments.length < 1){
            return this["$guest"];
        }

        if (input === false || fnIsString(input)){
            this["$guest"] = input;
            return this;
        }

        throw new Error("ERROR: GUEST MUST BE A STRING OR false");
    }

    // unsetGuest()
    unsetGuest(){
        this["$guest"] = undefined;
        return this;
    }

    // version()
    version(input = undefined){
        if (arguments.length < 1){
            return this["$version"];
        }

        if (fnIsString(input)){
            this["$version"] = input;
            return this;
        }

        throw new Error("ERROR: VERSION MUST BE A STRING");
    }

    // unsetVersion()
    unsetVersion(){
        this["$version"] = undefined;
        return this;
    }

    // global()
    global(input = undefined){
        if (arguments.length < 1){
            return this["$global"];
        }

        if (fnIsArray(input)){
            input.forEach((elem) => {
                if (fnIsString(elem) !== true){
                    throw new Error("ERROR: GLOBAL MUST BE AN ARRAY OF STRINGS");
                }
            });
            this["$global"] = JSON.parse(JSON.stringify(input));
            return this;
        }

        throw new Error("ERROR: GLOBAL MUST BE AN ARRAY");
    }

    // unsetGlobal()
    unsetGlobal(){
        this["$global"] = undefined;
        return this;
    }
};



// exports
module.exports = ConfigGen;



