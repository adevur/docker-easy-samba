
# easy-samba news
Stay updated on `easy-samba` development.

### (2019-10-10 UTC) EasySamba Remote API V2, Cluster API roadmap, and SAMBA authentication future improvements
`EasySamba Remote API V2` replaced `Remote API V1` in `easy-samba` version `2.3.0`. Also, `ConfigGen.js` library version `2.3.0` only supports `Remote API V2`. Some of the improvements:

- Multi-user support: now, you can create multiple users in `remote-api.json`, and you can choose which APIs each user can use.

- `cert-nego-v4` protocol replaces `cert-nego-v3` protocol in `Remote API V2`, because the former supports multi-user authentication. Protocol `cert-nego-v3` will remain in `Remote API V1` (i.e. in `easy-samba` version `1.x.x`).

About `EasySamba Cluster API`:

- Work is in progress for implementing a first version of `Cluster API`, which will support `fault-tolerance` mode using some storage replication software (at the moment, the candidates are `lsyncd` and `GlusterFS`). In particular, `lsyncd` is a solution that would not require `--privileged` or `--cap-add SYS_ADMIN` flags in Docker, which is much better, from a security point of view.

About future improvements in SAMBA authentication:

- Work is in progress for implementing alternative ways to authenticate SAMBA users. In particular, using PAM and/or Active Directory.

### (2019-10-05 UTC) support for `ppc64le` architecture and future features
- New architecture `ppc64le` is now supported by `easy-samba` version `2.x.x`. It can be downloaded normally with command `docker pull adevur/easy-samba:latest` on `ppc64le` devices. Alternatively, it can be downloaded explicitly, by pulling tag `latest-ppc64le` instead of generic `latest` tag.

- Support for `i386` (i.e. `32-bit x86`) architecture is under consideration. Docker and many Linux distributions have dropped support for `i386` architecture already, although many people still use `i386` devices for several reasons.

  > NOTE: although Docker doesn't support `i386` devices anymore, one of Docker's alternatives, `podman`, still supports `i386` architecture on several distributions (including Ubuntu versions 16.04, 18.04 and 19.04). `podman` can be used to run `easy-samba` containers in the same way as Docker (e.g. using command `podman run ...` instead of `docker run ...`).
  
- New feature `EasySamba Cluster API` is under development. This new API will let you configure several `easy-samba` containers so that they can work together (for example, in load-balance mode or in fault-tolerance mode).

### (2019-10-03 UTC) development status update
Today `easy-samba` version `2.2.0` has been released, that brings support for `arm64v8` architecture. Tags are now organized this way:

- Tag `latest` works both for `amd64` and `arm64v8` architectures. When you pull `adevur/easy-samba:latest`, Docker will automatically download tag `latest-amd64` or tag `latest-arm64v8`, according to your architecture.

- Tag `latest-amd64` works only for `amd64` architecture.

- Tag `latest-arm64v8` works only for `arm64v8` architecture.

- Tag `unstable` has been dropped, since it was just an alias for `latest`.

- Tags `stable` and `stable-amd64` are the same tag, at the moment. This is because `stable` branch (i.e. `1.x.x`, at the moment) only supports `amd64` architecture. In the future, when `easy-samba` version `2.x.x` will make it to the `stable` branch, tag `stable-arm64v8` will be added, and tag `stable` will work both for `amd64` and `arm64v8` architectures (just like `latest` tag).

Work is in progress for porting `easy-samba` to `ppc64le` architecture. Other architectures (e.g. `arm32v7`) are planned, but there's no ETA.

### (2019-09-28 UTC) development status update
Development of version `2.x.x` of `easy-samba` has started. All the development of version `2.x.x` will be done in sub-directory `./development/branch-2.x.x`, while all the development of version `1.x.x` will be done in sub-directory `./development/branch-1.x.x`.

> NOTE: you can build the development version of `easy-samba` with command `docker build --tag local/easy-samba:devel-2.x.x ./development/branch-2.x.x`.

Some important news are:

- New branch `2.x.x` is already based on CentOS 8. Since there's no official Docker image of CentOS 8 yet, unofficial image [`adevur/centos-8:latest`](https://hub.docker.com/r/adevur/centos-8) will be used temporarily, until official image `centos:8` comes out.

