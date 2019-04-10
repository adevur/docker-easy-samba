# easy-samba
This image provides an easy-to-setup SAMBA server, based on CentOS 7.

### Building
To build, run:
```sh
docker build --tag=easy-samba:latest .
```

### Usage
1) To use this SAMBA server, you must create a directory in your filesystem where the configuration file and your shares will be placed.
For example: `/home/john/samba-share`

2) Now, write a config file named `config.json`. You can find documentation about this file in the next chapter, `Configuration file`.

3) Run this command to start the server: `docker run --rm -d --network host -v /home/john/samba-share:/share --name samba adevur/easy-samba:latest`

4) Now you can connect with a SAMBA client!

### Configuration file
The configuration file is located at `/home/john/samba-share/config.json` and it will be mounted inside the container as `/share/config.json`.

This file is a simple JSON file with three main sections: `domain`, `users` and `shares`.

1) `domain` is the workgroup name. By default its value is "WORKGROUP".

2) `users` is an array that contains all the users of the SAMBA server. An element of this array looks like this:
```json
{ "name": "user1", "password": "123456" }
```

3) `shares` is an array that contains the shares of your server. You must write which users can access a specific share. An element of this array looks like this:
```json
{ "name": "public", "path": "/share/public", "users": ["user1", "user2"] }
```

4) Finally, our sample `config.json` file will look like this:
```json
{
  "domain": "WORKGROUP",
  "users": [
    { "name": "user1", "password": "123456" },
    { "name": "user2", "password": "aaabbb" }
  ],
  "shares": [
    { "name": "public", "path": "/share/public", "users": ["user1", "user2"] },
    { "name": "user1", "path": "/share/user1", "users": ["user1"] },
    { "name": "user2", "path": "/share/user2", "users": ["user2"] }
  ]
}
```

5) When `easy-samba` starts up,
a Node.js script located at `/startup/index.js` reads the configuration file `/share/config.json`,
it creates all the users in the container (using both `useradd` and `smbpasswd -a`),
it creates all the shares under `/share` (if they do not exist already)
and sets their ACLs for improved user-access security,
the script then generates a `/etc/samba/smb.conf` file to be used by the SAMBA server itself.

6) Our `config.json`, for example, will generate this `/etc/samba/smb.conf`:
```
[global]
workgroup = WORKGROUP
security = user

[public]
path = /share/public
browsable = yes
writable = yes
read only = no
guest ok = no
valid users = user1 user2

[user1]
path = /share/user1
browsable = yes
writable = yes
read only = no
guest ok = no
valid users = user1

[user2]
path = /share/user2
browsable = yes
writable = yes
read only = no
guest ok = no
valid users = user2
```
