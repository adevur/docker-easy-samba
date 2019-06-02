/*
    LIST OF METHODS

    [static] fromObject()
    [static] fromJson()

    saveToJson()
    saveToFile()

    domain()
    guest()
    version()
    global()

    users.add()
    users.addArray()
    users.remove()
    users.get()
    users.getAll()
    users.setPassword()

    groups.add()
    groups.addArray()
    groups.remove()
    groups.get()
    groups.getAll()
    groups.addMembers()
    groups.removeMembers()

    shares.add()
    shares.addArray()
    shares.remove()
    shares.get()
    shares.getAll()
    shares.addRules()
    shares.removeRules()
    shares.removeRuleAt()
    shares.removeAllRules()
    shares.setPath()

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

const fnIsInteger = (input) => {
    return ( input !== undefined && input === parseInt(String(input), 10) );
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

                this["$users"].push({ "name": username, "password": password });
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
            remove: (username = undefined) => {
                let index = undefined;
                this["$users"].forEach((user, i) => {
                    if (user["name"] === username){
                        index = i;
                    }
                });

                if (index === undefined){
                    throw "ERROR: USER NOT FOUND";
                }

                this["$users"].splice(index, 1);

                return this;
            },

            // users.get()
            get: (username = undefined) => {
                if (username === undefined){
                    const result = [];
                    this["$users"].forEach((user) => {
                        result.push(user["name"]);
                    });
                    return result;
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

                this["$users"][index]["password"] = password;

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

                this["$groups"].push({ "name": groupname, "members": members_safe });
                return this;
            },

            // groups.addArray()
            addArray: (input) => {
                if (fnIsArray(input) !== true){
                    throw "ERROR: INPUT MUST BE AN ARRAY";
                }

                input.forEach((elem) => {
                    if (fnHas(elem, "name") !== true || (fnHas(elem, "members") !== true && fnHas(elem, "users") !== true)){
                        throw "ERROR: INPUT IS NOT VALID";
                    }
                    if (fnHas(elem, "users")){
                        console.log(`[WARNING] 'users' property of a group is deprecated, rename it to 'members' instead`);
                        this.groups.add(elem["name"], elem["users"]);
                    }
                    else {
                        this.groups.add(elem["name"], elem["members"]);
                    }
                });

                return this;
            },

            // groups.remove()
            remove: (groupname = undefined) => {
                let index = undefined;
                this["$groups"].forEach((group, i) => {
                    if (group["name"] === groupname){
                        index = i;
                    }
                });

                if (index === undefined){
                    throw "ERROR: GROUP NOT FOUND";
                }

                this["$groups"].splice(index, 1);

                return this;
            },

            // groups.get()
            get: (groupname = undefined) => {
                if (groupname === undefined){
                    const result = [];
                    this["$groups"].forEach((group) => {
                        result.push(group["name"]);
                    });
                    return result;
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

                members.forEach((member) => {
                    addMember(groupname, member);
                });

                return this;
            },

            // groups.removeMember()
            removeMember: (groupname, member) => {
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

                if (this["$groups"][index]["members"].includes(member) === true){
                    this["$groups"][index]["members"].splice(this["$groups"][index]["members"].indexOf(member), 1);
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

                members.forEach((member) => {
                    removeMember(groupname, member);
                });

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
            remove: (sharename = undefined) => {
                let index = undefined;
                this["$shares"].forEach((share, i) => {
                    if (share["name"] === sharename){
                        index = i;
                    }
                });

                if (index === undefined){
                    throw "ERROR: SHARE NOT FOUND";
                }

                this["$shares"].splice(index, 1);

                return this;
            },

            // shares.get()
            get: (sharename = undefined) => {
                if (sharename === undefined){
                    const result = [];
                    this["$shares"].forEach((share) => {
                        result.push(share["name"]);
                    });
                    return result;
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
            removeAllRules: (sharename, rules = undefined) => {
                if (this.shares.get().includes(sharename) !== true){
                    throw "ERROR: SHARE NOT FOUND";
                }

                let rulesToDelete = undefined;

                if (fnIsArray(rules) !== true){
                    rulesToDelete = this.shares.get(sharename)["access"];
                }
                else {
                    rulesToDelete = rules;
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
    saveToFile(path = undefined){
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

    // domain()
    domain(input = undefined){
        if (input === undefined){
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
        if (input === undefined){
            return this["$guest"];
        }

        if (input === false || fnIsString(input)){
            this["$guest"] = input;
            return this;
        }

        throw "ERROR: GUEST MUST BE A STRING OR false";
    }

    // version()
    version(input = undefined){
        if (input === undefined){
            return this["$version"];
        }

        if (fnIsString(input)){
            this["$version"] = input;
            return this;
        }

        throw "ERROR: VERSION MUST BE A STRING";
    }

    // global()
    global(input = undefined){
        if (input === undefined){
            return this["$global"];
        }

        if (fnIsArray(input)){
            input.forEach((elem) => {
                if (fnIsString(elem) !== true){
                    throw "ERROR: GLOBAL MUST BE AN ARRAY OF STRINGS";
                }
            });
            this["$global"] = input;
            return this;
        }

        throw "ERROR: GLOBAL MUST BE AN ARRAY";
    }
};



// exports
module.exports = ConfigGen;



