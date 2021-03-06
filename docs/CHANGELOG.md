
# easy-samba changelog
Version history and changelogs of `adevur/easy-samba` docker image.

### Current unstable release: `2.4.0`

### Current stable release: `1.19.1`

### Current long-term release: `no long-term release yet`

## version history

### [UNSTABLE] [FEATURE] 2.4.0 (2019-11-05 UTC)
- New features:

  - `Remote API` now supports integration with LDAP and Active Directory, in order to authenticate users. Three types of user are now supported: `local` (i.e. which are defined in `remote-api.json` itself with their passwords, and which can fully make use of `cert-nego-v4`), `ldapUser` (i.e. users defined in the LDAP server, whose password is stored in the LDAP server) and `ldapGroup` (i.e. users which are members of a particular LDAP group). Their enabled APIs can also be retrieved from a custom attribute on the LDAP server. Configuration parameters of the LDAP server are stored in the file `/share/config/ldap.json`.
  
    Here's an example of a `remote-api.json` file with LDAP users:
    
    ```json
    {
      "users": [
        { "ldap-user": "john.doe", "enabled-api": ["get-config", "set-config"] },
        { "ldap-group": "EasySambaRemoteAPIGroup", "enabled-api": "ldap-attr:easySambaEnabledAPI" },
        { "name": "localAdmin", "password": "123456" }
      ]
    }
    ```
    
    Here's an example of a `ldap.json` file:
    
    ```json
    {
      "version": "1",
      "protocol": "ldap",
      "active-directory": true,
      "hostname": "dc.demo.local"
    }
    ```
    
    > COMMITS: NEW-16, NEW-18, FIX-22, NEW-19, FIX-23

  - `Remote API` is now able to save detailed logs about API access and events. These logs will be saved to file `/share/logs/remote-api-access.logs`, if this file exists. Each line of this file is a JSON string; in order to read the logs, you need to extract and parse each line as an individual JSON object.
  
    > COMMITS: NEW-12, NEW-13
    
  - In `Remote API`, protocol `cert-nego-v4` has been enhanced: now it reports users who sent wrong credentials; also, in order to make `cert-nego-v4` work with LDAP authentication, it is now available a new `rawCert` mode that sends only the raw certificate, and `ConfigGen.js` library takes care to check its authenticity by comparing it with a user-provided hash passed to `ConfigGen.remote()`. New function `remote.certNegoRaw()` has been added to `ConfigGen.js` library, accordingly.
  
    > COMMITS: NEW-14, FIX-24
    
  - If you edit file `/share/config/remote-api.json`, `Remote API` will be automatically restarted with the new configuration.
  
    > COMMITS: NEW-15
    
  - If no valid `easy-samba` configuration is found (e.g. `config.json` or `remote-api.config.json`), SAMBA server will stop until a valid configuration is provided.
  
    > COMMITS: NEW-15
    
  - Now, every user of `Remote API` is always allowed to use `hello` API.
  
    > COMMITS: FIX-16

- Bug fixes:

  - In `ConfigGen.js` library, it's been fixed a bug that prevented the correct IP or hostname to be set in `ConfigGen.remote()`.
  
    > COMMITS: FIX-15
    
  - Minor bugfixes and several code cleanup.
  
    > COMMITS: FIX-17, FIX-18, FIX-19, FIX-20, FIX-21, CC-15, CC-16, NEW-17, CC-17, CC-18, CC-19, CC-20

- Security fixes:

  - N/A

