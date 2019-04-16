
# easy-samba tutorial
This tutorial will get you started with `adevur/easy-samba` docker image. It will show you how this docker image works, and how to get a simple SAMBA server quickly started.

### let's begin
1) Choose a folder in your computer where you will work. For example:
    ```sh
    mkdir /nas
    ```

2) Now you must create a directory where all your shared folders will be located (and where also `adevur/easy-samba`'s configuration file will be located). For example:
    ```sh
    mkdir /nas/share
    ```

3) Let's create our configuration file: it must be named `config.json` and it must be in JSON format. Now create the file with your favorite text editor:
    ```sh
    nano /nas/share/config.json
    ```

4) Put this sample configuration in the file:
    ```json
    {
        "domain": "WORKGROUP",
        "guest": false,
        "users": [
            { "name": "user1", "password": "123456" }
        ],
        "shares": [
            { "name": "folder1", "path": "/share/folder1", "access": ["user1"] }
        ]
    }
    ```

5) Let's analyze what this configuration file means:

    - This file is a JSON object with 4 properties: `domain`, `guest`, `users` and `shares`.

    - `domain` property is a string that tells `easy-samba` what it will be the domain name of the SAMBA server.

    - `guest` property in this case is a `false` boolean that tells `easy-samba` that no anonymous login will be available in the SAMBA server.

    - `users` property is an array containing all the users of the SAMBA server. Every user is an object with `name` (the username) and `password` (the user's password) properties.
    The password `123456` will be used by `user1` when they will try to login to the SAMBA server.

    - `shares` property is an array containing all the shared folders of our SAMBA server. Every element of `shares` is an object with `name` (a name to identify the shared folder),
    `path` (the path on disk of the shared folder) and `access` (an array that contains all the "access rules" for the shared folder) properties.

    > NOTE ON PATH: the path of a shared folder must be a sub-directory of `/share`. `/share` is just the location (inside the container) where our `/nas/share` folder (that we created earlier) will be mounted.
    So, `/share/folder1` is `/nas/share/folder1` on our disk; and `/nas/share/config.json` will be seen as `/share/config.json` by the container.

    > NOTE ON ACCESS RULES: access rule `["user1"]` just means that `user1` has both read and write permissions on `folder1` shared folder.
    For example, if we had written `["user1", "ro:user2"]`, instead, it would have meant that `user1` has read-write permissions, but `user2` has only read permissions.

    > SEE ALSO: [`config.json` section of Documentation](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#configjson).

6) Now that we have our configuration file ready, we can start the SAMBA server itself:
    ```sh
    docker run --rm -d --network host -v /nas/share:/share --name samba adevur/easy-samba:latest
    ```

7) Let's analyze what this command means:

    - `docker run`: we tell docker to run a container.

    - `--rm`: we tell docker that when this container stops, it should be automatically removed.
    This parameter is useful, since when an `easy-samba` container stops, it cannot be restarted,
    and the only thing you can do is to remove it.

    - `-d`: we tell docker that this container should be started in the background as a daemon.

    - `--network host`: we tell docker that the container should be able to see our computer's networks.
    This parameter can also be changed to `--network bridge` or any other `--network` option.
    
      > SEE ALSO: [`networking` section of Documentation](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#networking).

    - `-v /nas/share:/share`: we tell docker to mount our local folder `/nas/share` so that the container will see it as `/share`.

    - `--name samba`: we tell docker that the container will be named `samba`.
    This parameter is optional and you can choose whatever name you want for your container.

    - `adevur/easy-samba:latest`: we tell docker that the image we want to use is `adevur/easy-samba` with tag `latest`
    (that in this case is the latest stable release of `adevur/easy-samba`).

    > SEE ALSO: [`docker options` section of Documentation](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#docker-options).

8) Okay, now we have started our `easy-samba` container. But how do we check if everything went well?
    Run this command (in this case `samba` is just the name of the container that we chose earlier):
    ```sh
    docker logs samba
    ```

9) You're not going to be explained in detail what the logs mean, but just make sure that the final line says:
    ```
    [LOG] SAMBA server is now ready.
    ```

    > NOTE: you may want not to use `--rm` parameter in `docker run` command: this way, if an error occurs, the container won't be removed
    and you will be able to use command `docker logs samba` in order to see the logs of the stopped container.

    > SEE ALSO: [`understanding logs` section of Documentation](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#understanding-logs).

10) Now we can connect to the container's SAMBA server using a SAMBA client (for example, Windows' File Explorer).

11) If you used option `--network host` earlier, you may connect to the container using your computer's IP address.
Just remember to disable your computer's firewall, first.

12) If your computer's IP address is `192.168.1.10`, you can open a File Explorer window in Windows,
and then type `\\192.168.1.10\folder1` in the address bar.
Windows will ask you for a username and a password, and they are `user1` and `123456`,
as we specified in the `config.json` file earlier.

13) Every file or folder that you create or change in the shared folder, will be permanently saved on your computer's disk
at location `/nas/share/folder1`. So, next time you start `easy-samba` container, it will just re-use the existing folder.
Even if you edit the `config.json` configuration file and you change the shared folder's path to something else,
your `/nas/share/folder1` directory will be left untouched.

### now what?
For further information about all the configuration options of `config.json`,
and for more info about how to set up networking,
you should read the [`Documentation`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md).

