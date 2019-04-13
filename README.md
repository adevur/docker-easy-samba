# easy-samba
This image provides an easy-to-setup SAMBA server, based on CentOS 7.

### Short description
This SAMBA server takes a JSON configuration file as input and, based on that file, it sets up the container's environment. For example, here's what you can do:

1) Write a configuration file, where:

  - there are two users (`user1` and `user2`);

  - there are two shared folders (`/share/public` and `/share/user2`);

  - `/share/public` can be read and written by anyone;

  - `/share/user2`, instead, can be accessed only by `user2`.

2) After writing this configuration file, you start the docker image `adevur/easy-samba`.

3) This image reads your configuration file, creates the two users, creates the folders (if they don't exist), and then configure their filesystem permissions accordingly to your configuration file.

4) Now you can connect to your container using Windows or any other SAMBA client.

### Tags
Available tags:

- Latest stable release (1.0.0): `latest`.

- Latest long-term release (1.0.0): `lts`.

- Latest development release: `devel`.

See also chapters `Versioning` and `Branches` for more info.

### Versioning
Versions are in this format: `x.y.z`. Where:

- `x` is a major release, and when it gets updated it may break compatibility with older major releases; so that you could be forced to change your software after this update.

- `y` is a minor release, and when it gets updated it adds new features, but it maintains compatibility with the major release; so you're not obliged to change your software after this update (unless you want to take advantage of the new features, of course).

- `z` is a bugfix release, and when it gets updated it brings bug-fixes and security fixes; so you're not obliged to change your software after this update.

### Branches
There are three branches: `stable`, `long-term` and `development`. Where:

- `stable` is the latest stable major release. It can be used in production, but it's more likely to have bugs since it brings new features more often.

- `long-term` is the latest long-term release. It is based on a previous major release than the one in `stable` branch; it only gets bug-fixes and security fixes, since new features are more likely to be introduced in `stable` branch. You may want to use `long-term` in production, if you don't need latest features of `stable` branch.

- `development` is the development branch based on current `stable` major release (or a future major release). It gets updated very often, and it can have several bugs since it has not been deeply tested yet. When a new feature has matured enough, it gets merged in `stable` branch. If a bug gets fixed, it gets merged both in `stable` and `long-term` branches.

### Building
To build a stable release, run:
```sh
docker build --tag=easy-samba:latest ./stable/latest
```

To build a long-term release, run:
```sh
docker build --tag=easy-samba:lts ./long-term/latest
```

To build a development release, run:
```sh
docker build --tag=easy-samba:devel ./development
```

To build a specific release, run (for example):
```sh
docker build --tag=easy-samba:1.0.0 ./stable/1.0.0
```

### Usage
In order to use this image, you can have a look at the `Tutorial`.

If you need more information for advanced use, have a look at the `Documentation`.

