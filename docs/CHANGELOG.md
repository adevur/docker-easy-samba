
# easy-samba changelog
Version history and changelogs of `adevur/easy-samba` docker image.

### Current stable release: `1.11.1`

### Current long-term release: `no long-term release yet`

## version history

### [STABLE] 1.11.1 (2019-07-03 UTC)
- New features:

  - N/A

- Bug fixes:

  - Fixed typo in `easy-samba`'s versioning.

  - Now, `EasySamba Remote API` is more reliable: in case of crash, it will re-start itself in 10 seconds.

  - `easy-samba`'s logs now will tell you if `EasySamba Remote API` has started successfully or not.

  - `easy-samba` now correctly starts `EasySamba Remote API` only in case both `/share/config.json` and `/share/config.gen.js` files are missing.

  - Now, `easy-samba`'s Dockerfile exposes default `Remote API` TCP port `9595`; this way, you can correctly open it in case you run `easy-samba`'s container with parameter `--network bridge`.

- Security fixes:

  - N/A

### [STABLE] [FEATURE] 1.11.0 (2019-07-02 UTC)
- New features:

  - Implemented `EasySamba Remote API`: it is an HTTPS-based API, that uses JSON-RPC protocol, and that can be used in order to read or to change the configuration of an `easy-samba` container through network.

  - Implemented new functions in `ConfigGen.js` library: `ConfigGen.fromRemote()` and `config.saveToRemote()`. These functions can be used to connect to a remote `easy-samba` container using `EasySamba Remote API`.

- Bug fixes:

  - N/A

- Security fixes:

  - N/A

### [STABLE] [FEATURE] 1.10.0 (2019-06-25 UTC)
- New features:

  - Now `easy-samba` has retro-compatibility for `config.json` files written before version `1.5`. `config.gen.js` files written before version `1.5` are still not supported anymore.

  - In `ConfigGen.js` library, functions `ConfigGen.fromFile()`, `ConfigGen.fromObject()` and `ConfigGen.fromJson()` can import configurations older than version `1.5`.

  - Implemented new function in `ConfigGen.js` library: `ConfigGen.fromFile()`.

  - In `ConfigGen.js` library, function `ConfigGen.genRandomPassword()` is now much more performant.

  - In `ConfigGen.js` library, function `config.shares.unsetFixedRules()` is now deprecated. Use `config.shares.setFixedRules([])`, instead.

- Bug fixes:

  - Fixed bug in case `config.json` file is not a valid JSON file.

  - Fixed bug in case `config.json` file doesn't contain `guest` section.

  - Other minor bugfixes.

- Security fixes:

  - N/A

### [STABLE] [FEATURE] 1.9.0 (2019-06-14 UTC)
- New features:

  - Support for `guest` section of `config.json` has been removed both from `easy-samba` and from `ConfigGen.js` library. This section can still be used for retro-compatibility purposes, but a deprecation warning will be displayed.

  - Implemented new function in `ConfigGen.js` library: `config.saveToObject()`.

  - These functions in `ConfigGen.js` have extended their functionalities (without breaking compatibility): `config.on()`, `config.shares.removeRuleAt()`, `config.shares.addRuleAt()`, `config.users.add()`, `config.users.addArray()`, `config.version()` and `config.global()`.

  - These functions of `ConfigGen.js` are now deprecated: `config.guest()`, `config.unsetGuest()`, `config.unsetVersion()` and `config.unsetGlobal()`.

- Bug fixes:

  - Minor bugfixes.

- Security fixes:

  - N/A