- New branch `2.x.x` should be compatible with new architectures as well (other than `x86_64`). At the moment, CentOS 8 is compatible with these architectures: `x86_64`, `ppc64le` and `aarch64`. `easy-samba`, instead, is only compatible with `x86_64` at the moment, but new architectures will be soon supported through tags like: `latest-aarch64`, `latest-ppc64le`, etc.

### (2019-08-08 UTC) development status update
- Latest releases of `easy-samba` have brought many important features and improvements. Here's a short list:

  - Implementation of `EasySamba Remote API`, that will let you manage an `easy-samba` container from a remote client.
  
  - New features to anonymous shared folders, that now are much more versatile.
  
  - Configuration files are now located inside sub-directory `/share/config` in order to avoid future filename conflicts.
  
  - Several improvements to logs, that now can also be saved to file.
  
  - Implementation of `soft-quota` feature, that will let you set the maximum allowed size of a shared folder.
  
  - Better error handling in `ConfigGen.js` library.
  
  - Several code rewrite that improved `easy-samba` overall stability.
  
- About version `2.0`:
  
  - It will be based on CentOS 8 (and SAMBA version `4.9.1`).
  
  - It will bring a completely-rewritten `ConfigGen.js` library (that will be probably named `ConfigGen2.js`). Maybe some beta versions will also ship with `easy-samba` version `1.x.x` for testing purposes.
  
  - When `easy-samba` version `2.0` comes out, `easy-samba` version `1.x.x` will switch to long-term branch. Version `1.x.x` has evolved a lot in the past months and now is a much more mature and complete product, suitable for small production.
  
  - Also, `easy-samba` version `2.0` will focus much more on enterprise features (like clustering, fault-tolerance, integration with LDAP and Active Directory).
  
  - Note that `easy-samba` version `2.0` will not be compatible with any feature that's been deprecated in version `1.x.x`.
  
