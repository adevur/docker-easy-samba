
# easy-samba news
Stay updated on `easy-samba` development.

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