### [STABLE] [FEATURE] 1.8.0 (2019-06-11 UTC)
- New features:

  - If an `easy-samba` container is already started, and you modify (or remove) `config.json` file (located inside the container), `easy-samba` will now auto-update its configuration according to the new `config.json` file. This way, you don't have to manually restart the `easy-samba` container if you update its configuration file. If you remove `config.json` file, `easy-samba` will try to generate a new one using `config.gen.js` script.

  - If processes `smbd` or `nmbd` crash inside a running `easy-samba` container, `easy-samba` will re-try automatically to restart itself (and the crashed processes too). This way, a simple crash of `smbd` or `nmbd` will not cause `easy-samba` to completely stop working.

  - Now, your `config.gen.js` script isn't obliged anymore to terminate, after it has written the `config.json` file. Instead, it can keep running in the background, and eventually modify the `config.json` file multiple times during its run-time. When your `config.gen.js` script modifies `config.json` file, `easy-samba` will automatically update according to the new configuration. If your `config.gen.js` script crashes, `easy-samba` will run it again only in case `config.json` file is missing.

  - Users connected to the SAMBA server will not get disconnected (even if they're performing operations like file writing/reading) when `easy-samba` updates its configuration. This way, you can modify `config.json` file without interrupting users' current work.

- Bug fixes:

  - Minor bugfixes.

- Security fixes:

  - N/A

### [STABLE] [FEATURE] 1.7.0 (2019-06-10 UTC)
- New features:

  - In `config.json`, now it is possible to specify if a shared folder has guest access, replacing property `access` with `guest`. New property `guest` can be equal to `"rw"` (in case guest users have read and write permissions) or equal to `"ro"` (in case guest users have read-only permissions). If a shared folder has `guest` property, `access` property is ignored. NOTE: you can still use `guest` section of `config.json` to create an anonymous shared folder, but it is a much less versatile method, compared to new `guest` property of shared folders.

  - The following functions have been added to `ConfigGen.js` library: `config.shares.setGuest()`, `ConfigGen.genRandomPassword()` and `config.shares.addRuleAt()`.

  - New event handler has been added to `ConfigGen.js` library: `share-change-guest`.

- Bug fixes:

  - Some code cleanup and minor bugfixes.

- Security fixes:

  - N/A

### [STABLE] 1.6.1 (2019-06-07 UTC)
- New features:

  - N/A

- Bug fixes:

  - Fixed a major bug in function `config.shares.setFixedRules()` of `ConfigGen.js` library.

- Security fixes:

  - N/A

### [STABLE] [FEATURE] 1.6.0 (2019-06-03 UTC)
- New features:

  - The following functions have been added to `ConfigGen.js` library: `config.on()`, `config.shares.setFixedRules()` and `config.shares.unsetFixedRules()`.

  - In `ConfigGen.js` library, it is now possible to use events in order to handle changes to the configuration object. Events are handled with function `config.on()`. The following is the list of supported events: `user-add`, `user-remove`, `user-change`, `user-change-password`, `group-add`, `group-remove`, `group-change`, `group-change-members`, `share-add`, `share-remove`, `share-change`, `share-change-access` and `share-change-path`.

- Bug fixes:

  - Some code cleanup and minor bugfixes.

- Security fixes:

  - N/A

### [STABLE] [FEATURE] 1.5.0 (2019-06-02 UTC)
- New features:

  - The following deprecated functions have been removed from `ConfigGen.js` library: `config.groups.addUser()`, `config.groups.addUsers()`, `config.groups.removeUser()` and `config.groups.removeUsers()`. This breaks compatibility with older `config.gen.js` files.

  - The following functions have been removed from `ConfigGen.js` library for code-cleaning purposes: `config.groups.addMember()`, `config.groups.removeMember()`, `config.shares.addRule()` and `config.shares.removeRule()`. This breaks compatibility with older `config.gen.js` files.

  - In `ConfigGen.js` library, the following functions have extended their functionalities, without breaking compatibility with older `config.gen.js` files: `config.users.remove()`, `config.groups.remove()` and `config.shares.remove()`.

  - The following functions have been added to `ConfigGen.js` library: `config.unsetVersion()`, `config.unsetGuest()` and `config.unsetGlobal()`.

  - In `config.json`, in `groups` section, `users` property of a group is not supported anymore. Use `members` instead of `users`. This breaks compatibility with older `config.json` and `config.gen.js` files.

  - Because of several breaking changes in the codebase of `easy-samba`, version `1.5.0` is not compatible with `config.json` files and `config.gen.js` files older than `1.5`. Note: you can still omit `version` property in a `config.json` file, because `easy-samba` will assume that the `config.json` file is compatible with the current `easy-samba` version.

- Bug fixes:

  - Some code cleanup.

- Security fixes:

  - N/A

### [STABLE] [FEATURE] 1.4.0 (2019-05-31 UTC)
- New features:

  - `guest` section of `config.json` is now optional. If this section is missing, its value is set to `false`.

  - In `groups` section of `config.json`, `users` property of a group has been renamed to `members`. For example, `"groups": [{ "name": "group1", "users": ["user1", "user2"] }]` is now `"groups": [{ "name": "group1", "members": ["user1", "user2"] }]`. Old name `users` can still be used for retro-compatibility purposes, but it will be dropped in a future version of `easy-samba`.

  - `ConfigGen.js` library now has two more methods: `config.shares.removeAllRules()` and `config.shares.removeRuleAt()`.

  - In `ConfigGen.js` library, methods `config.groups.addUser()`, `config.groups.addUsers()`, `config.groups.removeUser()` and `config.groups.removeUsers()` have been renamed to `config.groups.addMember()`, `config.groups.addMembers()`, `config.groups.removeMember()` and `config.groups.removeMembers()`. Old names of these functions will still be kept for retro-compatibility purposes, but they will be removed in a future version of `easy-samba`.

- Bug fixes:

  - Some code cleanup.

- Security fixes:

  - N/A

### [STABLE] [FEATURE] 1.3.0 (2019-05-30 UTC)
- New features:

  - A new alternative way of writing configuration files has been added to `easy-samba`: `config.gen.js`. This is a Javascript script that you can write instead of `config.json`, in order to dynamically write configuration files, as an alternative to writing manually a `config.json` yourself. `config.gen.js` uses a stand-alone Javascript library called `ConfigGen.js`, that is already located inside `easy-samba` containers, and is ready to use. For more info, take a look at the [`Documentation`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md).

  - In the `groups` section of `config.json`, it is now possible to also specify groups to be included in a group (e.g. `{ "name": "group2", "users": ["group1", "user4"] }` means that `group2` contains all the users in `group1` plus `user4`).

- Bug fixes:

  - N/A

- Security fixes:

  - N/A

### [STABLE] [FEATURE] 1.2.0 (2019-05-16 UTC)
- New features:

  - A new optional property has been added to `config.json`: `global` property. It is an array of strings that one can use
  to specify custom lines to be added into `[global]` section of `/etc/samba/smb.conf`. For example, if you add `"global": ["a", "b"]`
  to your `config.json`, `/etc/samba/smb.conf` will look like this:
    ```
    [global]
    ...
    a
    b
    ```

  - Now you can stop and restart an `easy-samba` container multiple times, without the need to remove it first.

- Bug fixes:

  - Several code clean up and optimizations.

- Security fixes:

  - N/A

### [STABLE] [FEATURE] 1.1.0 (2019-04-27 UTC)
- New features:

  - In `access` property of shared folders defined in `config.json`, now it is possible to use `*` to indicate "all users
  defined in `users` section of `config.json`" for an access rule. For example, if `access` property is equal to `["ro:*"]`,
  it means that all users have read-only permissions on the shared folder.

  - In `access` property of shared folders defined in `config.json`, now it is available a new type of permission, `no:`,
  together with `rw:` and `ro:`. This new permission just means "no access at all". For example, if `access` property is
  equal to `["rw:group1", "no:user1"]`, it means that all members of group `group1` have read and write permissions on the
  shared folder, but `user1` has no access at all.

- Bug fixes:

  - Users added into the container's OS now cannot login into it (i.e. their shell is set to `/sbin/nologin`).

  - Improvements to validation of `version` property of `config.json`.

- Security fixes:

  - N/A

### [STABLE] 1.0.4 (2019-04-24 UTC)
- New features:

  - N/A

- Bug fixes:

  - Implemented validation of `groups` property of `config.json`.

  - Improvements to validation of `users` property of `config.json`.

- Security fixes:

  - N/A

### [STABLE] 1.0.3 (2019-04-21 UTC)
- New features:

  - N/A

- Bug fixes:

  - Now, shared folders' path validation algorithm is less restrictive. Before this fix, a shared folder's path could only
  contain alphanumeric ASCII characters; now, almost any Unicode character can be used.
  Take a look at the [`config.json` section of `Documentation`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#configjson) for more info about path validation.

  - Anonymous shared folder now works properly. There was a bug in the generation of `/etc/samba/smb.conf` that
  prevented guest login.

  - Other improvements to `/etc/samba/smb.conf` generation algorithm.

- Security fixes:

  - N/A

### [STABLE] [SECURITY] 1.0.2 (2019-04-18 UTC)
- New features:

  - N/A

- Bug fixes:

  - Now `easy-samba` checks that users' passwords (stored in `config.json`) are
  valid Linux passwords. Validation algorithm will be soon described in the
  [`Documentation`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md).

  - Forward-compatibility for future versions of `easy-samba` is now more consistent.
  This forward-compatibility is ensured by `version` property of `config.json`.
  This property will be better documented in the [`Documentation`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md)
  when `easy-samba` version `1.1.0` will be released.

- Security fixes:

  - Now `easy-samba` checks that users' passwords (stored in `config.json`) are
  valid Linux passwords. Before this fix, someone could enter whatever string in
  the `password` field of a user. Since passwords are passed to `passwd`'s stdin,
  this was a security vulnerability.

### [STABLE] 1.0.1 (2019-04-15 UTC)
- New features:

  - N/A

- Bug fixes:

  - Added forward-compatibility for future versions of `easy-samba`.
  Now `easy-samba`'s logs will tell you if a `config.json` file is not compatible with the
  version of `easy-samba` that you are currently using.
  For example: `[ERROR] '/share/config.json' syntax is not correct: THIS CONFIGURATION FILE USES
  FEATURES THAT REQUIRE EASY-SAMBA VERSION '1.1' OR NEWER.`

- Security fixes:

  - N/A

### [STABLE] 1.0.0 (2019-04-14 UTC)
Initial release.