- About new commit system:

  - Now commits will be named with this convention: `type-number` (e.g. `DOCS-23`). Where `type` specifies the type of commit, for example:
  
    - `DOCS`: documentation files have changed (e.g. `README.md`, `docs/DOCUMENTATION.md`, `docs/CHANGELOG.md`)
    
    - `REL`: new version of `easy-samba` has been released (e.g. `REL-STABLE-1.0.0`)
    
    - `CC`: code cleanup (i.e. changes that don't alter code behavior, but makes it more clear or correct)
    
    - `TYPO`: correction of language typos (e.g. a wrong variable name, a grammar error in a comment, ...)
    
    - `PERF`: performance fix (i.e. changes that don't alter overall code behavior, but makes it more performant)
    
    - `FIX`: bugfix (i.e. changes that alter code in order to fix unwanted behavior)
    
    - `SEC`: security fix (i.e. changes that alter code in order to fix unsafe behavior)
    
    - `NEW`: feature implementation (i.e. changes that add new functionalities to code)

### (2019-06-30 UTC) upcoming feature `EasySamba Remote API`
A new feature is under development, called `EasySamba Remote API`. It is an HTTPS-based API that will let you change `easy-samba`'s configuration through a remote API.

### (2019-05-31 UTC) roadmap update
New improvements are coming to `easy-samba` (probably in future version `1.5.0`):

- At the moment (`easy-samba` version `1.3.x`), one can create only one anonymous shared folder (setting `guest` property of `config.json` to the path of the anonymous shared folder). In the future, it will be possible to create multiple anonymous shared folders, using `shares` section of `config.json`: for example, `"shares": [{ "name": "folder1", "path": "/share/folder1", "access": ["rw:*"] }, { "name": "folder2", "path": "/share/folder2", "guest": "rw" }]` will create two shared folders: `folder1` is a regular shared folder (which every user can write and read), and `folder2` is an anonymous shared folder (that can be read and written without login).

- In `groups` section of `config.json`, `users` property will be renamed to `members`. Also in `ConfigGen.js` library, `config.groups.addUser()` and the other methods will be renamed to `config.groups.addMember()` etc. For example, `"groups": [{ "name": "group1", "users": ["user1", "user2"] }]` will become `"groups": [{ "name": "group1", "members": ["user1", "user2"] }]`.

### (2019-05-30 UTC) roadmap update
Today, `easy-samba` version `1.3.0` has been released, with two new important features: `config.gen.js` and `ConfigGen.js`. Documentation of these new features is almost complete.

In the next days, new improvements will be made to `ConfigGen.js` API, as well as other improvements to `easy-samba` itself:

- `guest` section of `config.json` will become optional. If a `guest` section is not present in `config.json`, `easy-samba` will assume that its value is `false`.

- Work is in progress about making `easy-samba` more responsive to configuration changes: at the moment (`easy-samba` version `1.3.x`), after you change some parameters in your `config.json` file, you need to stop the `easy-samba` container, and then start it again, in order to update `easy-samba`'s running configuration. This can take several seconds, and all the clients connected to your SAMBA server will probably get disconnected quickly. In the future, you will be able to edit the `config.json` file in your `easy-samba` container, and `easy-samba` will automatically update its configuration based on the new file (hoping that this will not disconnect your current clients).

- You'll also have the option to edit the `config.json` file through an always-running `config.gen.js` script: at the moment, `config.gen.js` script must terminate after it generated the new `config.json` file. In the future, your `config.gen.js` script will have also the possibility to never terminate, and constantly update the `config.json` file; and `easy-samba` will then constantly update its running configuration automatically.

### (2019-05-29 UTC) upcoming feature `ConfigGen`
An upcoming feature will be soon implemented (not sure in which future version of `easy-samba`), called `ConfigGen`.

`ConfigGen` is a simple stand-alone Javascript library, capable of generating a `config.json` configuration file dynamically, using Javascript as the scripting language. This will help automatizing and scripting repetitive operations in the writing of a `config.json` file.

More info will be released in the next days.

### (2019-05-29 UTC) roadmap for easy-samba 1.3
A list of planned features that are coming to `easy-samba` version 1.3:

- In the `groups` section of `config.json`, at the moment one can only specify usernames to be included in a group (e.g. `"groups": [{ "name": "group1", "users": ["user1", "user2", "user3"] }]`). In version 1.3 of `easy-samba`, it will be possible to also specify groups to be included in the group (e.g. `{ "name": "group2", "users": ["group1", "user4"] }` means that `group2` contains all the users in `group1` plus `user4`).

### (2019-05-12 UTC) roadmap for next versions of easy-samba
A list of improvements that are coming to `easy-samba` 1.2:

- It will be possible to restart a stopped container. At the moment (`easy-samba` 1.1.x), if you stop an `easy-samba`
container, you cannot start it again, but you have to remove it and you have to run a new `easy-samba` container.

- It will be possible to customize `[global]` section of `/etc/samba/smb.conf`, from within `easy-samba`'s `config.json`.

Planned improvements for `easy-samba` 2.0:

- Testing is in progress for using RHEL 8.0 as the container's OS. This is needed in order to prepare to migrate from CentOS 7 to CentOS 8, when the latter will be released. SAMBA version available in CentOS 7.6 is `4.8.3`, while in RHEL 8.0 is `4.9.1`. Migration from CentOS 7 to CentOS 8 is expected for `easy-samba` version 2.0.

- When `easy-samba` version 2.0 will be released, `easy-samba` 1.x.x will become the new long-term version.

- Since `easy-samba` version 1.x.x is going to be a long-term branch, some code cleanup has to be finished before the release of version 2.0. Also, documentation has to be finished, because there are still some missing chapters.

### (2019-04-24 UTC) preview of easy-samba 1.1
Stable version 1.1.0 of `easy-samba` will soon be released.
This version will bring a couple of new features to `access` property of shared folders:

- Wildcard `*`: you will be able to use `*` to specify that an access rule applies to all users.
For example: `["ro:*", "rw:user1"]` means that all users have read-only permissions on the shared folder,
except for `user1`, which also has write permissions.

- New permission `no:`: you will be able to specify a new type of permission on users and groups, i.e. `no:` permission.
When you place it before a username, a group name or wildcard `*`, it just means that the subject has no access at all to
the shared folder. For example: `["rw:group1", "ro:user1", "no:user2"]` means that all members of group `group1` have read
and write permissions on the shared folder, except for `user1`, which has read-only permissions, and for `user2`, which has no access at all.

