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
    users.forEach()
    users.setPassword()

    groups.add()
    groups.addArray()
    groups.remove()
    groups.get()
    groups.forEach()
    groups.addUser()
    groups.removeUser()
    groups.addUsers()
    groups.removeUsers()

    shares.add()
    shares.addArray()
    shares.remove()
    shares.get()
    shares.forEach()
    shares.addRule()
    shares.removeRule()
    shares.addRules()
    shares.removeRules()
    shares.setPath()

*/



const fs = require("fs");

const fnIsArray = (input) => {
    return Array.isArray(input);
};

const fnIsString = (input) => {
    return (input === String(input));
};

const fnHas = (obj, keys) => {
    const has = (obj, key) => { return Object.prototype.hasOwnProperty.call(obj, key); };

    if (fnIsArray(keys)){
        return keys.every((key) => { return has(obj, key); });
    }
    else {
        return has(obj, keys);
    }
};

const ConfigGen = class {
    constructor(){
        this.easysambaVersion = "1.3";

        this["$domain"] = undefined;
        this["$guest"] = undefined;
        this["$version"] = undefined;
        this["$global"] = undefined;
        this["$users"] = [];
        this["$groups"] = [];
        this["$shares"] = [];

        this.users = {
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

            forEach: (cb) => {
                this["$users"].forEach((user) => {
                    cb(JSON.parse(JSON.stringify(user)));
                });
            },

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

        this.groups = {
            add: (groupname, users) => {
                if (fnIsString(groupname) !== true){
                    throw "ERROR: GROUP NAME MUST BE A STRING";
                }

                if (fnIsArray(users) !== true){
                    throw "ERROR: USERS MUST BE AN ARRAY";
                }

                const users_safe = [];
                users.forEach((user) => {
                    if (fnIsString(user) !== true){
                        throw "ERROR: USERS MUST BE AN ARRAY OF STRINGS";
                    }
                    users_safe.push(user);
                });

                if (this.groups.get().includes(groupname)){
                    throw "ERROR: GROUP ALREADY EXISTS";
                }

                this["$groups"].push({ "name": groupname, "users": users_safe });
                return this;
            },

            addArray: (input) => {
                if (fnIsArray(input) !== true){
                    throw "ERROR: INPUT MUST BE AN ARRAY";
                }

                input.forEach((elem) => {
                    if (fnHas(elem, ["name", "users"]) !== true){
                        throw "ERROR: INPUT IS NOT VALID";
                    }
                    this.groups.add(elem["name"], elem["users"]);
                });

                return this;
            },

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

            forEach: (cb) => {
                this["$groups"].forEach((group) => {
                    cb(JSON.parse(JSON.stringify(group)));
                });
            },

            addUser: (groupname, username) => {
                if (fnIsString(username) !== true){
                    throw "ERROR: USERNAME MUST BE A STRING";
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

                if (this["$groups"][index]["users"].includes(username) !== true){
                    this["$groups"][index]["users"].push(username);
                }

                return this;
            },

            addUsers: (groupname, users) => {
                if (fnIsArray(users) !== true){
                    throw "ERROR: USERS MUST BE AN ARRAY";
                }

                users.forEach((user) => {
                    this.groups.addUser(groupname, user);
                });

                return this;
            },

            removeUser: (groupname, username) => {
                if (fnIsString(username) !== true){
                    throw "ERROR: USERNAME MUST BE A STRING";
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

                if (this["$groups"][index]["users"].includes(username) === true){
                    this["$groups"][index]["users"].splice(this["$groups"][index]["users"].indexOf(username), 1);
                }

                return this;
            },

            removeUsers: (groupname, users) => {
                if (fnIsArray(users) !== true){
                    throw "ERROR: USERS MUST BE AN ARRAY";
                }

                users.forEach((user) => {
                    this.groups.removeUser(groupname, user);
                });

                return this;
            }
        };

        this.shares = {
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

            forEach: (cb) => {
                this["$shares"].forEach((share) => {
                    cb(JSON.parse(JSON.stringify(share)));
                });
            },

            addRule: (sharename, rule) => {
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

                return this;
            },

            addRules: (sharename, rules) => {
                if (fnIsArray(rules) !== true){
                    throw "ERROR: RULES MUST BE AN ARRAY";
                }

                rules.forEach((rule) => {
                    this.shares.addRule(sharename, rule);
                });

                return this;
            },

            removeRule: (sharename, rule) => {
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

                if (this["$shares"][index]["access"].includes(rule) === true){
                    this["$shares"][index]["access"].splice(this["$shares"][index]["access"].indexOf(rule), 1);
                }

                return this;
            },

            removeRules: (sharename, rules) => {
                if (fnIsArray(rules) !== true){
                    throw "ERROR: RULES MUST BE AN ARRAY";
                }

                rules.forEach((rule) => {
                    this.shares.removeRule(sharename, rule);
                });

                return this;
            },

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

    static fromJson(input){
        return this.fromObject(JSON.parse(input));
    }

    saveToFile(path = undefined){
        try {
            fs.writeFileSync(path, this.saveToJson());
        }
        catch (error){
            throw "ERROR: CANNOT SAVE TO FILE";
        }

        return this;
    }

    saveToJson(){
        const result = {};

        if (fnIsString(this["$domain"]) !== true){
            throw "ERROR: DOMAIN SECTION IS MISSING";
        }
        result["domain"] = this["$domain"];

        if (this["$guest"] !== false && fnIsString(this["$guest"]) !== true){
            throw "ERROR: GUEST SECTION IS MISSING";
        }
        result["guest"] = this["$guest"];

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

module.exports = ConfigGen;