### [UNSTABLE] [FEATURE] 2.3.0 (2019-10-10 UTC)
- New features:

  - `EasySamba Remote API V1` has been replaced by `Remote API V2`, and `cert-nego-v3` protocol has been replaced by `cert-nego-v4`. `Remote API V2` introduces multi-user support inside `Remote API` (and you can choose which APIs each user is allowed to use). Moreover, `ConfigGen.js` library has been updated in order to support the new APIs: function `ConfigGen.remote()` has changed; functions `remote.changeMyPassword()`, `remote.changeOtherPassword()`, `remote.isAuthValid()` and `remote.getEnabledAPI()` have been added; and functions `remote.changeRemoteToken()` and `remote.isTokenValid()` have been removed. Here's an example of how a `remote-api.json` file looks now:
  
    ```json
    {
        "version": "2",
        "port": 9595,
        "cert-nego": true,
        "users": [
            { "name": "admin", "password": "123456", "enabled-api": "*" },
            { "name": "admin2", "password": "123", "enabled-api": ["hello", "change-my-password", "get-config"] }
        ]
    }
    ```
    
    > COMMITS: NEW-6, NEW-7, NEW-9, NEW-10, NEW-11
    
  - `easy-samba` and `Remote API` logs now are not saved at paths `/share/config/easy-samba.logs` and `/share/config/remote-api.logs` anymore; they will be saved at paths `/share/logs/easy-samba.logs` and `/share/logs/remote-api.logs`. This simplifies the scenario in case one wants to save logs into an external partition. Here's an example of how to save logs into another partition:
  
    ```sh
    # in this example, we assume that '/mnt/disk2' is the location where the partition is mounted
    #   also, we assume that '/easy-samba/share' is the location that will be mounted as '/share' inside easy-samba container
    
    # let's create a folder called 'easy-samba-logs' inside the external partition
    mkdir /mnt/disk2/easy-samba-logs
    chown root:root /mnt/disk2/easy-samba-logs
    chmod 660 /mnt/disk2/easy-samba-logs
    
    # now we can create empty files 'easy-samba.logs' and 'remote-api.logs', so that easy-samba will save its logs to disk
    touch /mnt/disk2/easy-samba-logs/easy-samba.logs
    touch /mnt/disk2/easy-samba-logs/remote-api.logs
    
    # finally, we can start our easy-samba container adding a new volume to the command line
    docker run ... -v /easy-samba/share:/share -v /mnt/disk2/easy-samba-logs:/share/logs ...
    ```
    
    > COMMITS: NEW-8

  - Minor improvements.
  
    > COMMITS: NEW-4

