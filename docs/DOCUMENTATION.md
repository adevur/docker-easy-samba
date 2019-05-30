
# easy-samba documentation
`adevur/easy-samba`'s documentation is divided into these sections:

- [`config.json`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#configjson): it describes in detail the structure of `easy-samba`'s configuration file,
and all the things you can do with it.

- [`config.gen.js`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#configgenjs): it describes in detail how to write a dynamic configuration script in Javascript, that is used to generate `config.json` files in an automated and dynamic way.

- [`docker options`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#docker-options): it describes what parameters you can pass to `docker run`.

- [`networking`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#networking): it describes how you can set up networking, in order to connect to `easy-samba`'s containers
from a SAMBA client.

- [`advanced use`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#advanced-use): it shows some tricks to improve `easy-samba` use (e.g. registering `easy-samba` as a `systemd` service, automatizing updates, ...).

- [`understanding logs`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#understanding-logs): it describes how you can retrieve logs for `easy-samba`, and how to read them.

- [`how easy-samba works`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#how-easy-samba-works): it describes the inner mechanics of `easy-samba`, and how it works in detail.

- [`current limitations`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#current-limitations): it describes what are the current limitations of `easy-samba`.

## config.json
Here we talk about the structure of the configuration file of `easy-samba` (i.e. `config.json`), and what you can do with it.
This chapter is divided into these sections:

- [general structure of the file](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#general-structure-of-the-file)

- [`version` section](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#version-section)

- [`global` section](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#global-section)

- [`domain` section](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#domain-section)

- [`guest` section](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#guest-section)

- [`users` section](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#users-section)

- [`groups` section](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#groups-section)

- [`shares` section](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#shares-section)

### general structure of the file
`config.json` is a file in JSON format. It is an object with these properties: `version` (optional), `global` (optional), `domain`, `guest`, `users`, `groups` (optional),
and `shares`. `config.json` must be placed in the directory that will be mounted as `/share` in the container.

### `version` section
This section is optional and has purely informative purposes. It is a string that tells which is the mininum version of `easy-samba` required in order to
use the current `config.json` file.

For example, if you use features that have only been introduced in `easy-samba` version `1.1.x`, you could add
`"version": "1.1"` into your `config.json`, so that if this config file is used in `easy-samba` version `1.0.x`, `easy-samba` will inform the user with
this log: `[ERROR] '/share/config.json' syntax is not correct: THIS CONFIGURATION FILE USES FEATURES THAT REQUIRE EASY-SAMBA VERSION '1.1' OR NEWER`.

You are not obliged to add `version` property into your `config.json` file in order to use latest features of `easy-samba`.

At the moment, `version` property can only be equal to: `"1"`, `"1.0"`, `"1.1"`, `"1.2"` or `"1.3"`. Note that `"1"` and `"1.0"` are equivalent.

### `global` section
This section is optional and lets you customize `[global]` section of `/etc/samba/smb.conf`. It is a non-empty array of non-empty strings. Each string is the line to be added to `[global]` section.

For example, if you add `"global": ["a", "b"]` to your `config.json`, the following `[global]` section will be written inside `/etc/samba/smb.conf`:
```
[global]
...
a
b
```

> NOTE: `global` section has been introduced in `easy-samba` version `1.2`.

### `domain` section
It's a string that contains the domain name of the SAMBA server. It must be a valid [NetBIOS name](https://en.wikipedia.org/wiki/NetBIOS#NetBIOS_name) that follows these rules:

- It must be an ASCII string.

- It must have a length of minimum 1 char and maximum 15 chars.

- First char must be alphanumeric (i.e. from "a" to "z", from "A" to "Z" or from "0" to "9").

- Last char must also be alphanumeric.

- It cannot be made entirely of digits (e.g. "123" is not a valid domain name).

- All characters of `domain` must be either alphanumeric or hyphen (`-`).
This rule is valid only for chars that are not the first or the last.

### `guest` section
It can be either a boolean equal to `false`, or a string. When `guest` equals `false`, it means that no anonymous login will
be permitted to the SAMBA server. If `guest` is a string, it represents the path of the anonymous shared folder.
For example: `"/share/guest"`. To be a valid path, `guest` string must follow these rules:

- It must be a sub-directory of `/share`.

- It can contain whatever Unicode character, except for: `/`, `\`, `<`, `>`, `:`, `"`, `|`, `?`, `*`.

- It cannot contain control characters (i.e. chars with a code between 0 and 31 or with a code of 127).

- It cannot be equal to `"/share/config.json"`, to `"/share/."` or to `"/share/.."`.

- It cannot be long more than 255 characters.

- It cannot be equal to any of the paths that will be specified in the `shares` section of `config.json`.

### `users` section
It is an array that contains all the users that will be created and used by the SAMBA server. These users are created only
inside the container's OS. Note that, optionally, you can leave this array empty (i.e. `"users": []`).
An element of `users` array looks like this: `{ "name": "user1", "password": "123456" }`.

- `name` is the user's name. It must be a valid Linux username, it must not exist in the container's OS already
(so it cannot be "root" or "nobody" etc.), and it must be unique (so there cannot be two or more users with the same name,
and there cannot be a user and a group with the same name).

- `password` is the user's password, with which the user will login to the SAMBA server.
It must be a valid Linux user password (i.e. it must be a string of [printable ASCII characters](https://en.wikipedia.org/wiki/ASCII#Printable_characters)).

### `groups` section
This is an optional property of `config.json`. If you include it in your configuration file, `groups` must be an array
which contains all the groups of users that you want to create. An element of `groups` array looks like this:
`{ "name": "group1", "users": ["user1", "user2"] }`.

- `name` is the group's name. It must be a valid Linux group name, it must not exist in the container's OS already,
and it must be unique (so there cannot be two or more groups with the same name, and there cannot be a user and a group
with the same name).

- `users` is an array that contains all the usernames of the members of the group. It cannot be empty. Also, starting with `easy-samba` version `1.3`, it is possible to specify group names together with usernames (e.g. `{ "name": "group2", "users": ["group1", "user4"] }` means that `group2` contains all the users in `group1` plus `user4`).

### `shares` section
This is an array that contains all the shared folders to be created by the SAMBA server. The only shared folder that is
not included in this array is the anonymous shared folder (that is instead defined in [`guest` section of `config.json`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#guest-section)).
This section can also be an empty array. An element of `shares` array looks like this:
`{ "name": "public", "path": "/share/public", "access": ["user1", "ro:group2", "rw:user3"] }`.

- `name` is a unique name to identify the shared folder. It must be alphanumeric.

- `path` is the location on disk of the shared folder. It must be a sub-directory of `/share` and it must follow all the
validation rules described for anonymous shared folder path in [`guest` section](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#guest-section).

- `access` is a non-empty array of strings that contains all the "access rules" for the shared folder.
An access rule is a string that tells the SAMBA server who can access the shared folder, and with what permissions.
See below for more info.

ACCESS RULE SYNTAX: these are the types of access rules supported:

- When an access rule is equal to a username or a group name, it means that that user (or group) has access to the shared
folder with full read and write permissions. E.g.: `["user1", "group1"]` means that both `user1` and `group1` have read
and write permissions on the shared folder.

- When an access rule is equal to `"*"`, it means that all users (that have been defined in `users` property of `config.json`)
have access to the shared folder with full read and write permissions. Access rule `"*"` is equivalent to `"rw:*"`.

    > The wildcard character `*` has been introduced in `easy-samba` version `1.1`.

- When an access rule starts with `"rw:"` followed by a username or a group name, it means "read and write" permissions.
E.g.: `"rw:group1"` is equivalent to `"group1"` and it means that users of `group1` have read and write permissions on
the shared folder.

- When an access rule starts with `"ro:"` followed by a username or a group name, it means "only read permissions".
E.g.: `["ro:group1", "rw:user2"]` means that all users of `group1` have read permissions on the shared folder, but
`user2` has also write permissions.

- Access rule `"ro:*"` means that all users (that have been defined in `users` property of `config.json`)
have read-only permissions on the shared folder. For example: `["ro:*", "rw:user1"]` means that all users
have read-only permissions, but `user1` has also write permissions.

    > The wildcard character `*` has been introduced in `easy-samba` version `1.1`.

- When an access rule starts with `no:` followed by a username, a group name, or `*`, it means "no access at all".
E.g.: `["rw:group1", "no:user1"]` means that all members of `group1` have read and write permissions on the shared folder,
but `user1` has no access at all.

    > Permission type `no:` has been introduced in `easy-samba` version `1.1`.

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

## advanced use
This chapter will give you a couple of advices to better manage and use `easy-samba`. In this chapter, a local build of `easy-samba` (called `local/easy-samba`) will be used instead of DockerHub image [`adevur/easy-samba`](https://hub.docker.com/r/adevur/easy-samba). This chapter is divided into these sections:

- [`writing a systemd unit`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#writing-a-systemd-unit)

- [`automatizing easy-samba updates`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#automatizing-easy-samba-updates)

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
    docker run --network host -v /nas/share:/share --name samba local/easy-samba:latest
    ```

    > NOTE: the reason why we used `local/easy-samba:latest` instead of `adevur/easy-samba:latest` is because we're going to automatize updates of `easy-samba`, building it locally. This procedure is described in [section `automatizing easy-samba updates` of `advanced use` chapter](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#automatizing-easy-samba-updates).

    > NOTE 2: all parameters of `docker run` can be customized. Just take care of two things: parameters `-d` and `--restart always` must not be included in `docker run` command, since they would break our `systemd` service functionality.

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

    [Install]
    WantedBy=multi-user.target
    ```

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

1) Stop `easy-samba` and remove every docker image.

2) Download up-to-date source code of `easy-samba` from GitHub.

3) Build a new image based on the downloaded latest source code.

4) Start `easy-samba`.

The directory where we're going to keep the source code of `easy-samba` will be located at
`/easy-samba/src`, so make sure to create this directory with command `mkdir /easy-samba/src`.

Now, you can create the script with `nano /easy-samba/update.sh`:

```sh
#!/bin/bash

# stop easy-samba service
systemctl stop easy-samba.service

# stop and remove every docker container and image
docker stop $(docker container ls --all -q)
docker container rm $(docker container ls --all -q)
docker image rm $(docker image ls -q)

# clean up "/easy-samba/src" directory
rm -rf /easy-samba/src/docker-easy-samba-master
rm -f /easy-samba/src/easy-samba.zip

# download up-to-date source code from GitHub
# and unzip it to "/easy-samba/src"
curl -sL https://github.com/adevur/docker-easy-samba/archive/master.zip > /easy-samba/src/easy-samba.zip
unzip -qq /easy-samba/src/easy-samba.zip -d /easy-samba/src

# build the up-to-date image with docker
# in this case, we're going to build from "stable" branch
docker build --tag=local/easy-samba:latest /easy-samba/src/docker-easy-samba-master/stable/latest

# clean up "/easy-samba/src" directory
rm -rf /easy-samba/src/docker-easy-samba-master
rm -f /easy-samba/src/easy-samba.zip

# start easy-samba
systemctl start easy-samba.service
```

Every time you want to update `easy-samba`, you just need to execute `/easy-samba/update.sh` script.

> NOTE: the reason why we build `easy-samba` locally and we don't just retrieve it from docker repository
`adevur/easy-samba` is that, building locally, we'll always have container's packages updated to latest version.

## understanding logs
`easy-samba` uses logs in order to inform the user about the status of the SAMBA server. In case of errors, logs will
give you detailed informations about what's going on.

### how to get logs
In order to retrieve logs of `easy-samba`, you can use this command:
```sh
docker logs samba
```

> Where `samba` is the container's name or ID.

> NOTE: in case of errors, the container will stop. If you used the parameter `--rm` in the `docker run` command (when
you first [started the container](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#docker-options)), docker will remove the container after it stops, so you won't be able to retrieve logs about the error. In order to keep the container saved even after it stops, don't use parameter `--rm` in `docker run` command. This way, you will be able to use `docker logs samba` in case an error occurred and the container stopped.

### list of logs
This is the list of possible logs, when no error occurs:

0) `[LOG] you're using easy-samba version '...' from '...' branch.`: this log informs the user about the current `easy-samba`
version. E.g.: `[LOG] you're using easy-samba version '1.0.0' from 'stable' branch.`.

1) `[LOG] SAMBA server configuration process has started.`: this log informs the user that `easy-samba` has started.

2) `[LOG] '/share/config.json' has been correctly loaded.`: this log informs the user that configuration file
`/share/config.json` has been successfully read and parsed.

3) `[LOG] '/share/config.json' syntax is correct.`: this log informs the user that the configuration file doesn't
contain syntax errors or content errors (e.g. usernames are correct, shared folders' paths are valid, ...).

4) `[LOG] permissions of '/share' have been correctly reset.`: this log informs the user that filesystem permissions
and ACLs of `/share` have been cleared successfully.

5) `[LOG] permissions of '/share' have been correctly set.`: this log informs the user that filesystem permissions
and ACLs of `/share` have been successfully set, so that `/share` and all its children can only be accessed by
`root`.

6) `[LOG] guest share has been correctly created.`: this log informs the user that the anonymous shared folder has been
successfully created (in case it didn't exist) and its filesystem permissions have been successfully set.
This log only appears when you configured an anonymous shared folder in [`guest` section of `config.json` file](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#guest-section).

7) `[LOG] guest share will not be created.`: this log informs the user that no anonymous shared folder will be created.
This log only appears when [`guest` property of `config.json`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#guest-section) has been set to `false`.

8) `[LOG] users have been correctly created.`: this log informs the user that all the users that you configured in
[`users` section of `config.json`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#users-section) have been correctly added to container's OS and to container's SAMBA server.

9) `[LOG] shares have been correctly created.`: this log informs the user that all the shared folders that you
configured in [`shares` section of `config.json`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#shares-section) have been correctly created (in case they didn't exist), and all
the filesystem permissions and ACLs have been correctly set to them.

10) `[LOG] '/etc/samba/smb.conf' has been correctly generated and written.`: this log informs the user that the SAMBA
server's configuration file `/etc/samba/smb.conf` has been successfully generated and written to disk.

11) `[LOG] starting 'nmbd'...`: this log informs the user that `/usr/sbin/nmbd` process is about to being started.
This process is necessary for the SAMBA server to function properly.

12) `[LOG] waiting 2 seconds before starting 'smbd'...`: this log informs the user that `easy-samba` will wait 2
seconds before starting `/usr/sbin/smbd` process.

13) `[LOG] starting 'smbd'...`: this log informs the user that `/usr/sbin/smbd` process is about to being started.
This process is necessary for the SAMBA server to function properly.

14) `[LOG] SAMBA server is now ready.`: this log informs the user that `easy-samba` completed its configuration without
errors, so you can now [connect to the container using a SAMBA client](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#networking).

15) `[LOG] generating '/share/config.json' using script '/share/config.gen.js'...`: this log informs the user that `/share/config.json` configuration file is missing, but `/share/config.gen.js` script has been found, so the latter will be used to generate the missing `config.json` file.

### list of errors
This is the list of possible logs, when an error occurs:

0) `[WARNING] it's not been possible to display version information.`: this is the only error that doesn't stop the container.
It is not a real error, just a warning that `easy-samba` could not retrieve version information. This happens when file
`/startup/version.txt` doesn't exist or it's not well-formatted. You should ignore this error since it's not caused by you.
Moreover, you should open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

1) `[ERROR] script has failed for unknown reasons.`: this is a generic error that occurs when `easy-samba` configuration
process throws an error that it doesn't recognize. This error is usually followed by message `[DEBUG] DETAILS ABOUT THE ERROR: ...`,
which gives you mostly debug information. If this error occurs, you should open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

2) `[ERROR] '/share/config.json' could not be loaded or it is not in JSON format.`: this error occurs when the configuration
file `/share/config.json` doesn't exist or it is not a valid JSON file.

3) `[ERROR] '/share/config.json' syntax is not correct: ...`: this error occurs when `config.json` contains syntax or
content errors (e.g. `guest` section is missing, one of the usernames is not a valid username, ...). This log also
gives you detailed information about what is the error that's been found.
See also [`config.json` section of this `Documentation`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#configjson)
in order to better understand the reported error.

4) `[ERROR] permissions of '/share' could not be reset.`: this error occurs mostly if the underlying OS or the underlying
filesystem that you're using on your computer don't support POSIX ACLs.

5) `[ERROR] permissions of '/share' could not be set.`: this error occurs mostly if the underlying OS or the underlying
filesystem that you're using on your computer don't support POSIX ACLs.

6) `[ERROR] guest share could not be created: ...`: this error occurs if `easy-samba` has not been able to create
the anonymous shared folder. This log also gives you detailed information about what is the error that's been found.
If you get this error, you should probably open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

7) `[ERROR] users could not be created: ...`: this error occurs if `easy-samba` has not been able to add the users
(that you specified in [`users` section of `config.json`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#users-section))
in the container's OS and in the SAMBA server.
If you get this error, you should probably open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

8) `[ERROR] shares could not be created: ...`: this error occurs if `easy-samba` has not been able to create
the shared folders (that you specified in the [`shares` section of `config.json`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#shares-section)).
If you get this error, you should probably open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

9) `[ERROR] '/etc/samba/smb.conf' could not be generated or written.`: this error occurs mostly if `easy-samba` has
not been able to write file `/etc/samba/smb.conf` inside the container.
If you get this error, you should probably open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

10) `[ERROR] 'nmbd' could not be started.`: this error occurs if `easy-samba` has not been able to start process
`/usr/sbin/nmbd` inside the container.
If you get this error, you should probably open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

11) `[ERROR] 'nmbd' terminated for unknown reasons.`: this error occurs if process `/usr/sbin/nmbd` has suddenly exited.
If you get this error, you should probably open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

12) `[ERROR] 'smbd' could not be started.`: this error occurs if `easy-samba` has not been able to start process
`/usr/sbin/smbd` inside the container.
If you get this error, you should probably open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

13) `[ERROR] 'smbd' terminated for unknown reasons.`: this error occurs if process `/usr/sbin/smbd` has suddenly exited.
If you get this error, you should probably open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

14) `[ERROR] it's not been possible to clean up existing users.`: this error occurs if `easy-samba` has not been able to clean up existing users during startup phase. This error has been added in version `1.2.0` of `easy-samba`.
If you get this error, you should probably open an issue in the GitHub repository [`adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba).

## how easy-samba works
This chapter describes in detail what `easy-samba` does inside its container in order to setup the SAMBA server. This chapter is divided into these sections:

- [general structure of `easy-samba`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#general-structure-of-easy-samba)

- [main script `/startup/index.js`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#main-script-startupindexjs)

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

1) The script looks for the configuration file `/share/config.json`, reads it and parses it (from JSON to Javascript object).

2) The script checks if `config.json` contains syntax errors, or any other error (e.g. you defined two users with the same username).

    This phase is very important, since the rest of this script will just assume that every single parameter of `config.json` is valid and has no conflicts with other parameters (because the configuration file has already been validated during this phase).

    Also, during this phase, `easy-samba` will evaluate the access rules defined in the `shares` property (see also [`shares` property of `config.json` in this Doumentation](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#shares-section) in order to understand how access rules get evaluated).

3) The script will clear all filesystem permissions of `/share` using these commands:
    ```sh
    setfacl -R -bn /share
    chmod -R a+rX /share
    ```

    This phase is needed because `easy-samba` has to set its own permissions on `/share` (accordingly to `config.json`), so no other custom permission must be present on `/share`.

4) The script will set the initial permissions of `/share`. In this phase, `/share` is set so that only `root` has access to it and its children. These commands are used:
    ```sh
    chown -R root:root /share
    setfacl -R -m 'u::rwx,g::rwx,o::x' /share
    setfacl -R -dm 'u::rwx,g::rwx,o::x' /share
    ```

5) In case `guest` property of `config.json` is not `false`, the script will create the anonymous shared folder (in case it doesn't exist). In order to set the correct permissions on the anonymous shared folder, these commands are used (in this example, `/share/guest` will be the shared folder's path):
    ```sh
    chown -R nobody:nobody /share/guest
    setfacl -R -m 'u::rwx,g::rwx,o::rwx,u:nobody:rwx,g:nobody:rwx' /share/guest
    setfacl -R -dm 'u::rwx,g::rwx,o::rwx,u:nobody:rwx,g:nobody:rwx' /share/guest
    ```

6) The script reads `users` property of `config.json` and adds every user into the container's OS and in the SAMBA server.
The script uses these commands (in this example, there's only a user with name `user1` and password `123456`):
    ```sh
    useradd -M -s /sbin/nologin user1
    echo '123456' | passwd user1 --stdin
    (echo '123456'; echo '123456') | smbpasswd -a user1 -s
    ```

7) The script reads `shares` property of `config.json` and, for each defined shared folder, it creates the directory (if it doesn't exist) and
sets its permission accordingly to the access rules that have been evaluated during phase 2.

8) The script writes a `/etc/samba/smb.conf` file, accordingly to the configuration parameters of `config.json`.
Documentation about `/etc/samba/smb.conf` can be found [here](https://www.samba.org/samba/docs/current/man-html/smb.conf.5.html).

9) The script starts the SAMBA server with these commands:
    ```sh
    /usr/sbin/nmbd --foreground --no-process-group
    /usr/sbin/smbd --foreground --no-process-group
    ```

10) The script will now keep running until either `nmbd` or `smbd` stop.







