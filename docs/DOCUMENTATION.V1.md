
# easy-samba documentation
`adevur/easy-samba`'s documentation is divided into these sections:

> NOTE: this Documentation is for `easy-samba` version `1.x.x`. If you're looking for Documentation for `easy-samba` version `2.x.x`, [click here](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md).

- [`config.json`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configjson): it describes in detail the structure of `easy-samba`'s configuration file,
and all the things you can do with it.

- [`config.gen.js`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configgenjs): it describes in detail how to write a dynamic configuration script in Javascript, that is used to generate `config.json` files in an automated and dynamic way.

- [`ConfigGen.js library`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#ConfigGenjs-library): it describes in detail how to use `ConfigGen.js` Javascript library, whose purpose is to generate `config.json` files. It is usually used in `config.gen.js` scripts.

- [`EasySamba Remote API`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#easysamba-remote-api): it describes in detail how to enable `EasySamba Remote API` and how to use it to manage an `easy-samba` container from a remote client via network.

- [`docker options`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#docker-options): it describes what parameters you can pass to `docker run`.

- [`networking`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#networking): it describes how you can set up networking, in order to connect to `easy-samba`'s containers
from a SAMBA client.

- [`advanced use`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#advanced-use): it shows some tricks to improve `easy-samba` use (e.g. registering `easy-samba` as a `systemd` service, automatizing updates, ...).

- [`understanding logs`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#understanding-logs): it describes how you can retrieve logs for `easy-samba`, and how to read them.

- [`how easy-samba works`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#how-easy-samba-works): it describes the inner mechanics of `easy-samba`, and how it works in detail.

- [`current limitations`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#current-limitations): it describes what are the current limitations of `easy-samba`.

## config.json
Here we talk about the structure of the configuration file of `easy-samba` (i.e. `config.json`), and what you can do with it.
This chapter is divided into these sections:

- [general structure of the file](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#general-structure-of-the-file)

- [`version` section](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#version-section)

- [`domain` section](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#domain-section)

- [`users` section](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#users-section)

- [`groups` section](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#groups-section)

- [`shares` section](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#shares-section)

### general structure of the file
`config.json` is a file in JSON format. It is an object with these properties: `version` (optional), `domain`, `users`, `groups` (optional),
and `shares`. `config.json` must be placed in the container's directory `/share/config`.

### `version` section
This section is optional and has purely informative purposes. It is a string that tells which is the mininum version of `easy-samba` required in order to
use the current `config.json` file.

For example, if you use features that have only been introduced in `easy-samba` version `1.1.x`, you could add
`"version": "1.1"` into your `config.json`, so that if this config file is used in `easy-samba` version `1.0.x`, `easy-samba` will inform the user with
this log: `[ERROR] easy-samba configuration syntax is not correct: THIS CONFIGURATION FILE USES FEATURES THAT REQUIRE EASY-SAMBA VERSION '1.1' OR NEWER`.

You are not obliged to add `version` property into your `config.json` file in order to use latest features of `easy-samba`.

`version` property must be a string in this format: `"x.y"`. For example: `"1.0"`, `"1.15"`, `"2.0"`, etc.

### `domain` section
It's a string that contains the domain name of the SAMBA server. It must be a valid [NetBIOS name](https://en.wikipedia.org/wiki/NetBIOS#NetBIOS_name) that follows these rules:

- It must be an ASCII string.

- It must have a length of minimum 1 char and maximum 15 chars.

- First char must be alphanumeric (i.e. from `a` to `z`, from `A` to `Z` or from `0` to `9`).

- Last char must also be alphanumeric.

- It cannot be made entirely of digits (e.g. `123` is not a valid domain name).

- All characters of `domain` must be either alphanumeric or hyphen (`-`).
This rule is valid only for chars that are not the first or the last.

### `users` section
It is an array that contains all the users that will be created and used by the SAMBA server. These users are created only
inside the container's OS. Note that, optionally, you can leave this array empty (i.e. `"users": []`).
An element of `users` array looks like this: `{ "name": "user1", "password": "123456" }`.

- `name` is the user's name. It must be a valid Linux username, it must not exist in the container's OS already
(so it cannot be `root` or `nobody` etc.), and it must be unique (so there cannot be two or more users with the same name,
and there cannot be a user and a group with the same name).

- `password` is the user's password, with which the user will login to the SAMBA server.
It must be a valid Linux user password (i.e. it must be a string of [printable ASCII characters](https://en.wikipedia.org/wiki/ASCII#Printable_characters)).

### `groups` section
This is an optional property of `config.json`. If you include it in your configuration file, `groups` must be an array
which contains all the groups of users that you want to create. An element of `groups` array looks like this:
`{ "name": "group1", "members": ["user1", "user2"] }`.

- `name` is the group's name. It must be a valid Linux group name, it must not exist in the container's OS already,
and it must be unique (so there cannot be two or more groups with the same name, and there cannot be a user and a group
with the same name).

- `members` is an array that contains all the usernames of the members of the group. It cannot be empty. Also, it is possible to specify group names together with usernames (e.g. `{ "name": "group2", "members": ["group1", "user4"] }` means that `group2` contains all the users in `group1` plus `user4`).

### `shares` section
This is an array that contains all the shared folders to be created by the SAMBA server.
This section can also be an empty array. An element of `shares` array looks like this:
`{ "name": "public", "path": "/share/public", "access": ["user1", "ro:group2", "rw:user3"] }` (in case of a regular shared folder that requires user login), or `{ "name": "anon", "path": "/share/anon", "access": [], "guest": "rw" }` (in case of an anonymous shared folder, that doesn't require user login).

This is the list of supported properties for a `shares`'s element: `name`, `path`, `access`, `guest` (optional) and `soft-quota` (optional).

- `name` is a unique name to identify the shared folder. It must be alphanumeric and cannot be more than 8 characters in length.

- `path` is the location on disk of the shared folder. It must follow these rules:

  - It must be a sub-directory of `/share`.

  - It can contain whatever Unicode character, except for: `/`, `\`, `<`, `>`, `:`, `"`, `|`, `?`, `*`.

  - It cannot contain control characters (i.e. chars with a code between 0 and 31 or with a code of 127).

  - It cannot be equal to `"/share/config"`, to `"/share/."` or to `"/share/.."`.

  - It cannot be long more than 255 characters.

  - It cannot be equal to any of the other paths used in the `shares` section of `config.json`.

- `guest` is an optional property. If it's present, it is a string (equal to `"rw"` or to `"ro"`) that specifies if the shared folder can be accessed without login (i.e. if the share is an anonymous shared folder). In case it's equal to `"rw"`, it means that guest users (i.e. users without login) can read and write inside the shared folder; in case it's equal to `"ro"`, it means that guest users can only read contents inside the shared folder. If `guest` property is missing, it means that this shared folder cannot be accessed by users without login.

- `access` is an array of strings that contains all the "access rules" for the shared folder. This property defines the rules that `easy-samba` must apply to the shared folder. An access rule is a string that tells `easy-samba` who can access the shared folder, and with what permissions. See below for more info.

- `soft-quota` is an optional property that can be used to limit the size of the shared folder. This property is an object with two mandatory properties: `limit` and `whitelist`.

  - `limit`: it is a string that specifies the limit of directory's size. This string must contain an integer (greater or equal to `0`) followed by `GB`, `MB` or `kB`. For example: `"limit": "150MB"`. If the shared folder's size is greater than this limit, every user will lose write-access to the share (i.e. they keep reading files, but cannot modify or delete any). When shared folder's size decreases under the imposed limit, users will automatically gain write-access to the shared folder again.
  
  - `whitelist`: it is an array that contains the list of users or groups to which the soft-quota limit is not applied (and that will keep write-access to the share). For example: `"whitelist": ["admin"]`. This way, an eventual administrator can delete files in order to free space, after the size limit is crossed. If you include user `"nobody"` in your `whitelist`, soft-quota limit will not be applied to guest users (i.e. users without login).

ACCESS RULE SYNTAX: these are the types of access rules supported:

- When an access rule is equal to a username or a group name, it means that that user (or group) has access to the shared
folder with full read and write permissions. E.g.: `["user1", "group1"]` means that both `user1` and `group1` have read
and write permissions on the shared folder.

- When an access rule is equal to `"*"`, it means that all users (that have been defined in `users` property of `config.json`)
have access to the shared folder with full read and write permissions. Access rule `"*"` is equivalent to `"rw:*"`.

- When an access rule starts with `"rw:"` followed by a username or a group name, it means "read and write" permissions.
E.g.: `"rw:group1"` is equivalent to `"group1"` and it means that users of `group1` have read and write permissions on
the shared folder.

- When an access rule starts with `"ro:"` followed by a username or a group name, it means "only read permissions".
E.g.: `["ro:group1", "rw:user2"]` means that all users of `group1` have read permissions on the shared folder, but
`user2` has also write permissions.

- Access rule `"ro:*"` means that all users (that have been defined in `users` property of `config.json`)
have read-only permissions on the shared folder. For example: `["ro:*", "rw:user1"]` means that all users
have read-only permissions, but `user1` has also write permissions.

- When an access rule starts with `no:` followed by a username, a group name, or `*`, it means "no access at all".
E.g.: `["rw:group1", "no:user1"]` means that all members of `group1` have read and write permissions on the shared folder,
but `user1` has no access at all.

- If a user or a group are not included in the access rules of a shared folder, it means that they have no access at all
to that shared folder.

> Access rules are evaluated from left to right. For example, let's say we have a group `group1` with `user1` and `user2` as members;
`["ro:group1", "rw:user1"]` has a different meaning from
`["rw:user1", "ro:group1"]`: in the first case, we first tell `easy-samba` to grant all members of `group1` read-only
permissions, and then we give `user1` also
write permissions; in the second case, we first tell `easy-samba` to give `user1` read and write permissions, but then
we set read-only permissions for all members of `group1`, including `user1`, so `user1` loses its write permissions.
In the end: `["ro:group1", "rw:user1"]` will be evaluated as `["ro:user2", "rw:user1"]`, while `["rw:user1", "ro:group1"]`
will be evaluated as `["ro:user1", "ro:user2"]`.

## config.gen.js
An alternative way of writing a configuration file in `easy-samba` is writing a `config.gen.js` script instead of a `config.json` file.

A `config.gen.js` file is a Javascript script that you put into the directory `/share/config` inside the container (so, you put a `config.gen.js` file inside the same directory where you would put a `config.json` file).

`easy-samba`'s default behavior is to use the `/share/config/config.json` file, if it finds it. But, in case `config.json` file is missing, it will look for a `config.gen.js` file, and it will run it using command `node /share/config/config.gen.js`.

Therefore, the purpose of the `config.gen.js` script is to write a `config.json` file, in case the latter is missing. That's it.

This is the simplest example of `config.gen.js` file that you can write:
```js
const fs = require("fs");
const config = {
    "domain": "WORKGROUP",
    "users": [ { "name": "user1", "password": "123456" } ],
    "shares": [ { "name": "folder1", "path": "/share/folder1", "access": ["user1"] } ]
};
fs.writeFileSync("/share/config/config.json", JSON.stringify(config));
```

It does its job: i.e. generating a `config.json` file in a dynamic and scripted way. But it's not practical to write configuration files this way. Fortunately, `easy-samba` containers also include a Javascript library, located at `/startup/ConfigGen.js`, that helps generating `config.json` files using Javascript. Here's an example:
```js
const ConfigGen = require("/startup/ConfigGen.js");
const config = new ConfigGen();

config.domain("WORKGROUP");

config.users.add("user1", "123456");
config.shares.add("folder1", "/share/folder1", ["user1"]);

config.saveToFile("/share/config/config.json");
```

`ConfigGen.js` is a stand-alone one-file library, which has several methods and features that helps generating `config.json` files. Although it can be found already inside an `easy-samba` container, it can be downloaded and used outside of `easy-samba` (e.g. for testing purposes).

Full documentation of `ConfigGen.js` can be found in [`ConfigGen.js library` section of this Documentation](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#ConfigGenjs-library).

> NOTE: `config.gen.js` files should be kept as minimal as possible, avoiding using too many external dependencies. Moreover, remember that the only purpose of a `config.gen.js` script is writing a `/share/config/config.json` file.

## `ConfigGen.js` library
This is a library written in Javascript, that one can use to generate `config.json` files using a Javascript script. It is usually used in `config.gen.js` files, so it is recommended to first read [`config.gen.js` section of this Documentation](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#ConfigGenjs-library).

This library is located inside an `easy-samba` container at path `/startup/ConfigGen.js`. But, since it is a stand-alone one-file library, it can be downloaded and used also locally.

To get started, download `ConfigGen.js` on your local computer:
```sh
curl -sL https://raw.githubusercontent.com/adevur/docker-easy-samba/master/stable/latest/startup/ConfigGen.js > ./ConfigGen.js
```

Now, write a sample `config.gen.js` file with command `nano ./config.gen.js`:
```js
const ConfigGen = require("./ConfigGen.js");
```

You can create a new configuration object using:
```js
const config = new ConfigGen();
```

Then, you can modify that object using `ConfigGen.js` instance methods. For example, in order to set `domain` field, write:
```js
config.domain("WORKGROUP");
```

When you finished your configuration object, you can save it, for example, to file:
```js
config.saveToFile("./config.json");
```

> NOTE: when you write `config.gen.js` files that have to be placed inside an `easy-samba` container, remember to use `require("/startup/ConfigGen.js")` in order to include this library, and remember to use `config.saveToFile("/share/config/config.json")` when you later generate the `config.json` file. Using other paths is recommended only for testing purposes outside of an `easy-samba` container.

This is a list of all available methods of `ConfigGen.js` library:

- static methods and properties:

    - [`ConfigGen.version` static property](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configgenversion-static-property)

    - [`ConfigGen.fromJson()` static method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configgenfromjson-static-method)

    - [`ConfigGen.fromObject()` static method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configgenfromobject-static-method)

    - [`ConfigGen.fromFile()` static method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configgenfromfile-static-method)

    - [`ConfigGen.fromRemote()` static method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configgenfromremote-static-method)

    - [`ConfigGen.genRandomPassword()` static method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configgengenrandompassword-static-method)

    - [`ConfigGen.remote()` static method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configgenremote-static-method)
    
    - [`ConfigGen.getConfigPath()` static method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configgengetconfigpath-static-method)

- `remote` namespace methods:

    - [`remote.setConfig()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#remotesetconfig-method)

    - [`remote.getConfig()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#remotegetconfig-method)

    - [`remote.getInfo()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#remotegetinfo-method)

    - [`remote.isReachable()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#remoteisreachable-method)
    
    - [`remote.isTokenValid()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#remoteistokenvalid-method)
    
    - [`remote.getRemoteLogs()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#remotegetremotelogs-method)
    
    - [`remote.getAvailableAPI()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#remotegetavailableapi-method)
    
    - [`remote.getConfigHash()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#remotegetconfighash-method)
    
    - [`remote.getConfigPath()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#remotegetconfigpath-method)
    
    - [`remote.changeRemoteToken()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#remotechangeremotetoken-method)
    
    - [`remote.stopEasySamba()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#remotestopeasysamba-method)
    
    - [`remote.pauseEasySamba()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#remotepauseeasysamba-method)
    
    - [`remote.startEasySamba()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#remotestarteasysamba-method)
    
    - [`remote.certNego()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#remotecertnego-method)

- `config` namespace methods:

    - [`config.domain()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configdomain-method)

    - [`config.version()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configversion-method)

    - [`config.on()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configon-method)

    - [`config.saveToJson()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsavetojson-method)

    - [`config.saveToObject()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsavetoobject-method)

    - [`config.saveToFile()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsavetofile-method)

    - [`config.saveToRemote()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsavetoremote-method)

    - `config.users` namespace methods:

        - [`config.users.add()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configusersadd-method)

        - [`config.users.addArray()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configusersaddarray-method)

        - [`config.users.remove()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configusersremove-method)

        - [`config.users.get()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configusersget-method)

        - [`config.users.getAll()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configusersgetall-method)

        - [`config.users.setPassword()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configuserssetpassword-method)

    - `config.groups` namespace methods:

        - [`config.groups.add()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configgroupsadd-method)

        - [`config.groups.addArray()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configgroupsaddarray-method)

        - [`config.groups.remove()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configgroupsremove-method)

        - [`config.groups.get()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configgroupsget-method)

        - [`config.groups.getAll()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configgroupsgetall-method)
        
        - [`config.groups.getMembers()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configgroupsgetMembers-method)

        - [`config.groups.addMembers()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configgroupsaddmembers-method)

        - [`config.groups.removeMembers()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configgroupsremovemembers-method)

    - `config.shares` namespace methods:

        - [`config.shares.add()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsharesadd-method)

        - [`config.shares.addArray()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsharesaddarray-method)

        - [`config.shares.remove()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsharesremove-method)

        - [`config.shares.get()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsharesget-method)

        - [`config.shares.getAll()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsharesgetall-method)
        
        - [`config.shares.getAccess()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsharesgetAccess-method)
        
        - [`config.shares.setAccess()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsharessetAccess-method)

        - [`config.shares.addRules()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsharesaddrules-method)

        - [`config.shares.addRuleAt()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsharesaddruleat-method)

        - [`config.shares.removeRuleAt()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsharesremoveruleat-method)

        - [`config.shares.removeAllRules()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsharesremoveallrules-method)

        - [`config.shares.setPath()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsharessetpath-method)

        - [`config.shares.setGuest()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsharessetguest-method)

        - [`config.shares.setFixedRules()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsharessetfixedrules-method)

        - [`config.shares.setBaseRules()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsharessetbaserules-method)
        
        - [`config.shares.setSoftQuota()` method](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configsharessetsoftquota-method)

### `ConfigGen.version` static property
This is a static property of `ConfigGen`. It is a string, and its purpose is to inform the user about which `easy-samba` version this `ConfigGen.js` library comes from.

This can be useful in case you don't know if you can use a specific feature of `easy-samba` in your `config.gen.js` script. By reading `ConfigGen.version` property, you can check if this `ConfigGen.js` library is aware of the new changes made in `easy-samba` (e.g. in order to know if the current `ConfigGen.js` library knows about new sections introduced in `easy-samba` configuration files).

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

console.log( ConfigGen.version ); // 1.12
```

### `ConfigGen.fromJson()` static method
This is a static method that can be used in order to import an existing JSON configuration file, that can be later modified and re-saved.

- ARGUMENTS: `input`

  - PARAMETER `input`: a string that contains the configuration file in JSON format

- OUTPUT: an instance of ConfigGen

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");
const fs = require("fs");

const json = fs.readFileSync("./sample-config.json", "utf8");
const config = ConfigGen.fromJson(json);

config.domain("NEWDOMAIN");
config.users.add("new-user", "123456");

config.saveToFile("./new-config.json");
```

### `ConfigGen.fromObject()` static method
This is a static method that can be used in order to import an existing raw configuration object, that can be later modified and re-saved.

- ARGUMENTS: `input`

  - PARAMETER `input`: a Javascript object that contains an `easy-samba` configuration

- OUTPUT: an instance of ConfigGen

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const raw = {
    "domain": "WORKGROUP",
    "users": [ { "name": "user1", "password": "123456" } ],
    "shares": [ { "name": "folder1", "path": "/share/folder1", "access": ["user1"] } ]
};

const config = ConfigGen.fromObject(raw);

config.domain("NEWDOMAIN");
config.users.add("new-user", "123456");

config.saveToFile("./new-config.json");
```

### `ConfigGen.fromFile()` static method
This is a static method that can be used in order to import an existing configuration file, that can be later modified and re-saved.

- ARGUMENTS: `input`

  - PARAMETER `input`: a string that contains the path to the configuration file

- OUTPUT: an instance of ConfigGen

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = ConfigGen.fromFile("./sample-config.json");

config.domain("NEWDOMAIN");
config.users.add("new-user", "123456");

config.saveToFile("./new-config.json");
```

### `ConfigGen.fromRemote()` static method
This is a static method that can be used in order to import an existing configuration, that can be later modified and re-saved.

The configuration is retrieved from a remote `easy-samba` container using `EasySamba Remote API`.

> NOTE: this function is async and returns a Promise.

- ARGUMENTS: `remote`

  - PARAMETER `remote`: an instance of `remote` object; this object can be created using function `ConfigGen.remote()`

- OUTPUT: a Promise that resolves to an instance of ConfigGen

- ERRORS: this is the list of possible error messages that can be thrown by this function:

  - `"INVALID-INPUT"`: one or more parameters you provided to this function are not valid

  - `"INVALID-REMOTE-CONFIG"`: configuration retrieved from remote container contains errors and cannot be imported using function `ConfigGen.fromJson()`

  - `"CANNOT-CONNECT"`: remote container is not running, `Remote API` is not running, or parameters you gave (i.e. URL, port, certificate) are not correct

  - `"REMOTE-API:INVALID-TOKEN"`: token of `remote` is not the same token used in remote container
  
  - `"REMOTE-API:GET-CONFIG:CANNOT-READ"`: remote container is not able to read file `remote-api.config.json` for unknown reasons
  
  - `"REMOTE-API:CANNOT-RESPOND"`: remote container is not able to respond to your API request for unknown reasons
  
  - `"REMOTE-API:API-NOT-SUPPORTED"`: remote container doesn't support `get-config` API
  
  - `"INVALID-RESPONSE"`: remote container's response is invalid for unknown reasons

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

myAsyncFunction();

async function myAsyncFunction(){
    // remote container connection object
    const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");

    // let's retrieve remote config
    let config = undefined;
    try {
        config = await ConfigGen.fromRemote(remote);
    }
    catch (error){
        throw new Error("Cannot retrieve remote config: " + error.message);
    }

    // let's modify retrieved config
    config.domain("NEW-DOMAIN");
    config.users.add("new-user", "123456");

    // let's save it to local file
    config.saveToFile("./new-config.json");
}
```

### `ConfigGen.genRandomPassword()` static method
This is a static method that can be used in order to generate a random password. This is useful in case you want users to have a random password, instead of a manually generated one.

This function uses a cryptographically-strong random number generator to create a random password of minimum 4 characters (password length can be given as function argument). The newly-generated password will always have at least 1 lowercase letter, 1 uppercase letter, 1 digit, and 1 symbol.

- ARGUMENTS: `len` (optional)

  - PARAMETER `len`: it is a positive integer (greater or equal to 4) that specifies how many characters long will be the newly-generated password; if this parameter is missing, a default length of 12 characters will be used

- OUTPUT: a string that contains the newly-generated password

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const passw1 = ConfigGen.genRandomPassword();

console.log( passw1 ); // M]K:IF`4"#bN

const passw2 = ConfigGen.genRandomPassword(4);

console.log( passw2 ); // 2[gT
```

### `ConfigGen.getConfigPath()` static method
This method can be used to get the path where configuration files are located inside the current container. This is useful in case your `config.gen.js` script doesn't know where to save the `config.json` file.

- ARGUMENTS: N/A

- OUTPUT: it returns a string that contains the path where configuration files are located inside the local container (e.g. `"/share/config"`)

EXAMPLE:
```js
const ConfigGen = require("/startup/ConfigGen.js");

const path = ConfigGen.getConfigPath();

const config = new ConfigGen();

config.saveToFile(`${path}/config.json`);
```

### `ConfigGen.remote()` static method
This static method can be used to create a new object of type `remote`; the latter can be used to interact with a remote `easy-samba` container using `EasySamba Remote API`.

All the methods available for `remote` objects are listed as "`remote` namespace methods" in the [`ConfigGen.js` library section of this Documentation](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#ConfigGenjs-library).

- ARGUMENTS: `hostname`, `port`, `token` and `ca` (optional)

  - PARAMETER `hostname`: a string that contains the hostname of the remote container (e.g. `"localhost"`, `"192.168.1.2"`, `"www.example.com"`, ...)

  - PARAMETER `port`: an integer that represents the port, which the remote container's `Remote API` is listening to (by default, it's `9595`)

  - PARAMETER `token`: a string that contains the secret token used to authenticate on the remote container

  - PARAMETER `ca`: a string that contains the certificate used by the remote container for the HTTPS protocol (i.e. in case the remote container's certificate is self-signed or custom); this parameter can be set to `"unsafe"` if you don't want to verify the remote certificate (i.e. in case you're just debugging or testing); if this parameter is equal to `"global"`, certificate will be verified against a list of known certificates (i.e. in case the remote container's certificate is signed by a recognized global certification authority); if this parameter is missing or it's equal to `undefined`, remote container's certificate will be automatically retrieved via certificate negotiation feature of `Remote API` (i.e. using `remote.certNego()`)

- OUTPUT: an instance of `remote` object

- ERRORS: this is the list of possible error messages that can be thrown by this function:

  - `"INVALID-INPUT"`: one or more parameters you provided to this function are not valid

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");

remote.getInfo().then((result) => {
    console.log(`Remote container localhost is using easy-samba version ${result.version}`);
});


// about "ca" parameter:
    // the simplest thing you can do is letting ConfigGen retrieve automatically remote container's certificate through negotiation
    const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");

    // if the remote container has a self-signed certificate, you can pass it to this function
    //  NOTE: the self-signed certificate is located into the remote container at path "/share/config/remote-api.cert" (so you can copy it to all the clients)
    const remote = ConfigGen.remote("localhost", 9595, "my-secret-token", require("fs").readFileSync("/path/to/remote-api.cert", "ascii"));

    // if the remote container has a certificate that's been signed by a global-recognized Certification Authority, you can pass "global" as certificate
    const remote = ConfigGen.remote("www.example.com", 9595, "my-secret-token", "global");

    // if you don't care about security (e.g. you're just testing), you can also disable certificate verification process, passing "unsafe" as certificate
    //   SUGGESTION: use this only for testing and only if certificate negotiation is not available on the remote container
    const remote = ConfigGen.remote("localhost", 9595, "my-secret-token", "unsafe");
```

### `remote.setConfig()` method
This method can be used to set the configuration of a remote container using `EasySamba Remote API`.

> NOTE: this function is async and returns a Promise.

- ARGUMENTS: `configjson` and `hash` (optional)

  - PARAMETER `configjson`: a string that contains the configuration in JSON format, to be sent to the remote container
  
  - PARAMETER `hash`: a string that contains the MD5 hash of the previous configuration (hash must be in hexadecimal notation); if this parameter is present, remote container will check that old configuration has not changed in the meanwhile

- OUTPUT: it returns a Promise that resolves to `true` in case of success, otherwise `false`

- ERRORS: this is the list of possible error messages that can be thrown by this function:

  - `"INVALID-INPUT"`: one or more parameters you provided to this function are not valid

  - `"CANNOT-CONNECT"`: remote container is not running, `Remote API` is not running, or parameters you gave (i.e. URL, port, certificate) are not correct

  - `"REMOTE-API:INVALID-TOKEN"`: token of `remote` is not the same token used in remote container
  
  - `"REMOTE-API:SET-CONFIG:INVALID-HASH"`: in case configuration has changed
  
  - `"REMOTE-API:CANNOT-RESPOND"`: remote container is not able to respond to your API request for unknown reasons
  
  - `"REMOTE-API:API-NOT-SUPPORTED"`: remote container doesn't support `set-config` API
  
  - `"INVALID-RESPONSE"`: remote container's response is invalid for unknown reasons

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

myAsyncFunction();

async function myAsyncFunction(){
    // remote container connection object
    const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");

    // let's retrieve remote config
    let configjson = undefined;
    try {
        configjson = await remote.getConfig();
        console.log("Remote config: " + configjson); // Remote config: { "domain": "WORKGROUP", "users": [], "shares": [] }
    }
    catch (error){
        throw new Error("It's not been possible to get remote config: " + error.message);
    }
    
    // let's calculate the hash of the remote config
    const hash = remote.getConfigHash(configjson);
    console.log("Remote config hash: " + hash); // Remote config hash: E9AC5D72F7FFF70F46DFC826BA0CCDC7
    
    // now let's write a new config to remote container,
    //   passing hash of old config as parameter in order to be sure that no one else has modified remote config in the meanwhile
    try {
        const result = await remote.setConfig(`{ "domain": "NEW-DOMAIN", "users": [], "shares": [] }`, hash);
        console.log((result) ? "SUCCESS" : "ERROR");
    }
    catch (error){
        if (error.message === "REMOTE-API:SET-CONFIG:INVALID-HASH"){
            console.log("Someone modified remote config in the meanwhile!");
        }
        else {
            throw new Error("Unhandled error: " + error.message);
        }
    }
}
```

### `remote.getConfig()` method
This method can be used to get the configuration of a remote container using `EasySamba Remote API`.

> NOTE: this function is async and returns a Promise.

- ARGUMENTS: N/A

- OUTPUT: it returns a Promise that resolves to a string that contains the remote configuration in JSON format

- ERRORS: this is the list of possible error messages that can be thrown by this function:

  - `"CANNOT-CONNECT"`: remote container is not running, `Remote API` is not running, or parameters you gave (i.e. URL, port, certificate) are not correct

  - `"REMOTE-API:INVALID-TOKEN"`: token of `remote` is not the same token used in remote container
  
  - `"REMOTE-API:GET-CONFIG:CANNOT-READ"`: remote container is not able to read file `remote-api.config.json` for unknown reasons
  
  - `"REMOTE-API:CANNOT-RESPOND"`: remote container is not able to respond to your API request for unknown reasons
  
  - `"REMOTE-API:API-NOT-SUPPORTED"`: remote container doesn't support `get-config` API
  
  - `"INVALID-RESPONSE"`: remote container's response is invalid for unknown reasons

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

myAsyncFunction();

async function myAsyncFunction(){
    // remote container connection object
    const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");
    
    // let's retrieve remote config
    let configjson = undefined;
    try {
        configjson = await remote.getConfig();
    }
    catch (error){
        if (error.message === "REMOTE-API:GET-CONFIG:CANNOT-READ"){
            throw new Error("Remote container cannot read remote config file for unknown reasons.");
        }
        else {
            throw new Error("Unhandled error: " + error.message);
        }
    }

    // let's create a new config based on the retrieved configuration
    let config = undefined;
    try {
        config = ConfigGen.fromJson(configjson);
    }
    catch (error){
        throw new Error("Remote container config file is not valid.");
    }
}
```

### `remote.getInfo()` method
This method can be used to get some information about a remote container using `EasySamba Remote API`.

> NOTE: this function is async and returns a Promise.

- ARGUMENTS: N/A

- OUTPUT: it returns a Promise that resolves to an object like this: `{ running: true, version: "1.12.0", "config-path": "/share/config" }`; where `running` can be equal to `true` or `false` and tells us if the remote `easy-samba` container is currently working (in case no errors have been encountered during configuration validation process); where `version` is a string that tells us which version of `easy-samba` is running in the remote container; and where `config-path` is a string that contains the path where configuration files are located inside the remote container

- ERRORS: this is the list of possible error messages that can be thrown by this function:

  - `"CANNOT-CONNECT"`: remote container is not running, `Remote API` is not running, or parameters you gave (i.e. URL, port, certificate) are not correct

  - `"REMOTE-API:INVALID-TOKEN"`: token of `remote` is not the same token used in remote container
  
  - `"REMOTE-API:GET-INFO:ERROR"`: remote container is not able to retrieve info from remote container
  
  - `"REMOTE-API:CANNOT-RESPOND"`: remote container is not able to respond to your API request for unknown reasons
  
  - `"REMOTE-API:API-NOT-SUPPORTED"`: remote container doesn't support `get-info` API
  
  - `"INVALID-RESPONSE"`: remote container's response is invalid for unknown reasons

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

myAsyncFunction();

async function myAsyncFunction(){
    // remote container connection object
    const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");

    // let's retrieve remote information
    try {
        const info = await remote.getInfo();
        console.log("easy-samba status: " + (info.running) ? "running" : "not running");
        console.log("easy-samba version: " + info.version);
        console.log("easy-samba config path: " + info["config-path"]);
    }
    catch (error){
        if (error.message === "REMOTE-API:GET-INFO:ERROR"){
            console.log("It's not been possible to retrieve remote container info for unknown reasons.");
        }
        else {
            throw new Error("Unhandled error: " + error.message);
        }
    }
}
```

### `remote.getConfigPath()` method
This method can be used to get the path where configuration files are located inside a remote container, using `EasySamba Remote API`.

> NOTE: this function is async and returns a Promise.

- ARGUMENTS: N/A

- OUTPUT: it returns a Promise that resolves to a string that contains the path where configuration files are located inside the remote container

- ERRORS: this is the list of possible error messages that can be thrown by this function:

  - `"CANNOT-CONNECT"`: remote container is not running, `Remote API` is not running, or parameters you gave (i.e. URL, port, certificate) are not correct

  - `"REMOTE-API:INVALID-TOKEN"`: token of `remote` is not the same token used in remote container
  
  - `"REMOTE-API:GET-INFO:ERROR"`: remote container is not able to retrieve info from remote container
  
  - `"REMOTE-API:CANNOT-RESPOND"`: remote container is not able to respond to your API request for unknown reasons
  
  - `"REMOTE-API:API-NOT-SUPPORTED"`: remote container doesn't support `get-info` API
  
  - `"INVALID-RESPONSE"`: remote container's response is invalid for unknown reasons
  
  - `"UNKNOWN-INFORMATION"`: remote container supports `get-info` API, but it doesn't include `config-path` property in the returned informations

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

myAsyncFunction();

async function myAsyncFunction(){
    // remote container connection object
    const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");

    // let's retrieve remote information
    try {
        const path = await remote.getConfigPath();
        console.log("easy-samba config path: " + path);
    }
    catch (error){
        if (error.message === "REMOTE-API:API-NOT-SUPPORTED" || error.message === "UNKNOWN-INFORMATION"){
            console.log("Remote container can't tell us config path.");
        }
        else if (error.message === "REMOTE-API:GET-INFO:ERROR"){
            console.log("It's not been possible to retrieve remote container info for unknown reasons.");
        }
        else {
            throw new Error("Unhandled error: " + error.message);
        }
    }
}
```

### `remote.isReachable()` method
This method can be used to test connectivity towards a remote container using `EasySamba Remote API`. This method returns `false` in case the remote container is not reachable: URL, port or certificate are not correct, or remote container is not running, or `Remote API` is not running. This function doesn't check if provided `token` is valid (see function `remote.isTokenValid()` for that purpose).

> NOTE: this function is async and returns a Promise.

- ARGUMENTS: N/A

- OUTPUT: it returns a Promise that resolves to `true` or `false`

- ERRORS: this is the list of possible error messages that can be thrown by this function:
  
  - `"REMOTE-API:CANNOT-RESPOND"`: remote container is not able to respond to your API request for unknown reasons
  
  - `"INVALID-RESPONSE"`: remote container's response is invalid for unknown reasons

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

testRemote();

async function testRemote(){
    try {
        // remote container connection object
        const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");

        if ((await remote.isReachable()) === true){
            console.log("Connection was successful.");
        }
        else {
            console.log("It's not been possible to connect to remote container.");
        }
    }
    catch (error){
        throw new Error("Unhandled error: " + error.message);
    }
}
```

### `remote.isTokenValid()` method
This method can be used to check if a token is valid for connecting to a remote container via `EasySamba Remote API`. By default, the token that this function checks is the one that you passed to `ConfigGen.remote()`, but you can pass a custom token to check as a parameter.

> NOTE: this function is async and returns a Promise.

- ARGUMENTS: `customToken` (optional)

  - PARAMETER `customToken`: it is a non-empty string that contains the token to validate against the remote container; if this parameter is missing, this function will validate the token that you passed to `ConfigGen.remote()`

- OUTPUT: it returns a Promise that resolves to `true` or `false`

- ERRORS: this is the list of possible error messages that can be thrown by this function:
  
  - `"CANNOT-CONNECT"`: remote container is not running, `Remote API` is not running, or parameters you gave (i.e. URL, port, certificate) are not correct
  
  - `"REMOTE-API:CANNOT-RESPOND"`: remote container is not able to respond to your API request for unknown reasons
  
  - `"INVALID-RESPONSE"`: remote container's response is invalid for unknown reasons

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

testToken();

async function testToken(){
    try {
        // remote container connection object
        const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");

        if ((await remote.isTokenValid()) === true){
            console.log("Token 'my-secret-token' is valid.");
        }
        else {
            console.log("Token 'my-secret-token' is not valid.");
        }
        
        if ((await remote.isTokenValid("token2")) === true){
            console.log("Token 'token2' is valid.");
        }
        else {
            console.log("Token 'token2' is not valid.");
        }
    }
    catch (error){
        throw new Error("Unhandled error: " + error.message);
    }
}
```

### `remote.getRemoteLogs()` method
This method can be used to get `easy-samba` and `Remote API` logs of a remote container using `EasySamba Remote API`.

> NOTE: this function is async and returns a Promise.

- ARGUMENTS: N/A

- OUTPUT: it returns a Promise that resolves to an object that looks like this: `{ "easy-samba-logs": "...", "remote-api-logs": "..." }`; logs are retrieved from files `/share/config/easy-samba.logs` and `/share/config/remote-api.logs`, located inside the remote container

- ERRORS: this is the list of possible error messages that can be thrown by this function:

  - `"CANNOT-CONNECT"`: remote container is not running, `Remote API` is not running, or parameters you gave (i.e. URL, port, certificate) are not correct

  - `"REMOTE-API:INVALID-TOKEN"`: token of `remote` is not the same token used in remote container
  
  - `"REMOTE-API:GET-LOGS:CANNOT-READ"`: remote container is not able to read files `/share/config/easy-samba.logs` or `/share/config/remote-api.logs` for unknown reasons
  
  - `"REMOTE-API:CANNOT-RESPOND"`: remote container is not able to respond to your API request for unknown reasons
  
  - `"REMOTE-API:API-NOT-SUPPORTED"`: remote container doesn't support `get-logs` API
  
  - `"INVALID-RESPONSE"`: remote container's response is invalid for unknown reasons

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

printLogs();

async function printLogs(){
    // remote container connection object
    const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");

    // let's retrieve remote logs
    try {
        const logs = await remote.getRemoteLogs();
        console.log("Remote container logs:\n" + logs["easy-samba-logs"]);
        console.log("EasySamba Remote API logs:\n" + logs["remote-api-logs"]);
    }
    catch (error){
        if (error.message === "REMOTE-API:GET-LOGS:CANNOT-READ"){
            console.log("It's not been possible to read remote container's logs.");
        }
        else {
            throw new Error("Unhandled error: " + error.message);
        }
    }
}
```

### `remote.getAvailableAPI()` method
This method can be used to get the list of supported `Remote API` methods of an `easy-samba` remote container.

> NOTE: this function is async and returns a Promise.

- ARGUMENTS: N/A

- OUTPUT: it returns a Promise that resolves to an array of strings that contains the list of supported `Remote API` methods

- ERRORS: this is the list of possible error messages that can be thrown by this function:

  - `"CANNOT-CONNECT"`: remote container is not running, `Remote API` is not running, or parameters you gave (i.e. URL, port, certificate) are not correct

  - `"REMOTE-API:INVALID-TOKEN"`: token of `remote` is not the same token used in remote container
  
  - `"REMOTE-API:CANNOT-RESPOND"`: remote container is not able to respond to your API request for unknown reasons
  
  - `"REMOTE-API:API-NOT-SUPPORTED"`: remote container doesn't support `get-available-api` API
  
  - `"INVALID-RESPONSE"`: remote container's response is invalid for unknown reasons

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

printAvailableAPI();

async function printAvailableAPI(){
    // remote container connection object
    const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");

    // let's retrieve supported api
    try {
        const apis = await remote.getAvailableAPI();
        console.log("Available API methods:", apis); // Available API methods: ["set-config", "get-config", "get-info", "hello", "get-logs", "get-available-api"]
    }
    catch (error){
        if (error.message === "REMOTE-API:API-NOT-SUPPORTED"){
            console.log("Remote container doesn't support 'get-available-api' method.");
        }
        else {
            throw new Error("Unhandled error: " + error.message);
        }
    }
}
```

### `remote.getConfigHash()` method
This method can be used to calculate the MD5 hash of a string, that can be then passed to `remote.setConfig()` function.

- ARGUMENTS: `input`

  - PARAMETER `input`: it is the string of which the hash will be calculated

- OUTPUT: it returns a string that contains the MD5 hash of `input`; this hash is in hexadecimal notation, with all uppercase letters

- ERRORS: this is the list of possible error messages that can be thrown by this function:

  - `"INVALID-INPUT"`: one or more parameters you provided to this function are not valid

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

myAsyncFunction();

async function myAsyncFunction(){
    // remote container connection object
    const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");

    // let's retrieve remote config
    let configjson = undefined;
    try {
        configjson = await remote.getConfig();
        console.log("Remote config: " + configjson); // Remote config: { "domain": "WORKGROUP", "users": [], "shares": [] }
    }
    catch (error){
        throw new Error("It's not been possible to get remote config: " + error.message);
    }
    
    // let's calculate the hash of the remote config
    const hash = remote.getConfigHash(configjson);
    console.log("Remote config hash: " + hash); // Remote config hash: E9AC5D72F7FFF70F46DFC826BA0CCDC7
    
    // now let's write a new config to remote container,
    //   passing hash of old config as parameter in order to be sure that no one else has modified remote config in the meanwhile
    try {
        const result = await remote.setConfig(`{ "domain": "NEW-DOMAIN", "users": [], "shares": [] }`, hash);
        console.log((result) ? "SUCCESS" : "ERROR");
    }
    catch (error){
        if (error.message === "REMOTE-API:SET-CONFIG:INVALID-HASH"){
            console.log("Someone modified remote config in the meanwhile!");
        }
        else {
            throw new Error("Unhandled error: " + error.message);
        }
    }
}
```

### `remote.changeRemoteToken()` method
This method can be used to modify the secret token on a remote container, using `EasySamba Remote API`. This function also updates the token stored in the current `remote` object, so that when you use `remote` functions, they will use updated token. This function will also update file `/share/config/remote-api.json` inside the remote container.

> NOTE: this function is async and returns a Promise.

- ARGUMENTS: `newToken`

  - PARAMETER `newToken`: it is a non-empty string that contains the new token to permanently set in the remote container for future use

- OUTPUT: it returns a Promise that resolves to `true` or `false`

- ERRORS: this is the list of possible error messages that can be thrown by this function:

  - `"INVALID-INPUT"`: one or more parameters you provided to this function are not valid

  - `"CANNOT-CONNECT"`: remote container is not running, `Remote API` is not running, or parameters you gave (i.e. URL, port, certificate) are not correct
  
  - `"REMOTE-API:CANNOT-RESPOND"`: remote container is not able to respond to your API request for unknown reasons
  
  - `"REMOTE-API:INVALID-TOKEN"`: token of `remote` is not the same token used in remote container
  
  - `"REMOTE-API:API-NOT-SUPPORTED"`: remote container doesn't support `change-token` API
  
  - `"INVALID-RESPONSE"`: remote container's response is invalid for unknown reasons

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

changeToken();

async function changeToken(){
    try {
        // remote container connection object
        const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");

        console.log("Token 'my-secret-token' is valid? " + (await remote.isTokenValid())); // Token 'my-secret-token' is valid? true
        
        if (await remote.changeRemoteToken("new-token")){
            console.log("Token changed successfully.");
        }
        else {
            console.log("ERROR");
        }
        
        console.log("Token 'new-token' is valid? " + (await remote.isTokenValid())); // Token 'new-token' is valid? true
        
        console.log("Token 'my-secret-token' is valid? " + (await remote.isTokenValid("my-secret-token"))); // Token 'my-secret-token' is valid? false
    }
    catch (error){
        throw new Error("Unhandled error: " + error.message);
    }
}
```

### `remote.certNego()` method
This method can be used to manually retrieve the server's certificate of a remote container, using certificate-negotiation feature of `EasySamba Remote API`.

> NOTE: this function is async and returns a Promise.

- ARGUMENTS: N/A

- OUTPUT: it returns a Promise that resolves to a string that contains the actual certificate

- ERRORS: this is the list of possible error messages that can be thrown by this function:

  - `"CANNOT-CONNECT"`: remote container is not running, `Remote API` is not running, or parameters you gave (i.e. URL or port) are not correct

  - `"INVALID-TOKEN"`: token of `remote` is not the same token used in remote container
  
  - `"CERT-NEGO-NOT-SUPPORTED"`: remote container doesn't support certificate-negotiation feature
  
  - `"UNSAFE-CERT-NEGO-PROTOCOL"`: remote container uses an old and unsafe version of certificate-negotiation protocol

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

myAsyncFunction();

async function myAsyncFunction(){
    // remote container connection object
    const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");

    // let's retrieve remote container's certificate
    try {
        const cert = await remote.certNego();
        console.log(cert); // ----- BEGIN CERTIFICATE -----........
    }
    catch (error){
        if (error.message === "INVALID-TOKEN"){
            console.log("Token you passed to 'ConfigGen.remote()' is not correct.");
        }
        else if (error.message === "CERT-NEGO-NOT-SUPPORTED"){
            console.log("Remote container doesn't support certificate-negotiation.");
        }
        else {
            throw new Error("Unhandled error: " + error.message);
        }
    }
}
```

### `remote.stopEasySamba()` method
This method can be used to stop a remote container using `EasySamba Remote API`. When you stop `easy-samba` this way, the container where `easy-samba` and `Remote API` are running will stop and exit.

> NOTE: you will not be able to restart the remote container from a remote client: if you use this function, you have to use `Docker` or `systemd` in order to restart `easy-samba`. If you want to be able to restart `easy-samba` from a remote client, consider using `remote.pauseEasySamba()`.

> NOTE 2: this function is almost useless in case you have set the container to automatically restart in case it stops (e.g. if you have set parameter `--restart always` in `Docker`, or you have set option `Restart=always` in `systemd`).

> NOTE 3: this function is async and returns a Promise.

- ARGUMENTS: `message` (optional)

  - PARAMETER `message`: it is a string that will be included in `easy-samba` logs (e.g. if you want to remember why you stopped `easy-samba`)

- OUTPUT: it returns a Promise that resolves to `true` in case of success, otherwise `false`

- ERRORS: this is the list of possible error messages that can be thrown by this function:

  - `"INVALID-INPUT"`: one or more parameters you provided to this function are not valid

  - `"CANNOT-CONNECT"`: remote container is not running, `Remote API` is not running, or parameters you gave (i.e. URL, port, certificate) are not correct

  - `"REMOTE-API:INVALID-TOKEN"`: token of `remote` is not the same token used in remote container
  
  - `"REMOTE-API:CANNOT-RESPOND"`: remote container is not able to respond to your API request for unknown reasons
  
  - `"REMOTE-API:API-NOT-SUPPORTED"`: remote container doesn't support `stop-easy-samba` API
  
  - `"INVALID-RESPONSE"`: remote container's response is invalid for unknown reasons

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

myAsyncFunction();

async function myAsyncFunction(){
    // remote container connection object
    const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");

    // let's try to stop easy-samba
    try {
        const result = await remote.stopEasySamba();
        console.log((result) ? "SUCCESS" : "ERROR");
    }
    catch (error){
        throw new Error("Unhandled error: " + error.message);
    }
    
    // let's wait few seconds
    ......
    
    // let's check if remote container is still running
    try {
        const running = await remote.isReachable();
        console.log((running) ? "Remote container is still running." : "Remote container is not running.");
    }
    catch (error){
        throw new Error("Unhandled error: " + error.message);
    }
}
```

### `remote.pauseEasySamba()` method
This method can be used to pause the status of a remote container using `EasySamba Remote API`. When you pause `easy-samba` this way, the remote container will keep running, but `easy-samba` will interrupt its working status and the SAMBA server. To unpause the remote container, use `remote.startEasySamba()`.

> NOTE: if you wish to stop the remote container completely (and not just pausing it), consider using `remote.stopEasySamba()`.

> NOTE 2: this function is async and returns a Promise.

- ARGUMENTS: N/A

- OUTPUT: it returns a Promise that resolves to `true` in case of success, otherwise `false`

- ERRORS: this is the list of possible error messages that can be thrown by this function:

  - `"CANNOT-CONNECT"`: remote container is not running, `Remote API` is not running, or parameters you gave (i.e. URL, port, certificate) are not correct

  - `"REMOTE-API:INVALID-TOKEN"`: token of `remote` is not the same token used in remote container
  
  - `"REMOTE-API:CANNOT-RESPOND"`: remote container is not able to respond to your API request for unknown reasons
  
  - `"REMOTE-API:API-NOT-SUPPORTED"`: remote container doesn't support `pause-easy-samba` API
  
  - `"INVALID-RESPONSE"`: remote container's response is invalid for unknown reasons

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

myAsyncFunction();

async function myAsyncFunction(){
    // remote container connection object
    const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");

    // let's try to pause easy-samba
    try {
        const result = await remote.pauseEasySamba();
        console.log((result) ? "easy-samba paused" : "easy-samba not paused");
    }
    catch (error){
        throw new Error("Unhandled error: " + error.message);
    }
    
    // let's wait few seconds
    ......
    
    // let's check easy-samba status
    try {
        const info = await remote.getInfo();
        console.log("easy-samba status:", (info.running === true) ? "running" : "not running");
    }
    catch (error){
        throw new Error("Unhandled error: " + error.message);
    }
    
    // let's start easy-samba again
    try {
        const result = await remote.startEasySamba();
        console.log((result) ? "easy-samba started" : "easy-samba not started");
    }
    catch (error){
        throw new Error("Unhandled error: " + error.message);
    }
}
```

### `remote.startEasySamba()` method
This method can be used to unpause the status of a remote container using `EasySamba Remote API`. This method only works with remote containers that have been paused earlier with function `remote.pauseEasySamba()`.

> NOTE: this function will not restart a remote container that has been stopped with function `remote.stopEasySamba()`.

> NOTE 2: this function is async and returns a Promise.

- ARGUMENTS: N/A

- OUTPUT: it returns a Promise that resolves to `true` in case of success, otherwise `false`

- ERRORS: this is the list of possible error messages that can be thrown by this function:

  - `"CANNOT-CONNECT"`: remote container is not running, `Remote API` is not running, or parameters you gave (i.e. URL, port, certificate) are not correct

  - `"REMOTE-API:INVALID-TOKEN"`: token of `remote` is not the same token used in remote container
  
  - `"REMOTE-API:CANNOT-RESPOND"`: remote container is not able to respond to your API request for unknown reasons
  
  - `"REMOTE-API:API-NOT-SUPPORTED"`: remote container doesn't support `start-easy-samba` API
  
  - `"INVALID-RESPONSE"`: remote container's response is invalid for unknown reasons

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

myAsyncFunction();

async function myAsyncFunction(){
    // remote container connection object
    const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");

    // let's try to pause easy-samba
    try {
        const result = await remote.pauseEasySamba();
        console.log((result) ? "easy-samba paused" : "easy-samba not paused");
    }
    catch (error){
        throw new Error("Unhandled error: " + error.message);
    }
    
    // let's wait few seconds
    ......
    
    // let's check easy-samba status
    try {
        const info = await remote.getInfo();
        console.log("easy-samba status:", (info.running === true) ? "running" : "not running");
    }
    catch (error){
        throw new Error("Unhandled error: " + error.message);
    }
    
    // let's start easy-samba again
    try {
        const result = await remote.startEasySamba();
        console.log((result) ? "easy-samba started" : "easy-samba not started");
    }
    catch (error){
        throw new Error("Unhandled error: " + error.message);
    }
}
```

### `config.domain()` method
This is a method that can be used in order to set the `domain` section of an instance of `ConfigGen`. It can also be used to retrieve current value of `domain` section, if used without parameters.

> NOTE: by default, `domain` section is equal to `WORKGROUP` when a new `ConfigGen` instance is created.

- ARGUMENTS: `input` (optional)

  - PARAMETER `input`: a string that contains the `domain` name to set

- OUTPUT: in case no parameters are passed, it returns the current value of `domain`

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

console.log( config.domain() ); // WORKGROUP
config.domain("NEW-DOMAIN");
console.log( config.domain() ); // NEW-DOMAIN
```

### `config.version()` method
This is a method that can be used in order to set the `version` section of an instance of `ConfigGen`. It can also be used to retrieve current value of `version` section, if used without parameters.

- ARGUMENTS: `input` (optional)

  - PARAMETER `input`: it is a string that contains the `version` value to set; if `input` is equal to `undefined`, `version` section will be removed

- OUTPUT: in case no parameters are passed, it returns the current value of `version`

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

console.log( config.version() ); // undefined
config.version("1.3");
console.log( config.version() ); // "1.3"

// since "version" section is optional, you can also remove it this way:
config.version(undefined);
```

### `config.on()` method
This method can be used to register handlers for `ConfigGen` events.

- ARGUMENTS: `event` and `cb`

  - PARAMETER `event`: it's a string that specifies the event you want to handle; it can also be an array of strings that contains all the events that you want to handle

  - PARAMETER `cb`: it's the callback function to call every time the specified event is triggered; parameters `current` and `previous` are usually passed to this callback, depending on the event

List of supported events:

- `user-add`: triggered when a new user is added to `config`. Its parameter is `current` (that is a copy of the newly added user).

- `user-remove`: triggered when a user gets removed from `config`. Its parameter is `previous` (that is a copy of the removed user).

- `user-change`: triggered when a user is modified. This event gets triggered together with `user-change-password` event. Its parameters are `current` (that is a copy of the user after the change) and `previous` (that is a copy of the user before the change).

- `user-change-password`: triggered when a user's password is modified. This event gets triggered together with `user-change` event. Its parameters are `current` (that is a copy of the user after the change) and `previous` (that is a copy of the user before the change).

- `group-add`: triggered when a new group is added to `config`. Its parameter is `current` (that is a copy of the newly added group).

- `group-remove`: triggered when a group gets removed from `config`. Its parameter is `previous` (that is a copy of the removed group).

- `group-change`: triggered when a group is modified. This event gets triggered together with `group-change-members` event. Its parameters are `current` (that is a copy of the group after the change) and `previous` (that is a copy of the group before the change).

- `group-change-members`: triggered when a member is added or removed from a group. This event gets triggered together with `group-change` event. Its parameters are `current` (that is a copy of the group after the change) and `previous` (that is a copy of the group before the change).

- `share-add`: triggered when a new share is added to `config`. Its parameter is `current` (that is a copy of the newly added share).

- `share-remove`: triggered when a share gets removed from `config`. Its parameter is `previous` (that is a copy of the removed share).

- `share-change`: triggered when a share is modified. This event gets triggered together with `share-change-access`, `share-change-path` and `share-change-guest` events. Its parameters are `current` (that is a copy of the share after the change) and `previous` (that is a copy of the share before the change).

- `share-change-access`: triggered when an access rule is added or removed from a share. This event gets triggered together with `share-change` event. Its parameters are `current` (that is a copy of the share after the change) and `previous` (that is a copy of the share before the change).

- `share-change-path`: triggered when a share's path is modified. This event gets triggered together with `share-change` event. Its parameters are `current` (that is a copy of the share after the change) and `previous` (that is a copy of the share before the change).

- `share-change-guest`: triggered when a share's `guest` property is modified. This event gets triggered together with `share-change` event. Its parameters are `current` (that is a copy of the share after the change) and `previous` (that is a copy of the share before the change).

- `share-change-softquota`: triggered when a share's `soft-quota` property is modified. This event gets triggered together with `share-change` event. Its parameters are `current` (that is a copy of the share after the change) and `previous` (that is a copy of the share before the change).

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

// let's register some handlers

config.on("user-add", (current) => {
    console.log(`Added new user '${current["name"]}' with password '${current["password"]}'.`);
});

config.on("user-change-password", (current, previous) => {
    console.log(`Changed password of user '${current["name"]}' from '${previous["password"]}' to '${current["password"]}'.`);
});

config.on("user-remove", (previous) => {
    console.log(`Removed user '${previous["name"]}'.`);
});

config.on("share-change-access", (current, previous) => {
    console.log(`Changed access rules of share '${current["name"]}' from`, previous["access"], `to`, current["access"]);
});

// let's trigger some events

config.users.add("user1", "123456"); // OUTPUT: Added new user 'user1' with password '123456'.

config.users.setPassword("user1", "aaa"); // OUTPUT: Changed password of user 'user1' from '123456' to 'aaa'.

config.users.setPassword("user1", "aaa"); // this will not trigger "user-change-password" event (nor "user-change" event), since password has not really changed

config.users.remove("user1"); // OUTPUT: Removed user 'user1'.

config.shares.add("folder1", "/share/folder1", ["rw:user1", "ro:user2"]); // no output because we didn't register a handler for "share-add" event

config.shares.addRules("folder1", ["no:user3"]); // OUTPUT: Changed access rules of share 'folder1' from ["rw:user1", "ro:user2"] to ["rw:user1", "ro:user2", "no:user3"]

// also, note that:
config.on(["share-add", "share-change"], () => {
    console.log("something changed");
});
// is equivalent to:
config.on("share-add", () => {
    console.log("something changed");
});
config.on("share-change", () => {
    console.log("something changed");
});
```

### `config.saveToJson()` method
This method can be used to generate a JSON string from an instance of `ConfigGen`.

- ARGUMENTS: N/A

- OUTPUT: this method returns a string in JSON format

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.domain("WORKGROUP");
config.users.add("user1", "123456");
config.shares.add("user1", "/share/user1", ["rw:user1"]);

console.log( config.saveToJson() ); // {"domain": "WORKGROUP", "users": [{ "name": "user1", "password": "123456" }], "shares": [{ "name": "user1", "path": "/share/user1", "access": ["rw:user1"] }]}
```

### `config.saveToObject()` method
This method can be used to generate a Javascript object from an instance of `ConfigGen`.

- ARGUMENTS: N/A

- OUTPUT: this method returns a Javascript object

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.domain("WORKGROUP");
config.users.add("user1", "123456");
config.shares.add("user1", "/share/user1", ["rw:user1"]);

console.log( config.saveToObject() ); // {"domain": "WORKGROUP", "users": [{ "name": "user1", "password": "123456" }], "shares": [{ "name": "user1", "path": "/share/user1", "access": ["rw:user1"] }]}
```

### `config.saveToFile()` method
This method can be used to save an instance of `ConfigGen` to a file.

- ARGUMENTS: `path`

  - PARAMETER `path`: the path where the file will be written

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.domain("WORKGROUP");
config.users.add("user1", "123456");
config.shares.add("user1", "/share/user1", ["rw:user1"]);

config.saveToFile("./config.json");
```

### `config.saveToRemote()` method
This method can be used to save an instance of `ConfigGen` to a remote `easy-samba` container.

The configuration is sent to a remote `easy-samba` container using `EasySamba Remote API`.

> NOTE: this function is async and returns a Promise.

- ARGUMENTS: `remote` and `options` (optional)

  - PARAMETER `remote`: an instance of `remote` object; this object can be created using function `ConfigGen.remote()`
  
  - PARAMETER `options`: an object that contains additional options; key `checkSavedHash` is a boolean (default value is `false`), and if it's set to `true`, `config.saveToRemote()` will pass previous config's hash (saved by `ConfigGen.fromRemote(remote)` and `config.saveToRemote(remote, { checkSavedHash: true })` earlier)

- OUTPUT: a Promise that resolves to `true` in case of success, otherwise `false`

- ERRORS: this is the list of possible error messages that can be thrown by this function:

  - `"INVALID-INPUT"`: one or more parameters you provided to this function are not valid
  
  - `"CANNOT-SAVE-TO-JSON"`: it's not been possible to use function `config.saveToJson()` to generate JSON output (before sending it to remote container)

  - `"CANNOT-CONNECT"`: remote container is not running, `Remote API` is not running, or parameters you gave (i.e. URL, port, certificate) are not correct

  - `"REMOTE-API:INVALID-TOKEN"`: token of `remote` is not the same token used in remote container
  
  - `"REMOTE-API:SET-CONFIG:INVALID-HASH"`: in case configuration has changed
  
  - `"REMOTE-API:CANNOT-RESPOND"`: remote container is not able to respond to your API request for unknown reasons
  
  - `"REMOTE-API:API-NOT-SUPPORTED"`: remote container doesn't support `set-config` API
  
  - `"INVALID-RESPONSE"`: remote container's response is invalid for unknown reasons

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");
const assert = require("assert");

myAsyncFunction();

async function myAsyncFunction(){
    // let's create a sample config
    const config = new ConfigGen();
    config.users.add("user1");

    // remote container connection object
    const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");

    // let's save local config to remote container
    try {
        assert( await config.saveToRemote(remote) );
    }
    catch (error){
        throw new Error("Cannot save to remote.");
    }
    
    
    
    // another scenario
    
    
    const remote = ConfigGen.remote("localhost", 9595, "my-secret-token");
    
    // let's retrieve remote config
    let config = undefined;
    try {
        config = await ConfigGen.fromRemote(remote);
    }
    catch (error){
        throw new Error("It's not been possible to get remote config.");
    }
    
    // let's modify config
    config.domain("NEW-DOMAIN");
    
    // let's save config to remote,
    //   and let's check that no one else has modified remote config in the meanwhile
    try {
        const result = await config.saveToRemote(remote, { checkSavedHash: true });
        console.log((result) ? "SUCCESS" : "ERROR");
    }
    catch (error){
        if (error.message === "REMOTE-API:SET-CONFIG:INVALID-HASH"){
            console.log("Someone modified remote config in the meanwhile!");
        }
        else {
            throw new Error("Unhandled error: " + error.message);
        }
    }
}
```

### `config.users.add()` method
This is a method that can be used in order to add a user to the `users` section of an instance of `ConfigGen`.

> NOTE: you cannot add a user if there's a group with the same name.

- ARGUMENTS: `username` and `password` (optional)

  - PARAMETER `username`: it is a non-empty string that contains the username of the new user

  - PARAMETER `password`: it is a string that contains the password of the new user; if this parameter is missing, the newly-created user will have a random password of 12 characters (generated using `ConfigGen.genRandomPassword()`); if `password` is an integer, it will be interpreted as the length of the newly-generated random password

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.users.add("user1", "123456");

config.users.add("user2");
console.log( config.users.get("user2") ); // { "name": "user2", "password": "K3?\J.5 bfBt" }

config.users.add("user3", 4);
console.log( config.users.get("user3") ); // { "name": "user3", "password": "aB!2" }
```

### `config.users.addArray()` method
This is a method that can be used in order to add one or more users to the `users` section of an instance of `ConfigGen`.

- ARGUMENTS: `input`

  - PARAMETER `input`: it is an array of Javascript objects; an element of this array looks like this: `{ "name": "user1", "password": "123456" }`, or like this: `{ "name": "user2" }` (if `password` property is missing, a new random password of 12 characters will be generated for the user), or like this: `{ "name": "user3", "password": 4 }` (if `password` property is an integer, it will be interpreted as the length of the newly-generated random password)

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.users.addArray([
    { "name": "user1", "password": "123456" },
    { "name": "user2" },
    { "name": "user3", "password": 4 },
]);
// this is equivalent to writing:
config.users.add("user1", "123456");
config.users.add("user2");
config.users.add("user3", 4);
```

### `config.users.remove()` method
This is a method that can be used in order to remove one or more users from the `users` section of an instance of `ConfigGen`.

- ARGUMENTS: `username`

  - PARAMETER `username`: it is a string that contains the username of the user to remove, or it can also be an array of strings (in which every element is a username to remove)

> NOTE: parameter `username` can be an array of strings only since version `1.5` of `ConfigGen.js` library.

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.users.addArray([
    { "name": "user1", "password": "123456" },
    { "name": "user2", "password": "aaabbb" },
    { "name": "user3", "password": "aaabbb" }
]);

console.log( config.users.get() ); // ["user1", "user2", "user3"]

config.users.remove("user1");

console.log( config.users.get() ); // ["user2", "user3"]

config.users.remove(["user2", "user3"]);

console.log( config.users.get() ); // []
```

### `config.users.get()` method
This is a method that can be used in order to retrieve the list of all users from the `users` section of an instance of `ConfigGen`, or it can be used in order to retrieve information about a specific user.

- ARGUMENTS: `username` (optional)

  - PARAMETER `username`: it is a string that contains the username of the user to retrieve information about

- OUTPUT: in case no parameters are passed, it returns an array with all the usernames of the `users` section; in case `username` parameter is passed, it returns a Javascript object like this: `{ "name": "user1", "password": "123456" }`

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.users.addArray([
    { "name": "user1", "password": "123456" },
    { "name": "user2", "password": "aaabbb" }
]);

console.log( config.users.get() ); // ["user1", "user2"]

console.log( config.users.get("user1")["password"] ); // 123456
```

### `config.users.getAll()` method
This is a method that can be used in order to retrieve detailed information about all users from the `users` section of an instance of `ConfigGen`.

- ARGUMENTS: N/A

- OUTPUT: it returns an array of Javascript objects; every element of the array looks like this: `{ "name": "user1", "password": "123456" }`

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.users.addArray([
    { "name": "user1", "password": "123456" },
    { "name": "user2", "password": "aaabbb" }
]);

console.log( config.users.getAll() ); // [{ "name": "user1", "password": "123456" },{ "name": "user2", "password": "aaabbb" }]
```

### `config.users.setPassword()` method
This is a method that can be used in order to change the password of an existing user of the `users` section of an instance of `ConfigGen`.

- ARGUMENTS: `username` and `password`

  - PARAMETER `username`: it is a string that contains the username of the user

  - PARAMETER `password`: it is a string that contains the new password of the specified user

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.users.add("user1", "123456");

console.log( config.users.get("user1")["password"] ); // 123456

config.users.setPassword("user1", "aaabbb");

console.log( config.users.get("user1")["password"] ); // aaabbb
```

### `config.groups.add()` method
This is a method that can be used in order to add a group to the `groups` section of an instance of `ConfigGen`.

> NOTE: you cannot add a group if there's a user with the same name.

- ARGUMENTS: `groupname` and `members`

  - PARAMETER `groupname`: it is a non-empty string that contains the name of the new group

  - PARAMETER `members`: it is an array of strings that contains the list of members of the group

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.groups.add("group1", ["user1", "user2"]);
config.groups.add("group2", ["group1", "user3"]);
```

### `config.groups.addArray()` method
This is a method that can be used in order to add one or more groups to the `groups` section of an instance of `ConfigGen`.

- ARGUMENTS: `input`

  - PARAMETER `input`: it is an array of Javascript objects; an element of this array looks like this: `{ "name": "group1", "users": ["user1", "user2"] }`

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.groups.addArray([
    { "name": "group1", "members": ["user1", "user2"] },
    { "name": "group2", "members": ["group1", "user3"] }
]);
// this is equivalent to writing:
config.groups.add("group1", ["user1", "user2"]);
config.groups.add("group2", ["group1", "user3"]);
```

### `config.groups.remove()` method
This is a method that can be used in order to remove one or more groups from the `groups` section of an instance of `ConfigGen`.

- ARGUMENTS: `groupname`

  - PARAMETER `groupname`: it is a string that contains the name of the group to remove, or it can also be an array of strings (in which every element is the name of a group to remove)

> NOTE: parameter `groupname` can be an array of strings only since version `1.5` of `ConfigGen.js` library.

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.groups.addArray([
    { "name": "group1", "members": ["user1", "user2"] },
    { "name": "group2", "members": ["group1", "user3"] },
    { "name": "group3", "members": ["user4"] }
]);

console.log( config.groups.get() ); // ["group1", "group2", "group3"]

config.groups.remove("group1");

console.log( config.groups.get() ); // ["group2", "group3"]

config.groups.remove(["group2", "group3"]);

console.log( config.groups.get() ); // []
```

### `config.groups.get()` method
This is a method that can be used in order to retrieve the list of all groups from the `groups` section of an instance of `ConfigGen`, or it can be used in order to retrieve information about a specific group.

- ARGUMENTS: `groupname` (optional)

  - PARAMETER `groupname`: it is a string that contains the name of the group to retrieve information about

- OUTPUT: in case no parameters are passed, it returns an array with all the group names of the `groups` section; in case `groupname` parameter is passed, it returns a Javascript object like this: `{ "name": "group1", "users": ["user1", "user2"] }`

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.groups.addArray([
    { "name": "group1", "members": ["user1", "user2"] },
    { "name": "group2", "members": ["group1", "user3"] }
]);

console.log( config.groups.get() ); // ["group1", "group2"]

console.log( config.groups.get("group1")["members"] ); // ["user1", "user2"]
```

### `config.groups.getAll()` method
This is a method that can be used in order to retrieve detailed information about all groups from the `groups` section of an instance of `ConfigGen`.

- ARGUMENTS: N/A

- OUTPUT: it returns an array of Javascript objects; every element of the array looks like this: `{ "name": "group1", "users": ["user1", "user2"] }`

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.groups.addArray([
    { "name": "group1", "members": ["user1", "user2"] },
    { "name": "group2", "members": ["group1", "user3"] }
]);

console.log( config.groups.getAll() ); // [{ "name": "group1", "members": ["user1", "user2"] },{ "name": "group2", "members": ["group1", "user3"] }]
```

### `config.groups.getMembers()` method
This is a method that can be used to retrieve the list of all members of a group.

> NOTE: this function works only if the members of the group are existing users and groups.

- ARGUMENTS: `groupname`

  - PARAMETER `groupname`: it is a string that contains the name of the group to retrieve the list of members of

- OUTPUT: it returns an array with the list of members (e.g. `["user1", "user2", "user3"]`)

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.users.add("u1");
config.users.add("u2");
config.users.add("u3");

config.groups.add("g1", ["u1", "u2"]);
config.groups.add("g2", ["g1", "u3"]);

console.log( config.groups.getMembers("g1") ); // ["u1", "u2"]
console.log( config.groups.getMembers("g2") ); // ["u1", "u2", "u3"]
```

### `config.groups.addMembers()` method
This is a method that can be used in order to add one or more members to an existing group of the `groups` section of an instance of `ConfigGen`.

- ARGUMENTS: `groupname` and `members`

  - PARAMETER `groupname`: it is a string that contains the name of the group

  - PARAMETER `members`: it is an array of strings that contains all the members to add to the specified group

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.groups.add("group1", ["user1", "user2"]);

console.log( config.groups.get("group1")["members"] ); // ["user1", "user2"]

config.groups.addMembers("group1", ["user3", "user4"]);

console.log( config.groups.get("group1")["members"] ); // ["user1", "user2", "user3", "user4"]
```

### `config.groups.removeMembers()` method
This is a method that can be used in order to remove one or more members from an existing group of the `groups` section of an instance of `ConfigGen`.

- ARGUMENTS: `groupname` and `members`

  - PARAMETER `groupname`: it is a string that contains the name of the group

  - PARAMETER `members`: it is an array of strings that contains all the members to remove from the specified group

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.groups.add("group1", ["user1", "user2"]);

console.log( config.groups.get("group1")["members"] ); // ["user1", "user2"]

config.groups.removeMembers("group1", ["user1", "user2"]);

console.log( config.groups.get("group1")["members"] ); // []
```

### `config.shares.add()` method
This is a method that can be used in order to add a share to the `shares` section of an instance of `ConfigGen`.

- ARGUMENTS: `sharename`, `path`, `access`, `guest` (optional) and `softquota` (optional)

  - PARAMETER `sharename`: it is a string that contains the name of the new share

  - PARAMETER `path`: it is a string that contains the path of the new share

  - PARAMETER `access`: it is an array of strings that contains the list of access rules of the share

  - PARAMETER `guest`: it is a string equal to `"rw"`, `"ro"` or `"no"`. It represents the `guest` property of the share. In case it's equal to `"no"`, it means that the share doesn't have a `guest` property. If this parameter is missing, it is set to `"no"`.
  
  - PARAMETER `softquota`: it is an object that looks like this: `{ "limit": "150MB", "whitelist": ["admin"] }`. It represents the `soft-quota` property of the share. In case it's equal to `undefined`, it means that the share doesn't have a `soft-quota` property. If this parameter is missing, it is set to `undefined`. This parameter is optional, but in order to use it, you have to specify parameter `guest` as well.

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.shares.add("public", "/share/public", ["rw:user1", "ro:user2"]);
console.log( config.shares.get("public") ); // { "name": "public", "path": "/share/public", "access": ["rw:user1", "ro:user2"] }
console.log( config.shares.get("public")["guest"] ); // undefined

config.shares.add("anon", "/share/anon", [], "ro");
console.log( config.shares.get("anon") ); // { "name": "anon", "path": "/share/anon", "access": [], "guest": "ro" }
console.log( config.shares.get("anon")["guest"] ); // ro

config.shares.add("anon2", "/share/anon2", ["ro:*", "rw:admin"], "ro");
console.log( config.shares.get("anon2") ); // { "name": "anon2", "path": "/share/anon2", "access": ["ro:*", "rw:admin"], "guest": "ro" }
console.log( config.shares.get("anon2")["guest"] ); // ro

config.shares.add("folder", "/share/folder", ["admin"], "no");
console.log( config.shares.get("folder") ); // { "name": "folder", "path": "/share/folder", "access": ["admin"] }
console.log( config.shares.get("folder")["guest"] ); // undefined

config.shares.add("folder2", "/share/folder2", ["rw:*"], "no", { limit: "12kB", whitelist: [] });
```

### `config.shares.addArray()` method
This is a method that can be used in order to add one or more shares to the `shares` section of an instance of `ConfigGen`.

- ARGUMENTS: `input`

  - PARAMETER `input`: it is an array of Javascript objects; an element of this array looks like this: `{ "name": "public", "path": "/share/public", "access": ["rw:user1", "ro:user2"] }`

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.shares.addArray([
    { "name": "public", "path": "/share/public", "access": ["rw:user1", "ro:user2"] },
    { "name": "anon", "path": "/share/anon", "guest": "ro" },
    { "name": "anon2", "path": "/share/anon2", "access": ["ro:*", "rw:admin"], "guest": "ro" },
    { "name": "folder2", "path": "/share/folder2", "access": ["rw:*"], "soft-quota": { limit: "12kB", whitelist: [] } },
]);
// this is equivalent to writing:
config.shares.add("public", "/share/public", ["rw:user1", "ro:user2"], "no");
config.shares.add("anon", "/share/anon", [], "ro");
config.shares.add("anon2", "/share/anon2", ["ro:*", "rw:admin"], "ro");
config.shares.add("folder2", "/share/folder2", ["rw:*"], "no", { limit: "12kB", whitelist: [] });
```

### `config.shares.remove()` method
This is a method that can be used in order to remove one or more shares from the `shares` section of an instance of `ConfigGen`.

- ARGUMENTS: `sharename`

  - PARAMETER `sharename`: it is a string that contains the name of the share to remove, or it can also be an array of strings (in which every element is the name of a share to remove)

> NOTE: parameter `sharename` can be an array of strings only since version `1.5` of `ConfigGen.js` library.

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.shares.addArray([
    { "name": "public", "path": "/share/public", "access": ["rw:user1", "ro:user2"] },
    { "name": "user3", "path": "/share/user3", "access": ["rw:user3"] },
    { "name": "user4", "path": "/share/user4", "access": ["ro:user4"] }
]);

console.log( config.shares.get() ); // ["public", "user3", "user4"]

config.shares.remove("user3");

console.log( config.shares.get() ); // ["public", "user4"]

config.shares.remove(["public", "user4"]);

console.log( config.shares.get() ); // []
```

### `config.shares.get()` method
This is a method that can be used in order to retrieve the list of all shares from the `shares` section of an instance of `ConfigGen`, or it can be used in order to retrieve information about a specific share.

- ARGUMENTS: `sharename` (optional)

  - PARAMETER `sharename`: it is a string that contains the name of the share to retrieve information about

- OUTPUT: in case no parameters are passed, it returns an array with all the share names of the `shares` section; in case `sharename` parameter is passed, it returns a Javascript object like this: `{ "name": "public", "path": "/share/public", "access": ["rw:user1", "ro:user2"] }`

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.shares.addArray([
    { "name": "public", "path": "/share/public", "access": ["rw:user1", "ro:user2"] },
    { "name": "user3", "path": "/share/user3", "access": ["rw:user3"] }
]);

console.log( config.shares.get() ); // ["public", "user3"]

console.log( config.shares.get("public")["access"] ); // ["rw:user1", "ro:user2"]
```

### `config.shares.getAll()` method
This is a method that can be used in order to retrieve detailed information about all shares from the `shares` section of an instance of `ConfigGen`.

- ARGUMENTS: N/A

- OUTPUT: it returns an array of Javascript objects; every element of the array looks like this: `{ "name": "public", "path": "/share/public", "access": ["rw:user1", "ro:user2"] }`

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.shares.addArray([
    { "name": "public", "path": "/share/public", "access": ["rw:user1", "ro:user2"] },
    { "name": "user3", "path": "/share/user3", "access": ["rw:user3"] }
]);

console.log( config.shares.getAll() ); // [{ "name": "public", "path": "/share/public", "access": ["rw:user1", "ro:user2"] },{ "name": "user3", "path": "/share/user3", "access": ["rw:user3"] }]
```

### `config.shares.getAccess()` method
This is a method that can be used to retrieve the permissions of users and groups on a specified shared folder. This function parses all the access rules of the share, in order to get the final permissions.

> NOTE: this function ignores eventual "base rules" and "fixed rules" set with `config.shares.setBaseRules()` and `config.shares.setFixedRules()`, because these rules are applied when configuration is saved (for example, with `config.saveToFile()` function).

> NOTE: this function does NOT return `access` property of the shared folder (and thus its access rules), but it uses the access rules of the share to evaluate the final permissions of users and groups.

- ARGUMENTS: `share`

  - PARAMETER `share`: it is a string that contains the name of the existing shared folder to retrieve permissions of; or it can be a raw share object (i.e.: `{ "name": "folder1", "path": "/share/folder1", "access": ["u1", "ro:u2"] }`), this way this function can be used also with deleted or non-existent shared folders

- OUTPUT: it returns an object like this: `{ "u1": "rw", "u2": "r", "g1": "rw" }`, where every key represents a user or a group, and its value (that can be `"r"` or `"rw"`) is the actual permission

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.users.add("u1");
config.users.add("u2");
config.users.add("u3");

config.groups.add("g1", ["u1", "u2"]);
config.groups.add("g2", ["g1", "u3"]);

config.shares.add("s1", "/share/s1", ["ro:g2", "rw:g1"]);

console.log( config.shares.getAccess("s1") );
// OUTPUT: { "u1": "rw", "u2": "rw", "u3": "r", "g1": "rw", "g2": "r" }
// EXPLAIN:
//   "u1" and "u2" have read and write permissions,
//   "u3" has read-only permissions,
//   all members of "g1" have read and write permissions,
//   all members of "g2" have read permissions, but not all members have write permissions


// alternatively, you can pass as input also a raw share object:

config.on("share-remove", (previous) => {
    const access = config.shares.getAccess(previous);
    if (access["user1"] === "r" || access["user1"] === "rw"){
        console.log(`You deleted shared folder "${previous["name"]}". User "user1" used to have access to that folder.`);
    }
});
```

### `config.shares.setAccess()` method
This is a method that can be used to set the real permissions of users and groups on a specified shared folder. This function adds access rules to the share according to the final permission that users and groups must have on it.

> NOTE: this function ignores eventual "base rules" and "fixed rules" set with `config.shares.setBaseRules()` and `config.shares.setFixedRules()`, because these rules are applied when configuration is saved (for example, with `config.saveToFile()` function).

- ARGUMENTS: `sharename`, `subject` and `perm`

  - PARAMETER `sharename`: it is a string that contains the name of the existing shared folder to set permissions on
  
  - PARAMETER `subject`: it is a string that contains the name of the user or the group to set permissions of; if it is equal to `"*"`, it means "all users"; it can also be an array that contains multiple users and groups
  
  - PARAMETER `perm`: it is a string that specifies how permissions should be changed; it can be equal to:
  
    - `"+r"` (= add read permission, only in case it doesn't have it yet),
    
    - `"+w"` or `"+rw"` or `"rw"` (= add read and write permission),
    
    - `"ro"` (= add read-only permission),
    
    - `"-r"` or `"-rw"` (= remove read and write permission),
    
    - `"-w"` (= remove write permission, only in case it is present)

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.users.add("u1");
config.users.add("u2");
config.users.add("u3");

config.groups.add("g1", ["u1", "u2"]);
config.groups.add("g2", ["g1", "u3"]);

config.shares.add("s1", "/share/s1", ["ro:g2", "rw:g1"]);

// we can see that all members of group "g1" have read and write permissions
console.log( config.shares.getAccess("s1")["g1"] ); // rw

// if we add read permission to "g1", nothing changes, because all members already have read permission
config.shares.setAccess("s1", "g1", "+r");
console.log( config.shares.getAccess("s1")["g1"] ); // rw

// if we want to make sure that all members of "g1" have ONLY read permission, we do:
config.shares.setAccess("s1", "g1", "ro");
console.log( config.shares.getAccess("s1")["g1"] ); // r

// then we can give user "u1" also write permission
config.shares.setAccess("s1", "u1", "+w");
console.log( config.shares.getAccess("s1")["u1"] ); // rw
console.log( config.shares.getAccess("s1")["g1"] ); // r
```

### `config.shares.addRules()` method
This is a method that can be used in order to add one or more access rules to an existing share of the `shares` section of an instance of `ConfigGen`.

- ARGUMENTS: `sharename` and `rules`

  - PARAMETER `sharename`: it is a string that contains the name of the share

  - PARAMETER `rules`: it is an array of strings that contains all the access rules to add to the specified share

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.shares.add("public", "/share/public", ["rw:user1", "ro:user2"]);

console.log( config.shares.get("public")["access"] ); // ["rw:user1", "ro:user2"]

config.shares.addRules("public", ["rw:user3", "ro:user4"]);

console.log( config.shares.get("public")["access"] ); // ["rw:user1", "ro:user2", "rw:user3", "ro:user4"]
```

### `config.shares.addRuleAt()` method
This is a method that can be used in order to add one or more access rules to an existing share of the `shares` section of an instance of `ConfigGen`.

The access rule is inserted at the specified index.

- ARGUMENTS: `sharename`, `rule` and `ruleIndex`

  - PARAMETER `sharename`: it is a string that contains the name of the share

  - PARAMETER `rule`: it is a string that contains the access rule to add; it can also be an array of strings (that contains all the access rules to add)

  - PARAMETER `ruleIndex`: it is the index where the access rule(s) will be inserted

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.shares.add("public", "/share/public", ["rw:user1", "ro:user2", "rw:user3"]);
console.log( config.shares.get("public")["access"] ); // ["rw:user1", "ro:user2", "rw:user3"]

config.shares.addRuleAt("public", "ro:*", 0);
console.log( config.shares.get("public")["access"] ); // ["ro:*", "rw:user1", "ro:user2", "rw:user3"]

config.shares.addRuleAt("public", ["a", "b"], 1);
console.log( config.shares.get("public")["access"] ); // ["ro:*", "a", "b", "rw:user1", "ro:user2", "rw:user3"]
```

### `config.shares.removeRuleAt()` method
This is a method that can be used in order to remove one or more access rules from an existing share of the `shares` section of an instance of `ConfigGen`.

The access rule to remove is specified using its index.

- ARGUMENTS: `sharename` and `ruleIndex`

  - PARAMETER `sharename`: it is a string that contains the name of the share

  - PARAMETER `ruleIndex`: it is the index of the access rule to remove; it can also be an array of integers (that contains all the indices to remove)

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.shares.add("public", "/share/public", ["rw:user1", "ro:user2", "rw:user3"]);
console.log( config.shares.get("public")["access"] ); // ["rw:user1", "ro:user2", "rw:user3"]

config.shares.removeRuleAt("public", 1);
console.log( config.shares.get("public")["access"] ); // ["rw:user1", "rw:user3"]

config.shares.removeRuleAt("public", [0, 1]);
console.log( config.shares.get("public")["access"] ); // []
```

### `config.shares.removeAllRules()` method
This is a method that can be used in order to remove one or more access rules from an existing share of the `shares` section of an instance of `ConfigGen`.

This function will remove all the occurrencies of the specified access rules.

- ARGUMENTS: `sharename` and `rules` (optional)

  - PARAMETER `sharename`: it is a string that contains the name of the share

  - PARAMETER `rules`: it is an array of strings that contains all the access rules to remove from the specified share; if this parameter is missing, all the access rules of the share will be removed

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.shares.add("folder1", "/share/folder1", ["rw:user1", "ro:user2", "rw:user1"]);

console.log( config.shares.get("folder1")["access"] ); // ["rw:user1", "ro:user2", "rw:user1"]

config.shares.removeAllRules("folder1", ["rw:user1"]);

console.log( config.shares.get("folder1")["access"] ); // ["ro:user2"]

config.shares.removeAllRules("folder1");

console.log( config.shares.get("folder1")["access"] ); // []
```

### `config.shares.setPath()` method
This is a method that can be used in order to change the path of an existing share of the `shares` section of an instance of `ConfigGen`.

- ARGUMENTS: `sharename` and `path`

  - PARAMETER `sharename`: it is a string that contains the name of the share

  - PARAMETER `path`: it is a string that contains the new path of the specified share

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.shares.add("folder1", "/share/folder1", ["rw:*"]);

console.log( config.shares.get("folder1")["path"] ); // /share/folder1

config.shares.setPath("folder1", "/share/new-path");

console.log( config.shares.get("folder1")["path"] ); // /share/new-path
```

### `config.shares.setGuest()` method
This method can be used in order to change/remove the `guest` property of an existing share of the `shares` section of an instance of `ConfigGen`.

- ARGUMENTS: `sharename` and `guest`

  - PARAMETER `sharename`: it is a string that contains the name of the share

  - PARAMETER `guest`: it is a string equal to `"rw"`, `"ro"` or `"no"`; in case it's equal to `"no"`, `guest` property of the specified shared folder is removed

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.shares.add("folder1", "/share/folder1", [], "rw");
console.log( config.shares.get("folder1") ); // { "name": "folder1", "path": "/share/folder1", "access": [], "guest": "rw" }

config.shares.setGuest("folder1", "ro");
console.log( config.shares.get("folder1") ); // { "name": "folder1", "path": "/share/folder1", "access": [], "guest": "ro" }

config.shares.setGuest("folder1", "no");
console.log( config.shares.get("folder1") ); // { "name": "folder1", "path": "/share/folder1", "access": [] }
console.log( config.shares.get("folder1")["guest"] ); // undefined
```

### `config.shares.setFixedRules()` method
This method can be used to set specific access rules to be always added at the end of the specified shares. This will ensure that these shares will always have some fixed permissions on them.

Fixed rules are a global setting; therefore, every time you call `config.shares.setFixedRules()` function, you are overwriting global fixed rules settings.

Fixed rules are applied when you generate the final configuration file (using, for example, `config.saveToObject()`, `config.saveToJson()`, `config.saveToFile()`, etc.).

You can use `config.shares.setBaseRules()` and `config.shares.setFixedRules()` together, as they don't conflict with each other.

- ARGUMENTS: `shares` (optional) and `rules`

  - PARAMETER `shares`: it's an array which contains the name of the shares that the specified fixed rules apply to; if this parameter is missing, it means "all the shared folders"

  - PARAMETER `rules`: it's an array which contains the access rules that the specified shares will always have

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

// let's create a new share "folder1" and set its rules to ["rw:user1"]
config.shares.add("folder1", "/share/folder1", ["rw:user1"]);
console.log( config.saveToObject()["shares"] ); // [ { "name": "folder1", "path": "/share/folder1", "access": ["rw:user1"] } ]

// we want that share "folder1" will always be readable and writable by user "admin"
config.shares.setFixedRules(["folder1"], ["rw:admin"]);

// now let's add access rule "no:admin" to "folder1"
config.shares.addRules("folder1", ["no:admin"]);

// user "admin" will still be able to read and write
console.log( config.saveToObject()["shares"] ); // [ { "name": "folder1", "path": "/share/folder1", "access": ["rw:user1", "no:admin", "rw:admin"] } ]

// now let's modify fixed rules, applying them to all shares (this is done by not passing a "shares" parameter)
config.shares.setFixedRules(["rw:admin"]);

// let's create a new share "folder2"
config.shares.add("folder2", "/share/folder2", ["ro:user2"]);

// new share "folder2" is readable and writable by user "admin"
console.log( config.saveToObject()["shares"] ); // [ { "name": "folder1", "path": "/share/folder1", "access": ["rw:user1", "no:admin", "rw:admin"] }, { "name": "folder2", "path": "/share/folder2", "access": ["ro:user2", "rw:admin"] } ]

// if we want to disable fixed rules completely, we use:
config.shares.setFixedRules(undefined);

// next time we generate a configuration file, fixed rules aren't going to be applied anymore
console.log( config.saveToObject()["shares"] ); // [ { "name": "folder1", "path": "/share/folder1", "access": ["rw:user1", "no:admin"] }, { "name": "folder2", "path": "/share/folder2", "access": ["ro:user2"] } ]
```

### `config.shares.setBaseRules()` method
This method can be used to set specific access rules to be always added at the beginning of the specified shares. This is useful in case you want some (or all) shares to always start with some specific permissions. Note that these "base rules" are not immutable (like "fixed rules" are); they're just some basic rules that apply to some shares, and they can be overwritten.

Base rules are a global setting; therefore, every time you call `config.shares.setBaseRules()` function, you are overwriting global base rules settings.

Base rules are applied when you generate the final configuration file (using, for example, `config.saveToObject()`, `config.saveToJson()`, `config.saveToFile()`, etc.).

You can use `config.shares.setBaseRules()` and `config.shares.setFixedRules()` together, as they don't conflict with each other.

- ARGUMENTS: `shares` (optional) and `rules`

  - PARAMETER `shares`: it's an array which contains the name of the shares that the specified fixed rules apply to; if this parameter is missing, it means "all the shared folders"

  - PARAMETER `rules`: it's an array which contains the access rules that the specified shares will always have at the beginning

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

// let's create a new share "folder1" and set its rules to ["rw:user1"]
config.shares.add("folder1", "/share/folder1", ["rw:user1"]);
console.log( config.saveToObject()["shares"] ); // [ { "name": "folder1", "path": "/share/folder1", "access": ["rw:user1"] } ]

// we want that all shares must be readable by everyone in the beginning
config.shares.setBaseRules(["ro:*"]);

// this is the final configuration:
console.log( config.saveToObject()["shares"] ); // [ { "name": "folder1", "path": "/share/folder1", "access": ["ro:*", "rw:user1"] } ]

// if we want to disable base rules completely, we use:
config.shares.setBaseRules(undefined);

// next time we generate a configuration file, base rules aren't going to be applied anymore
console.log( config.saveToObject()["shares"] ); // [ { "name": "folder1", "path": "/share/folder1", "access": ["rw:user1"] } ]
```

### `config.shares.setSoftQuota()` method
This method can be used in order to change/remove the `soft-quota` property of an existing share of the `shares` section of an instance of `ConfigGen`.

- ARGUMENTS: `sharename` and `softquota`

  - PARAMETER `sharename`: it is a string that contains the name of the share

  - PARAMETER `softquota`: it is an object that looks like `{ limit: "150MB", whitelist: ["admin"] }`; in case it's equal to `undefined`, `soft-quota` property of the specified shared folder is removed

EXAMPLE:
```js
const ConfigGen = require("./ConfigGen.js");

const config = new ConfigGen();

config.shares.add("folder1", "/share/folder1", [], "no", { "limit": "12kB", "whitelist": [] });
console.log( config.shares.get("folder1") ); // { "name": "folder1", "path": "/share/folder1", "access": [], "soft-quota": { "limit": "12kB", "whitelist": [] } }

config.shares.setSoftQuota("folder1", { "limit": "12kB", "whitelist": ["admin"] });
console.log( config.shares.get("folder1") ); // { "name": "folder1", "path": "/share/folder1", "access": [], "soft-quota": { "limit": "12kB", "whitelist": ["admin"] } }

config.shares.setSoftQuota("folder1", undefined);
console.log( config.shares.get("folder1") ); // { "name": "folder1", "path": "/share/folder1", "access": [] }
console.log( config.shares.get("folder1")["soft-quota"] ); // undefined
```

## advanced use
This chapter will give you a couple of advices to better manage and use `easy-samba`. This chapter is divided into these sections:

- [`writing a systemd unit`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#writing-a-systemd-unit)

- [`automatizing easy-samba updates`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#automatizing-easy-samba-updates)

### writing a systemd unit
It is important to register `easy-samba` as a service in your Linux system. This way, you'll be able to better control
the status of the SAMBA server, and you will be able to start `easy-samba` automatically on boot. Let's begin:

1) Create a folder in your system where all our `easy-samba` scripts will be saved.
    ```sh
    mkdir /easy-samba
    ```

2) Our first script will be `start.sh`, whose purpose is to start `easy-samba`. Create the script with `nano /easy-samba/start.sh` and copy this content into it:
    ```sh
    #!/bin/bash
    docker stop samba
    docker container rm samba
    docker run --network host -v /easy-samba/share:/share --name samba adevur/easy-samba:latest
    ```

    > NOTE: all parameters of `docker run` can be customized. Just take care of two things: parameters `-d` and `--restart always` must not be included in `docker run` command, since they would break our `systemd` service functionality.

3) With `nano /easy-samba/stop.sh` let's instead create the script for stopping `easy-samba`:
    ```sh
    #!/bin/bash
    docker stop samba
    docker container rm samba
    ```

4) Now, let's write our `systemd` service unit with `nano /etc/systemd/system/easy-samba.service`:
    ```
    [Unit]
    Description=easy-samba
    After=docker.service

    [Service]
    Type=simple
    ExecStart=/easy-samba/start.sh
    ExecStop=/easy-samba/stop.sh
    Restart=always

    [Install]
    WantedBy=multi-user.target
    ```
    
    > NOTE: you can remove line `Restart=always` if you don't want `systemd` to automatically restart `easy-samba` in case of crash.

5) Now, run:
    ```sh
    chmod 664 /etc/systemd/system/easy-samba.service
    systemctl daemon-reload
    ```

6) Okay, now our `systemd` service unit is ready. We can start the SAMBA server with:
    ```sh
    systemctl start easy-samba.service
    ```

7) If you want `easy-samba` to start automatically on boot, run:
    ```sh
    systemctl enable easy-samba.service
    ```

### automatizing easy-samba updates
In order to automatize `easy-samba`'s updates, you can write a simple script that does this:

1) Stop `easy-samba` and remove its docker image.

2) Download up-to-date image of `easy-samba` from DockerHub.

3) Start `easy-samba`.

You can create the script with `nano /easy-samba/update.sh`:

```sh
#!/bin/bash

# stop easy-samba service
systemctl stop easy-samba.service

# remove easy-samba docker image
docker image rm adevur/easy-samba:latest

# download new up-to-date image from DockerHub
docker pull adevur/easy-samba:latest

# start easy-samba
systemctl start easy-samba.service
```

Every time you want to update `easy-samba`, you just need to execute `/easy-samba/update.sh` script.

## understanding logs
> NOTE: at the moment, this section of Documentation is not up to date with latest changes to `easy-samba`.

`easy-samba` uses logs in order to inform the user about the status of the SAMBA server. In case of errors, logs will
give you detailed informations about what's going on.

### how to get logs
In order to retrieve logs of `easy-samba`, you can use this command:
```sh
docker logs samba
```

> Where `samba` is the container's name or ID.

> NOTE: in case of errors, the container will stop. If you used the parameter `--rm` in the `docker run` command (when
you first [started the container](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#docker-options)), docker will remove the container after it stops, so you won't be able to retrieve logs about the error. In order to keep the container saved even after it stops, don't use parameter `--rm` in `docker run` command. This way, you will be able to use `docker logs samba` in case an error occurred and the container stopped.

### list of logs
This is the list of possible logs, when no error occurs:

- `[LOG] you're using easy-samba version '...' from '...' branch.`: this log informs the user about the current `easy-samba`
version. E.g.: `[LOG] you're using easy-samba version '1.0.0' from 'stable' branch.`.

- `[LOG] SAMBA server configuration process has started.`: this log informs the user that `easy-samba` has started.

- `[LOG] '/share/config.json' has been correctly loaded.`: this log informs the user that configuration file
`/share/config.json` has been successfully read and parsed.

- `[LOG] '/share/config.json' syntax is correct.`: this log informs the user that the configuration file doesn't
contain syntax errors or content errors (e.g. usernames are correct, shared folders' paths are valid, ...).

- `[LOG] permissions of '/share' have been correctly reset.`: this log informs the user that filesystem permissions
and ACLs of `/share` have been cleared successfully.

- `[LOG] permissions of '/share' have been correctly set.`: this log informs the user that filesystem permissions
and ACLs of `/share` have been successfully set, so that `/share` and all its children can only be accessed by
`root`.

- `[LOG] users have been correctly created.`: this log informs the user that all the users that you configured in
[`users` section of `config.json`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#users-section) have been correctly added to container's OS and to container's SAMBA server.

- `[LOG] shares have been correctly created.`: this log informs the user that all the shared folders that you
configured in [`shares` section of `config.json`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#shares-section) have been correctly created (in case they didn't exist), and all
the filesystem permissions and ACLs have been correctly set to them.

- `[LOG] '/etc/samba/smb.conf' has been correctly generated and written.`: this log informs the user that the SAMBA
server's configuration file `/etc/samba/smb.conf` has been successfully generated and written to disk.

- `[LOG] starting 'nmbd'...`: this log informs the user that `/usr/sbin/nmbd` process is about to being started.
This process is necessary for the SAMBA server to function properly.

- `[LOG] starting 'smbd'...`: this log informs the user that `/usr/sbin/smbd` process is about to being started.
This process is necessary for the SAMBA server to function properly.

- `[LOG] SAMBA server is now ready.`: this log informs the user that `easy-samba` completed its configuration without
errors, so you can now [connect to the container using a SAMBA client](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#networking).

- `[LOG] generating '/share/config.json' using script '/share/config.gen.js'...`: this log informs the user that `/share/config.json` configuration file is missing, but `/share/config.gen.js` script has been found, so the latter will be used to generate the missing `config.json` file. This log has been added in `easy-samba` version `1.3.0`.

### list of errors
This is the list of possible logs, when an error occurs:

- `[WARNING] it's not been possible to display version information.`: it is not a real error, just a warning that `easy-samba` could not retrieve version information. This happens when file
`/startup/version.txt` doesn't exist or it's not well-formatted. You should ignore this error since it's not caused by you.
Moreover, you should open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

- `[ERROR] script has failed for unknown reasons.`: this is a generic error that occurs when `easy-samba` configuration
process throws an error that it doesn't recognize. This error is usually followed by message `[DEBUG] DETAILS ABOUT THE ERROR: ...`,
which gives you mostly debug information. If this error occurs, you should open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

- `[ERROR] '/share/config.json' could not be loaded or it is not in JSON format.`: this error occurs when the configuration
file `/share/config.json` doesn't exist or it is not a valid JSON file.

- `[ERROR] '/share/config.json' syntax is not correct: ...`: this error occurs when `config.json` contains syntax or
content errors (e.g. `guest` section is missing, one of the usernames is not a valid username, ...). This log also
gives you detailed information about what is the error that's been found.
See also [`config.json` section of this `Documentation`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#configjson)
in order to better understand the reported error.

- `[ERROR] permissions of '/share' could not be reset.`: this error occurs mostly if the underlying OS or the underlying
filesystem that you're using on your computer don't support POSIX ACLs.

- `[ERROR] permissions of '/share' could not be set.`: this error occurs mostly if the underlying OS or the underlying
filesystem that you're using on your computer don't support POSIX ACLs.

- `[ERROR] users could not be created: ...`: this error occurs if `easy-samba` has not been able to add the users
(that you specified in [`users` section of `config.json`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#users-section))
in the container's OS and in the SAMBA server.
If you get this error, you should probably open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

- `[ERROR] shares could not be created: ...`: this error occurs if `easy-samba` has not been able to create
the shared folders (that you specified in the [`shares` section of `config.json`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#shares-section)).
If you get this error, you should probably open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

- `[ERROR] '/etc/samba/smb.conf' could not be generated or written.`: this error occurs mostly if `easy-samba` has
not been able to write file `/etc/samba/smb.conf` inside the container.
If you get this error, you should probably open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

- `[ERROR] 'nmbd' could not be started.`: this error occurs if `easy-samba` has not been able to start process
`/usr/sbin/nmbd` inside the container.
If you get this error, you should probably open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

- `[ERROR] 'smbd' could not be started.`: this error occurs if `easy-samba` has not been able to start process
`/usr/sbin/smbd` inside the container.
If you get this error, you should probably open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

- `[ERROR] it's not been possible to clean up existing users.`: this error occurs if `easy-samba` has not been able to clean up existing users during startup phase. This error has been added in version `1.2.0` of `easy-samba`.
If you get this error, you should probably open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

## how easy-samba works
> NOTE: at the moment, this section of Documentation is not up to date with latest changes to `easy-samba`.

This chapter describes in detail what `easy-samba` does inside its container in order to setup the SAMBA server. This chapter is divided into these sections:

- [general structure of `easy-samba`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#general-structure-of-easy-samba)

- [main script `/startup/index.js`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#main-script-startupindexjs)

### general structure of `easy-samba`
As you can see from the [`Dockerfile`](https://github.com/adevur/docker-easy-samba/blob/master/stable/latest/Dockerfile), `easy-samba` docker image:

1) downloads [CentOS 7 image `centos:7` from docker](https://hub.docker.com/_/centos),

2) installs [Node.js 10.x.x LTS](https://nodejs.org) inside the container (using the procedure described at [NodeSource Node.js Binary Distributions](https://github.com/nodesource/distributions#rpm)),

3) installs the SAMBA server (packages `samba`, `samba-common` and `samba-client`) inside the container,

4) copies [`startup` folder](https://github.com/adevur/docker-easy-samba/blob/master/stable/latest/startup) inside the container,

5) and finally starts [`easy-samba` main script `/startup/index.js`](https://github.com/adevur/docker-easy-samba/blob/master/stable/latest/startup/index.js).

### main script `/startup/index.js`
`/startup/index.js` (which you can see [on GitHub](https://github.com/adevur/docker-easy-samba/blob/master/stable/latest/startup/index.js)) is a
Node.js script, written in Javascript, whose main purpose is to configure and start the SAMBA server.
Here's what it does:

- The script looks for the configuration file `/share/config.json`, reads it and parses it (from JSON to Javascript object).

- The script checks if `config.json` contains syntax errors, or any other error (e.g. you defined two users with the same username).

    This phase is very important, since the rest of this script will just assume that every single parameter of `config.json` is valid and has no conflicts with other parameters (because the configuration file has already been validated during this phase).

    Also, during this phase, `easy-samba` will evaluate the access rules defined in the `shares` property (see also [`shares` property of `config.json` in this Doumentation](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.V1.md#shares-section) in order to understand how access rules get evaluated).

- The script will clear all filesystem permissions of `/share` using these commands:
    ```sh
    setfacl -R -bn /share
    chmod -R a+rX /share
    ```

    This phase is needed because `easy-samba` has to set its own permissions on `/share` (accordingly to `config.json`), so no other custom permission must be present on `/share`.

- The script will set the initial permissions of `/share`. In this phase, `/share` is set so that only `root` has access to it and its children. These commands are used:
    ```sh
    chown -R root:root /share
    setfacl -R -m 'u::rwx,g::rwx,o::x' /share
    setfacl -R -dm 'u::rwx,g::rwx,o::x' /share
    ```

- The script reads `users` property of `config.json` and adds every user into the container's OS and in the SAMBA server.
The script uses these commands (in this example, there's only a user with name `user1` and password `123456`):
    ```sh
    useradd -M -s /sbin/nologin user1
    echo '123456' | passwd user1 --stdin
    (echo '123456'; echo '123456') | smbpasswd -a user1 -s
    ```

- The script reads `shares` property of `config.json` and, for each defined shared folder, it creates the directory (if it doesn't exist) and
sets its permission accordingly to the access rules that have been evaluated during phase 2.

- The script writes a `/etc/samba/smb.conf` file, accordingly to the configuration parameters of `config.json`.
Documentation about `/etc/samba/smb.conf` can be found [here](https://www.samba.org/samba/docs/current/man-html/smb.conf.5.html).

- The script starts the SAMBA server with these commands:
    ```sh
    /usr/sbin/nmbd --foreground --no-process-group
    /usr/sbin/smbd --foreground --no-process-group
    ```

- The script will now keep running until either `nmbd` or `smbd` stop.