- Bug fixes:

  - `Remote API` startup procedure used to fail on particularly-slow devices that require more than 2 seconds to start `Remote API` server. Now, there's no time limit anymore.
  
    > COMMITS: FIX-12, TYPO-4
    
    > REFERENCE: [ISSUE #2](https://github.com/adevur/docker-easy-samba/issues/2)
    
  - When no custom port is defined in `remote-api.json`, `Remote API` uncorrectly reports it as an invalid custom port.
  
    > COMMITS: FIX-13

- Security fixes:

  - N/A

### [STABLE] 1.19.1 (2019-10-08 UTC)
- New features:

  - N/A

- Bug fixes:

  - `Remote API` startup procedure used to fail on particularly-slow devices that require more than 2 seconds to start `Remote API` server. Now, `Remote API` startup procedure will fail only if `Remote API` server requires more than 5 seconds to start up.
  
    > COMMITS: FIX-11
    
    > REFERENCE: [ISSUE #2](https://github.com/adevur/docker-easy-samba/issues/2)
    
  - When no custom port is defined in `remote-api.json`, `Remote API` uncorrectly reports it as an invalid custom port.
  
    > COMMITS: FIX-13 (for branch 1.x.x)

- Security fixes:

  - N/A

### [STABLE] [FEATURE] 1.19.0 (2019-10-04 UTC)
- New features:

  - In `Remote API`, new protocol `cert-nego-v3` has been added. `ConfigGen.js` library now supports both old `cert-nego-v2` and new `cert-nego-v3` protocols: if `remote.certNego()` fails to use `cert-nego-v3`, it will use automatically `cert-nego-v2`.
  
    > COMMITS: NEW-2 (for branch 1.x.x)

- Bug fixes:

  - Minor bugfixes.
  
    > COMMITS: FIX-8 (for branch 1.x.x)
    
  - Improved `Dockerfile`.
  
    > COMMITS: FIX-9 (for branch 1.x.x), TYPO-3 (for branch 1.x.x), FIX-10 (for branch 1.x.x)

- Security fixes:

  - N/A

### [UNSTABLE] 2.2.1 (2019-10-04 UTC)
- New features:

  - N/A

- Bug fixes:

  - Files `Dockerfile.amd64` and `Dockerfile.arm64v8` have been unified in a single `Dockerfile`.
  
    > COMMITS: TYPO-3, FIX-10

- Security fixes:

  - N/A

### [UNSTABLE] [FEATURE] 2.2.0 (2019-10-03 UTC)
- New features:

  - New architecture available for `easy-samba`: `arm64v8` (a.k.a. `aarch64`). In order to use `easy-samba` under an ARM64 operating system, use tag `latest-arm64v8` (or `unstable-arm64v8`) instead of `latest` (or `unstable`). Architecture `arm64v8` is only available for `easy-samba` version `2.x.x`: when this version of `easy-samba` will make it to the `stable` branch (for now it's only `unstable`), also tag `stable-arm64v8` will be available.
  
    > COMMITS: NEW-3

- Bug fixes:

  - Minor improvements to `Dockerfile`. Now there are two `Dockerfile`s: `Dockerfile.amd64` and `Dockerfile.arm64v8`.
  
    > COMMITS: FIX-9

- Security fixes:

  - N/A

### [UNSTABLE] [FEATURE] 2.1.0 (2019-10-01 UTC)
- New features:

  - In `Remote API`, old `certificate-negotiation` protocol (`cert-nego-v2`) has been replaced by new protocol `cert-nego-v3`. In order to use `cert-nego` feature with `easy-samba` version `2.1.0`, you need a `ConfigGen.js` library compatible with `cert-nego-v3` (i.e. `ConfigGen.js` version `2.1.0`, at the moment).
  
    > COMMITS: NEW-2

- Bug fixes:

  - Minor bugfixes.
  
    > COMMITS: FIX-8
    
  - Some code cleanup.
  
    > COMMITS: CC-14

- Security fixes:

  - N/A

### [UNSTABLE] 2.0.1 (2019-09-30 UTC)
- New features:

  - N/A

- Bug fixes:

  - Several code and features that were deprecated in `easy-samba` version `1.x.x` have been removed. As a consequence, this version of `easy-samba` (i.e. `2.0.1`) only supports configuration files and `config.gen.js` files written for `easy-samba` version `1.18.x` and `2.0.x`.
  
    > COMMITS: CC-9, CC-10, CC-11, CC-12, CC-13, FIX-7

- Security fixes:

  - N/A

### [UNSTABLE] [FEATURE] 2.0.0 (2019-09-29 UTC)
- New features:

  - Container is now based on CentOS 8, instead of CentOS 7.
  
    > COMMITS: NEW-1

- Bug fixes:

  - N/A

- Security fixes:

  - N/A

### [STABLE] [SECURITY] 1.18.2 (2019-09-28 UTC)
- New features:

  - N/A

- Bug fixes:

  - Fixed a major bug in function `config.saveToJson()` of `ConfigGen.js` library.
  
    > COMMITS: FIX-5
    
  - Minor bugfixes.
  
    > COMMITS: FIX-4, FIX-6, CC-8
    
  - Several code cleanup.
  
    > COMMITS: CC-5, CC-6, CC-7, TYPO-1

- Security fixes:

  - Function `ConfigGen.genRandomPassword()` of `ConfigGen.js` library has been rewritten in order to fix a security vulnerability.
    
    > COMMITS: SEC-2

### [STABLE] [SECURITY] 1.18.1 (2019-08-26 UTC)
- New features:

  - N/A

- Bug fixes:

  - Version information inside an `easy-samba` container is now saved in JSON format (i.e. in file `/startup/version.json` instead of `/startup/version.txt`). This does not affect the currently documented methods to retrieve the version of an `easy-samba` container (e.g. using function `remote.getInfo()` of `ConfigGen.js` library).
  
    > COMMITS: FIX-1
    
  - Minor bugfixes.
  
    > COMMITS: FIX-2
    
  - Major code cleanup for `Remote API` and other minor code optimizations.
  
    > COMMITS: CC-1, CC-2, CC-3, CC-4

- Security fixes:

  - In `Remote API`, algorithm of certificate-negotiation feature has been changed in order to fix a security vulnerability. This security fix required to completely change the certificate-negotiation protocol: this means that, if you want to use cert-nego feature in `easy-samba` version `1.18.1`, you need `ConfigGen.js` library version `1.18.1` or newer; and, if you want to use cert-nego feature in `easy-samba` version `1.18.0` or older, you need `ConfigGen.js` library version `1.18.0` or older. Function `remote.certNego()` of `ConfigGen.js` will throw error `UNSAFE-CERT-NEGO-PROTOCOL` if you use it with an older container.
  
    > NOTE: older version of cert-nego protocol is considered unsafe, so it is strongly advisable not to use it anymore. If you are not able to update to `easy-samba` version `1.18.1` anytime soon, you should manually pass the remote container's certificate to function `ConfigGen.remote()`. Take a look at the `Documentation` for more info.
    
    > COMMITS: SEC-1, FIX-3

### [STABLE] [FEATURE] 1.18.0 (2019-08-08 UTC)
- New features:

  - New properties have been added in `remote-api.json` configuration file: `cert-nego` and `enabled-api`.
  
    - Property `cert-nego` is a boolean that specifies if certificate-negotiation feature of `Remote API` must be enabled or not (default value is `true`).
    
    - Property `enabled-api` can be equal to `"*"` or can be an array of strings; it specifies the list of `Remote API` methods that remote clients can use; default value is `"*"` (i.e. "all available API methods").
    
  - Shared folders name now cannot be more than 8 characters in length. This is because some SAMBA clients don't support names longer than 8 chars.
  
  - Shared folders name is now considered case-insensitive. For example: there cannot be two shared folders with names `"test"` and `"Test"`, because they would be considered as two shares with the same name.

- Bug fixes:

  - N/A

- Security fixes:

  - N/A

### [STABLE] 1.17.1 (2019-08-06 UTC)
- New features:

  - N/A

- Bug fixes:

  - Improved behavior of function `remote.certNego()` in `ConfigGen.js` library.

  - Improved error handling in `ConfigGen.js` library.
  
  - Minor code cleanup.

- Security fixes:

  - N/A

### [STABLE] [FEATURE] [SECURITY] 1.17.0 (2019-08-06 UTC)
- New features:

  - `Remote API` method `get-logs` now returns also the logs of `Remote API` (located at `/share/config/remote-api.logs`), if available. In `ConfigGen.js` library, function `remote.getLogs()` has been replaced by `remote.getRemoteLogs()`.
  
  - `Remote API` method `get-info` now returns also the path where configuration files are located inside the remote container (e.g. `"/share/config"`). In `ConfigGen.js` library, function `remote.getInfo()` has been updated, and function `remote.getConfigPath()` has been added.
  
  - In `ConfigGen.js` library, new static function `ConfigGen.getConfigPath()` has been added, and returns the path where configuration files are located inside the local machine (e.g. `"/share/config"`). This way, when your `config.gen.js` script is running inside the container, you will be able to know where to save the `config.json` file. For example:
  
    ```js
    const ConfigGen = require("/startup/ConfigGen.js");
    const config = new ConfigGen();
    const CFG = ConfigGen.getConfigPath();
    config.saveToFile(`${CFG}/config.json`);
    ```
    
  - In `ConfigGen.js` library, in order to unset fixed or base rules, expressions `config.shares.setFixedRules([])` and `config.shares.setBaseRules([])` are now deprecated, while `config.shares.setFixedRules(undefined)` and `config.shares.setBaseRules(undefined)` should be used.
  
  - `global` section of `config.json` is now deprecated, and it will be ignored if present. Accordingly, function `config.global()` of `ConfigGen.js` library is now deprecated as well.
  
  - In `ConfigGen.js` library, function `remote.hello()` is now deprecated, and it's been replaced by new functions `remote.isReachable()` and `remote.isTokenValid()`.
  
  - New `Remote API` method `change-token` has been added, that will let you change the secret token of the remote container from a remote client. New function `remote.changeRemoteToken()` has been added to `ConfigGen.js` library, accordingly.
  
  - New `Remote API` method `stop-easy-samba` has been added, that will let you stop an `easy-samba` container from a remote client. New function `remote.stopEasySamba()` has been added to `ConfigGen.js` library, accordingly. Note that if you stop an `easy-samba` container this way, you will also stop `Remote API` server (because it's located inside the container), so you won't be able to restart `easy-samba` with `Remote API`, but you will have to restart manually the container (e.g. using Docker or `systemd`). Also note that if you have set your machine to restart `easy-samba`'s container automatically in case it stops (e.g. using Docker's parameter `--restart always` or `systemd`'s option `Restart=always`), method `stop-easy-samba` is almost useless.
  
  - New `Remote API` methods `pause-easy-samba` and `start-easy-samba` have been added, that will let you pause and start an `easy-samba` container from a remote client. New functions `remote.pauseEasySamba()` and `remote.startEasySamba()` have been added to `ConfigGen.js` library, accordingly. The difference between methods `stop-easy-samba` and `pause-easy-samba` is that the former will stop the remote container, while the latter will tell `easy-samba` to pause its status, keeping the container and `Remote API` running (and, as a consequence, you will be able to unpause `easy-samba` using method `start-easy-samba`).
  
  - Now `soft-quota`'s property `whitelist` can contain also group names and user `nobody`. In case `whitelist` contains user `nobody`, `soft-quota` will not be applied to guest users (i.e. users without login).
  
  - `Remote API` now exposes a way to automatically negotiate server's certificate using its secret token. This API is placed at `https://hostname:port/cert-nego` and is also used by `ConfigGen.js` library to automatically retrieve the remote container server's certificate when no certificate has been supplied to `ConfigGen.remote()` function. Remote container will send its certificate encrypted using the secret token. In `ConfigGen.js` library, new function `remote.certNego()` can be used in order to retrieve the remote container server's certificate manually.

- Bug fixes:

  - `soft-quota` implementation has been improved a lot, and now it is more effective when blocking write-access to shared folders that have broken their maximum allowed size limit.

  - There's been a code rewrite of `/startup/functions/fnEasySambaLoop.js` and `/startup/remote-api/fnAPI.js`, in order to improve stability and clearness.

  - Minor bugfixes and improvements.

- Security fixes:

  - In `Remote API`, `token` provided by a remote client is more securely checked. This prevents the use of timing attacks to brute force the secret token.

### [STABLE] 1.16.1 (2019-07-31 UTC)
- New features:

  - N/A

- Bug fixes:

  - Fixed behavior of `EasySamba Remote API`: now it sends error `REMOTE-API:API-NOT-SUPPORTED` properly; and validation of `token` is done before validation of API method.
  
  - Logs to stdout are now properly colorized in case of errors or warnings.

- Security fixes:

  - N/A

### [STABLE] [FEATURE] 1.16.0 (2019-07-30 UTC)
- New features:

  - Two new `Remote API` calls have been implemented: `get-logs` and `get-available-api`. And `ConfigGen.js` library has been updated with two new functions accordingly: `remote.getLogs()` and `remote.getAvailableAPI()`. Method `get-available-api` returns the list of `Remote API` methods supported by the `easy-samba` container (e.g. `["get-config", "set-config", "hello", ...]`).
  
  - `Remote API` method `set-config` now accepts optional parameter `hash`, that is the MD5 hash of the current `remote-api.config.json` file. This is useful in order to verify that no one else has modified that file while you were manipulating it. In `ConfigGen.js` library, new function `remote.getConfigHash()` has been added, and functions `ConfigGen.fromRemote()`, `config.saveToRemote()` and `remote.setConfig()` have extended their functionalities.
  
  - Error handling in `Remote API` has been improved, and now it is possible to exactly know what went wrong during communication with `easy-samba` container's `Remote API`. Error handling of `Remote API` has been improved also in `ConfigGen.js` library.

- Bug fixes:

  - Now, script `config.gen.js` gets killed if you delete `/share/config/config.gen.js` file.

  - Minor bugfixes.
  
  - Several code cleanup.

- Security fixes:

  - N/A

### [STABLE] [FEATURE] 1.15.0 (2019-07-25 UTC)
- New features:

  - Now, all configuration files have been moved from `/share` to `/share/config` directory. Old location `/share` is still supported for retro-compatibility reasons, but it's advisable to start moving all configuration files to sub-directory `/share/config`. In particular, these are the files to move: `config.json`, `config.gen.js`, `remote-api.json`, `remote-api.key`, `remote-api.cert` and `remote-api.config.json`.
  
    > NOTE: all future features that require a configuration file will only work if this file is placed inside `/share/config` directory. Therefore, support for `/share` directory is used only for retro-compatibility with older configuration files like `config.json`.

  - Implemented new feature in `easy-samba` configuration file: `soft-quota`. This is a property that may be placed inside a `share`, to specify a limit to its size. For example:
  
    ```json
    {
      "name": "folder1",
      "path": "/share/folder1",
      "access": ["rw:*"],
      "soft-quota": { "limit": "150MB", "whitelist": ["admin"] }
    }
    ```
    
    In this example, if directory `/share/folder1` reaches 150MB of size, every user will lose its write-access to `folder1`. This way, `easy-samba` avoids that some user writes new data and increases `folder1`'s size over its allowed limit. The only exception is user `admin`, who will keep its write-access to `folder1`, because it is specified in the `whitelist` property of `soft-quota`. This way, if `folder1` reaches 150MB of size, user `admin` will be able to delete some files in order to free space. When `folder1`'s size will decrease to under 150MB, users will get automatically write-access again.

  - In `ConfigGen.js` library, in order to support new feature `soft-quota`, new function `config.shares.setSoftQuota()` has been added, functions `config.shares.add()` and `config.shares.addArray()` have changed, and new event `share-change-softquota` has been added.
  
  - Now, `easy-samba` and `EasySamba Remote API` can optionally save their logs to disk. If you create an empty file `/share/config/easy-samba.logs`, `easy-samba` will fill it with its logs. Similarly, `Remote API` will save its logs to `/share/config/remote-api.logs`, if this file exists.

- Bug fixes:

  - Improved validation of shared folders' path in `easy-samba` configuration files.
  
  - Minor bugfixes.
  
  - Several code optimizations.

- Security fixes:

  - N/A

### [STABLE] [FEATURE] 1.14.0 (2019-07-22 UTC)
- New features:

  - In `ConfigGen.js` library, these new functions have been added: `config.shares.getAccess()`, `config.shares.setAccess()` and `config.groups.getMembers()`.
  
  - There's been a major code rewrite of `/startup/index.js` script (that is the main and first-executed script of an `easy-samba` container). This code rewrite has improved stability and clearness a lot. `easy-samba`'s logs have been improved as well. `EasySamba Remote API` startup procedure is now more consistent and reliable.
  
  - In `ConfigGen.js` library, functions `config.users.add()` and `config.groups.add()` now have a more strict policy about parameters `username` and `groupname`, respectively: they must be non-empty strings, and there cannot be a user with the same name of a group, and there cannot be a group with the same name of a user.
  
  - In order for `EasySamba Remote API` to be enabled, it is sufficient that a file named `/share/remote-api.json` is present (and `/share/config.json` and `/share/config.gen.js` are missing); before, `/share/remote-api.json` had to be a valid JSON file; now, in case it is not a valid JSON file, or in case it doesn't contain a `token` property, a `token` will be automatically randomly-generated by `easy-samba`, and written to `/share/remote-api.json`.
  
  - `easy-samba` will now use `/share/remote-api.config.json` to retrieve configuration, only in case `EasySamba Remote API` is enabled and running.

- Bug fixes:

  - Minor bugfixes in `ConfigGen.js` library (in functions `config.groups.add()` and `config.shares.removeRules()`).
  
  - Minor bugfixes to `EasySamba Remote API`.
  
  - Minor bugfixes in `easy-samba` itself.

- Security fixes:

  - N/A

### [STABLE] [FEATURE] 1.13.0 (2019-07-10 UTC)
- New features:

  - In `ConfigGen.js` library, property `config.easysambaVersion` is now deprecated, and it's been replaced by static property `ConfigGen.version`.

  - In `ConfigGen.js` library, function `config.shares.removeRules()` is now deprecated; use `config.shares.removeRuleAt()`, instead. The purpose of `config.shares.removeRules()` was to remove only the first occurrency of a specified rule; this is achievable also with this snippet:

    ```js
    const removeFirstOccurrencyOfRule = (sharename, ruleToDelete) => {
        const index = config.shares.get(sharename)["access"].indexOf(ruleToDelete);
        return config.shares.removeRuleAt(sharename, index);
    };
    ```

  - In `ConfigGen.js` library, a new function has been added: `config.shares.setBaseRules()`, and two other functions have changed their input arguments: `ConfigGen.fromRemote()` and `config.saveToRemote()`.

  - In `ConfigGen.js` library, event handling has been improved, and now it avoids infinite loops between callbacks (in case two or more event handlers call each other endlessly).

  - A new API call has been added to `EasySamba Remote API`: `hello`. This new API returns `"world"` in case connection was successful and the token was correct. This is useful to test for connectivity towards a remote container, or to test if the token is valid. This new API is used also in `ConfigGen.js` library, by the newly-implemented function `remote.hello()`.

- Bug fixes:

  - Minor bugfixes.

- Security fixes:

  - N/A

### [STABLE] [FEATURE] 1.12.0 (2019-07-09 UTC)
- New features:

  - Now it is possible to specify access rules of a shared folder together with property `guest`. This way, you can manage access to anonymous shared folders. For example, `{ "name": "anon", "path": "/share/anon", "access": ["ro:*", "rw:admin"], "guest": "ro" }` means that shared folder `anon` is read-only for guest users (i.e. users without login) and it's also read-only for all users with login, except for user `admin`, who can also write to that folder.

  - In `ConfigGen.js` library, functions `config.shares.add()` and `config.shares.addArray()` have been updated to support both `access` and `guest` properties set together. For example: `config.shares.add("anon", "/share/anon", ["ro:*", "rw:admin"], "ro");` or `config.shares.addArray([{ "name": "anon", "path": "/share/anon", "access": ["ro:*", "rw:admin"], "guest": "ro" }]);`. Old syntax is still supported for retro-compatibility purposes.

  - If `/share/remote-api.json` is missing a `token` property, a random token of 12 characters will be generated automatically and will be written to `/share/remote-api.json` file. Note that `/share/remote-api.json` still has to be a valid JSON file, so it must be equal to `{}` in case it doesn't have any property (because empty files are not considered valid JSON files).

  - `easy-samba` now gives more priority to `/share/config.gen.js` file over `/share/remote-api.config.json`. This means that if a `/share/config.gen.js` file is present (and `/share/config.json` is missing), `easy-samba` will use it to generate a new `/share/config.json` file, instead of using the existing `/share/remote-api.config.json`.

  - These new functions have been added to `ConfigGen.js` library: `ConfigGen.remote()`, `remote.setConfig()`, `remote.getConfig()` and `remote.getInfo()`.

  - A new API call has been added to `EasySamba Remote API`: `get-info`. This new API returns an object like `{ running: true, version: "1.12.0" }`, which gives information about the status of `easy-samba` and its version.

- Bug fixes:

  - Minor improvements to generation of `/etc/samba/smb.conf`.

  - `EasySamba Remote API` is now much more stable, and has a better handling of errors.

  - In `ConfigGen.js` library, fixed rules behavior has changed and is now much more reliable. This may, in some rare cases, break compatibility with older code.

  - Other minor bugfixes to validation of configuration files.

- Security fixes:

  - N/A

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

