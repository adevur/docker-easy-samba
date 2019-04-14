
# easy-samba documentation
`adevur/easy-samba`'s documentation is divided into these sections:

- `config.json`: it describes in detail the structure of `easy-samba`'s configuration file,
and all the things you can do with it.

- `docker options`: it describes what parameters you can pass to `docker run`.

- `networking`: it describes how you can set up networking, in order to connect to `easy-samba`'s containers
from a SAMBA client.

- `understanding logs`: it describes how you can retrieve logs for `easy-samba`, and how to read them.

- `how easy-samba works`: it describes the inner mechanics of `easy-samba`, and how it works in detail.

- `current limitations`: it describes what are the current limitations of `easy-samba`.

## config.json
Here we talk about the structure of the configuration file of `easy-samba` (i.e. `config.json`), and what you can do with it.
This chapter is divided into these sections:

- General structure of the file

- `domain` section

- `guest` section

- `users` section

- `groups` section

- `shares` section

### General structure of the file
`config.json` is a file in JSON format. It is an object with these properties: `domain`, `guest`, `users`, `groups` (optional),
and `shares`. `config.json` must be placed in the directory that will be mounted as `/share` in the container.

### `domain` section
It's a string that contains the domain name of the SAMBA server. It must be a valid NetBIOS name that follows these rules:

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

- It must only contain alphanumeric chars (i.e. from "a" to "z", from "A" to "Z" or from "0" to "9").

- It cannot be equal to `"/share/config.json"`.

- It cannot be equal to any of the paths that will be specified in the `shares` section of `config.json`.

### `users` section
It is an array that contains all the users that will be created and used by the SAMBA server. These users are created only
inside the container's OS. Note that, optionally, you can leave this array empty (i.e. `"users": []`).
An element of `users` array looks like this: `{ "name": "user1", "password": "123456" }`.

- `name` is the user's name. It must be a valid Linux username, it must not exist in the container's OS already
(so it cannot be "root" or "nobody" etc.), and it must be unique (so there cannot be two or more users with the same name,
and there cannot be a user and a group with the same name).

- `password` is the user's password, with which the user will login to the SAMBA server.
It must be a valid Linux user password.

### `groups` section
This is an optional property of `config.json`. If you include it in your configuration file, `groups` must be an array
which contains all the groups of users that you want to create. An element of `groups` array looks like this:
`{ "name": "group1", "users": ["user1", "user2"] }`.

- `name` is the group's name. It must be a valid Linux group name, it must not exist in the container's OS already,
and it must be unique (so there cannot be two or more groups with the same name, and there cannot be a user and a group
with the same name).

- `users` is an array that contains all the usernames of the members of the group. It cannot be empty.

### `shares` section
This is an array that contains all the shared folders to be created by the SAMBA server. The only shared folder that is
not included in this array is the anonymous shared folder (that is instead defined in `guest` section of `config.json`).
This section can also be an empty array. An element of `shares` array looks like this:
`{ "name": "public", "path": "/share/public", "access": ["user1", "ro:group2", "rw:user3"] }`.

- `name` is a unique name to identify the shared folder. It must be alphanumeric.

- `path` is the location on disk of the shared folder. It must be a sub-directory of `/share` and it must follow all the
validation rules described for anonymous shared folder path in `guest` section.

- `access` is a non-empty array of strings that contains all the "access rules" for the shared folder.
An access rule is a string that tells the SAMBA server who can access the shared folder, and with what permissions.
See below for more info.

ACCESS RULE SYNTAX: these are the types of access rules supported:

- When an access rule is equal to a username or a group name, it means that that user (or group) has access to the shared
folder with full read and write permissions. E.g.: `["user1", "group1"]` means that both `user1` and `group1` have read
and write permissions on the shared folder.

- When an access rule starts with `"rw:"` followed by a username or a group name, it means "read and write" permissions.
E.g.: `"rw:group1"` is equivalent to `"group1"` and it means that users of `group1` have read and write permissions on
the shared folder.

- When an access rule starts with `"ro:"` followed by a username or a group name, it means "only read permissions".
E.g.: `["ro:group1", "rw:user2"]` means that all users of `group1` have read permissions on the shared folder, but
`user2` has also write permissions.

- If a user or a group are not included in the access rules of a shared folder, it means that they have no access at all
to that shared folder.

## understanding logs
`easy-samba` uses logs in order to inform the user about the status of the SAMBA server. In case of errors, logs will
give you detailed informations about what's going on.

### how to get logs
In order to retrieve logs of `easy-samba`, you can use this command:
```sh
docker logs samba
```

Where `samba` is the container's name or ID.

NOTE: in case of errors, the container will stop. If you used the parameter `--rm` in the `docker run` command (when
you first started the container), docker will remove the container after it stops, so you won't be able to retrieve
logs about the error. In order to keep the container saved even after it stops, don't use parameter `--rm` in
`docker run` command. This way, you will be able to use `docker logs samba` in case an error occurred and the
container stopped.

### list of logs
This is the list of possible logs, when no error occurs:

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
This log only appears when you configured an anonymous shared folder in `guest` section of `config.json` file.

7) `[LOG] guest share will not be created.`: this log informs the user that no anonymous shared folder will be created.
This log only appears when `guest` property of `config.json` has been set to `false`.

8) `[LOG] users have been correctly created.`: this log informs the user that all the users that you configured in
`users` section of `config.json` have been correctly added to container's OS and to container's SAMBA server.

9) `[LOG] shares have been correctly created.`: this log informs the user that all the shared folders that you
configured in `shares` section of `config.json` have been correctly created (in case they didn't exist), and all
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
errors, so you can now connect to the container using a SAMBA client.

### list of errors
This is the list of possible logs, when an error occurs:













