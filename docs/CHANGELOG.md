
# easy-samba changelog
Version history and changelogs of `adevur/easy-samba` docker image.

### Current stable release: `1.2.0`

### Current long-term release: `no long-term release yet`

## version history

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

