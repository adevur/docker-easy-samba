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
    config.shares.removeRules()
    config.shares.removeRuleAt()
    config.shares.removeAllRules()
    config.shares.setPath()

*/



// dependencies
const fs = require("fs");



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
    return ( input !== undefined && input !== NaN && input === parseInt(String(input), 10) );
};

// fnIsFunction()
//   checks if a given Javascript object "obj" is a valid Javascript function
const fnIsFunction = (obj) => {
    return (obj && {}.toString.call(obj) === "[object Function]");
};



// ConfigGen
//   this is the main class of the ConfigGen.js library
//   that is later exported
const ConfigGen = class {
    // this is the constructor
    //   it doesn't accept any parameters
    constructor(){
        // in order to know which ConfigGen.js version we're using
        this.easysambaVersion = "1.5";

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

        // "users" namespace
        //   where functions like "config.users.add(...)" are located
        this.users = {
            // users.add()
            add: (username, password) => {
                if (fnIsString(username) !== true || fnIsString(password) !== true){
                    throw "ERROR: USERNAME AND PASSWORD MUST BE STRINGS";
                }

                if (this.users.get().includes(username)){
                    throw "ERROR: USER ALREADY EXISTS";
                }

                const newUser = { "name": username, "password": password };
                this["$users"].push(newUser);

                // trigger event "user-add"
                this["$trigger"]("user-add", JSON.parse(JSON.stringify(newUser)));

                return this;
            },

            // users.addArray()
            addArray: (input) => {
                if (fnIsArray(input) !== true){
                    throw "ERROR: INPUT MUST BE AN ARRAY";
                }

                input.forEach((elem) => {
                    if (fnHas(elem, ["name", "password"]) !== true){
                        throw "ERROR: INPUT IS NOT VALID";
                    }
                    this.users.add(elem["name"], elem["password"]);
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
                    removedUser = JSON.parse(JSON.stringify(this["$users"][index]));
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
                    throw "ERROR: USER NOT FOUND";
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
                    throw "ERROR: PASSWORD MUST BE A STRING";
                }

                let index = undefined;
                this["$users"].forEach((user, i) => {
                    if (user["name"] === username){
                        index = i;
                    }
                });

                if (index === undefined){
                    throw "ERROR: USER NOT FOUND";
                }

                const previous = JSON.parse(JSON.stringify(this["$users"][index]));
                this["$users"][index]["password"] = password;
                const current = JSON.parse(JSON.stringify(this["$users"][index]));

                // trigger event "user-change" and "user-change-password"
                this["$trigger"]("user-change", current, previous);
                this["$trigger"]("user-change-password", current, previous);

                return this;
            }
        };

        // "groups" namespace
        //   where functions like "config.groups.add(...)" are located
        this.groups = {
            // groups.add()
            add: (groupname, members) => {
                if (fnIsString(groupname) !== true){
                    throw "ERROR: GROUP NAME MUST BE A STRING";
                }

                if (fnIsArray(members) !== true){
                    throw "ERROR: MEMBERS MUST BE AN ARRAY";
                }

                const members_safe = [];
                members.forEach((member) => {
                    if (fnIsString(member) !== true){
                        throw "ERROR: MEMBERS MUST BE AN ARRAY OF STRINGS";
                    }
                    members_safe.push(member);
                });

                if (this.groups.get().includes(groupname)){
                    throw "ERROR: GROUP ALREADY EXISTS";
                }

                const newGroup = { "name": groupname, "members": members_safe };
                this["$groups"].push(newGroup);

                // trigger event "group-add"
                this["$trigger"]("group-add", JSON.parse(JSON.stringify(newGroup)));

                return this;
            },

            // groups.addArray()
            addArray: (input) => {
                if (fnIsArray(input) !== true){
                    throw "ERROR: INPUT MUST BE AN ARRAY";
                }

                input.forEach((elem) => {
                    if (fnHas(elem, ["name", "members"]) !== true){
                        throw "ERROR: INPUT IS NOT VALID";
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
                    removedGroup = JSON.parse(JSON.stringify(this["$groups"][index]));
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
                    throw "ERROR: GROUP NOT FOUND";
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
                        throw "ERROR: MEMBER MUST BE A STRING";
                    }

                    let index = undefined;
                    this["$groups"].forEach((group, i) => {
                        if (group["name"] === groupname){
                            index = i;
                        }
                    });

                    if (index === undefined){
                        throw "ERROR: GROUP NOT FOUND";
                    }

                    if (this["$groups"][index]["members"].includes(member) !== true){
                        this["$groups"][index]["members"].push(member);
                    }
                };

                if (fnIsArray(members) !== true){
                    throw "ERROR: MEMBERS MUST BE AN ARRAY";
                }

                const previous = this.groups.get(groupname);
                members.forEach((member) => {
                    addMember(groupname, member);
                });

                // trigger event "group-change" and "group-change-members"
                if (JSON.stringify(current) !== JSON.stringify(previous)){
                    const current = this.groups.get(groupname);
                    this["$trigger"]("group-change", current, previous);
                    this["$trigger"]("group-change-members", current, previous);
                }

                return this;
            },

            // groups.removeMembers()
            removeMembers: (groupname, members) => {
                const removeMember = (groupname, member) => {
                    if (fnIsString(member) !== true){
                        throw "ERROR: MEMBER MUST BE A STRING";
                    }

                    let index = undefined;
                    this["$groups"].forEach((group, i) => {
                        if (group["name"] === groupname){
                            index = i;
                        }
                    });

                    if (index === undefined){
                        throw "ERROR: GROUP NOT FOUND";
                    }

                    const temp = this["$groups"][index]["members"];
                    if (temp.includes(member) === true){
                        temp.splice(temp.indexOf(member), 1);
                    }
                };

                if (fnIsArray(members) !== true){
                    throw "ERROR: MEMBERS MUST BE AN ARRAY";
                }

                const previous = this.groups.get(groupname);
                members.forEach((member) => {
                    removeMember(groupname, member);
                });

                // trigger event "group-change" and "group-change-members"
                if (JSON.stringify(current) !== JSON.stringify(previous)){
                    const current = this.groups.get(groupname);
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
                    throw "ERROR: SHARE NAME MUST BE A STRING";
                }

                if (fnIsString(path) !== true){
                    throw "ERROR: SHARE PATH MUST BE A STRING";
                }

                if (fnIsArray(rules) !== true){
                    throw "ERROR: SHARE RULES MUST BE AN ARRAY";
                }

                const rules_safe = [];
                rules.forEach((rule) => {
                    if (fnIsString(rule) !== true){
                        throw "ERROR: SHARE RULES MUST BE AN ARRAY OF STRINGS";
                    }
                    rules_safe.push(rule);
                });

                if (this.shares.get().includes(sharename)){
                    throw "ERROR: SHARE ALREADY EXISTS";
                }

                this["$shares"].push({ "name": sharename, "path": path, "access": rules_safe });
                return this;
            },

            // shares.addArray()
            addArray: (input) => {
                if (fnIsArray(input) !== true){
                    throw "ERROR: INPUT MUST BE AN ARRAY";
                }

                input.forEach((elem) => {
                    if (fnHas(elem, ["name", "path", "access"]) !== true){
                        throw "ERROR: INPUT IS NOT VALID";
                    }
                    this.shares.add(elem["name"], elem["path"], elem["access"]);
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

                if (index !== undefined && index >= 0){
                    this["$share"].splice(index, 1);
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
                    throw "ERROR: SHARE NOT FOUND";
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
                        throw "ERROR: RULE MUST BE A STRING";
                    }

                    let index = undefined;
                    this["$shares"].forEach((share, i) => {
                        if (share["name"] === sharename){
                            index = i;
                        }
                    });

                    if (index === undefined){
                        throw "ERROR: SHARE NOT FOUND";
                    }

                    this["$shares"][index]["access"].push(rule);
                };

                if (fnIsArray(rules) !== true){
                    throw "ERROR: RULES MUST BE AN ARRAY";
                }

                rules.forEach((rule) => {
                    addRule(sharename, rule);
                });

                return this;
            },

            // shares.removeRules()
            removeRules: (sharename, rules) => {
                const removeRule = (sharename, rule) => {
                    if (fnIsString(rule) !== true){
                        throw "ERROR: RULE MUST BE A STRING";
                    }

                    let index = undefined;
                    this["$shares"].forEach((share, i) => {
                        if (share["name"] === sharename){
                            index = i;
                        }
                    });

                    if (index === undefined){
                        throw "ERROR: SHARE NOT FOUND";
                    }

                    const temp = this["$shares"][index]["access"];
                    if (temp.includes(rule) === true){
                        temp.splice(temp.indexOf(rule), 1);
                    }
                };

                if (fnIsArray(rules) !== true){
                    throw "ERROR: RULES MUST BE AN ARRAY";
                }

                rules.forEach((rule) => {
                    removeRule(sharename, rule);
                });

                return this;
            },

            // shares.removeAllRules()
            removeAllRules: (...args) => {
                const sharename = args[0];

                if (this.shares.get().includes(sharename) !== true){
                    throw "ERROR: SHARE NOT FOUND";
                }

                let rulesToDelete = undefined;

                if (args.length === 1){
                    rulesToDelete = this.shares.get(sharename)["access"];
                }
                else if (args.length > 1 && fnIsArray(args[1])) {
                    rulesToDelete = args[1];
                }
                else {
                    throw "ERROR: RULES MUST BE AN ARRAY";
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
                    throw "ERROR: RULE INDEX MUST BE A POSITIVE INTEGER";
                }

                let index = undefined;
                this["$shares"].forEach((share, i) => {
                    if (share["name"] === sharename){
                        index = i;
                    }
                });

                if (index === undefined){
                    throw "ERROR: SHARE NOT FOUND";
                }

                if (this["$shares"][index]["access"].length > ruleIndex){
                    this["$shares"][index]["access"].splice(ruleIndex, 1);
                }

                return this;
            },

            // shares.setPath()
            setPath: (sharename, path) => {
                if (fnIsString(path) !== true){
                    throw "ERROR: PATH MUST BE A STRING";
                }

                let index = undefined;
                this["$shares"].forEach((share, i) => {
                    if (share["name"] === sharename){
                        index = i;
                    }
                });

                if (index === undefined){
                    throw "ERROR: SHARE NOT FOUND";
                }

                this["$shares"][index]["path"] = path;

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

    // saveToFile()
    saveToFile(path){
        try {
            fs.writeFileSync(path, this.saveToJson());
        }
        catch (error){
            throw "ERROR: CANNOT SAVE TO FILE";
        }

        return this;
    }

    // saveToJson()
    saveToJson(){
        const result = {};

        if (fnIsString(this["$domain"]) !== true){
            throw "ERROR: DOMAIN SECTION IS MISSING";
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
            throw "ERROR: INVALID EVENT";
        }
        if (fnIsFunction(cb) !== true){
            throw "ERROR: CALLBACK IS NOT A FUNCTION";
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

        throw "ERROR: DOMAIN NAME MUST BE A STRING";
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

        throw "ERROR: GUEST MUST BE A STRING OR false";
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

        throw "ERROR: VERSION MUST BE A STRING";
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
                    throw "ERROR: GLOBAL MUST BE AN ARRAY OF STRINGS";
                }
            });
            this["$global"] = JSON.parse(JSON.stringify(input));
            return this;
        }

        throw "ERROR: GLOBAL MUST BE AN ARRAY";
    }

    // unsetGlobal()
    unsetGlobal(){
        this["$global"] = undefined;
        return this;
    }
};



// exports
module.exports = ConfigGen;



