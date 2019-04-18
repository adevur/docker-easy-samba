
# easy-samba changelog
Version history and changelogs of `adevur/easy-samba` docker image.

### Current stable release: `1.0.2`

### Current long-term release: `no long-term release yet`

## version history

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

