
# easy-samba news
Stay updated on `easy-samba` development.

### (2019-05-16 UTC) easy-samba 1.2.0 released (with new features)
Stable version 1.2.0 of `easy-samba` has been released.

This version brings new features to `easy-samba`.

Click [here](https://github.com/adevur/docker-easy-samba/blob/master/docs/CHANGELOG.md#stable-feature-120-2019-05-16-utc) for changelog.

### (2019-05-12 UTC) roadmap for next versions of easy-samba
A list of improvements that are coming to `easy-samba` 1.2:

- It will be possible to restart a stopped container. At the moment (`easy-samba` 1.1.x), if you stop an `easy-samba`
container, you cannot start it again, but you have to remove it and you have to run a new `easy-samba` container.

- It will be possible to customize `[global]` section of `/etc/samba/smb.conf`, from within `easy-samba`'s `config.json`.

Planned improvements for `easy-samba` 2.0:

- Testing is in progress for using RHEL 8.0 as the container's OS. This is needed in order to prepare to migrate from CentOS 7 to CentOS 8, when the latter will be released. SAMBA version available in CentOS 7.6 is `4.8.3`, while in RHEL 8.0 is `4.9.1`. Migration from CentOS 7 to CentOS 8 is expected for `easy-samba` version 2.0.

- When `easy-samba` version 2.0 will be released, `easy-samba` 1.x.x will become the new long-term version.

- Since `easy-samba` version 1.x.x is going to be a long-term branch, some code cleanup has to be finished before the release of version 2.0. Also, documentation has to be finished, because there are still some missing chapters.

### (2019-04-27 UTC) easy-samba 1.1.0 released (with new features)
Stable version 1.1.0 of `easy-samba` has been released.

This version brings new features to `easy-samba`.

Click [here](https://github.com/adevur/docker-easy-samba/blob/master/docs/CHANGELOG.md#stable-feature-110-2019-04-27-utc) for changelog.

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

### (2019-04-24 UTC) easy-samba 1.0.4 released
Stable version 1.0.4 of `easy-samba` has been released.

Click [here](https://github.com/adevur/docker-easy-samba/blob/master/docs/CHANGELOG.md#stable-104-2019-04-24-utc) for changelog.

### (2019-04-21 UTC) easy-samba 1.0.3 released
Happy Easter!

Stable version 1.0.3 of `easy-samba` has been released.

Click [here](https://github.com/adevur/docker-easy-samba/blob/master/docs/CHANGELOG.md#stable-103-2019-04-21-utc) for changelog.

### (2019-04-18 UTC) easy-samba 1.0.2 released (with security fixes)
Stable version 1.0.2 of `easy-samba` has been released.

This version brings security fixes, so it is advisable to update as soon as possible.

Click [here](https://github.com/adevur/docker-easy-samba/blob/master/docs/CHANGELOG.md#stable-security-102-2019-04-18-utc) for changelog.

### (2019-04-15 UTC) easy-samba 1.0.1 released
Stable version 1.0.1 of `easy-samba` has been released.

Click [here](https://github.com/adevur/docker-easy-samba/blob/master/docs/CHANGELOG.md#stable-101-2019-04-15-utc) for changelog.

### (2019-04-14 UTC) easy-samba 1.0.0 released
Stable version 1.0.0 of `easy-samba` has been released.

Click [here](https://github.com/adevur/docker-easy-samba/blob/master/docs/CHANGELOG.md#stable-100-2019-04-14-utc) for changelog.
