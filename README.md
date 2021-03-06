# easy-samba
This docker image provides an easy-to-setup SAMBA server, based on CentOS 8.

### quick links
- [Official GitHub repository `adevur/docker-easy-samba`](https://github.com/adevur/docker-easy-samba)

- [Official DockerHub repository `adevur/easy-samba`](https://hub.docker.com/r/adevur/easy-samba)

- [Tutorial](https://github.com/adevur/docker-easy-samba/blob/master/docs/TUTORIAL.md)

- [Documentation](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md)

- [Changelog](https://github.com/adevur/docker-easy-samba/blob/master/docs/CHANGELOG.md)

- [News](https://github.com/adevur/docker-easy-samba/blob/master/NEWS.md)

- [Security and known vulnerabilities](https://github.com/adevur/docker-easy-samba/blob/master/SECURITY.md)

### short description
This SAMBA server takes a JSON configuration file as input and, based on that file, it sets up the container's environment. For example, here's what you can do:

1) Write a configuration file, where:

    - there are two users (`user1` and `user2`);

    - there are two shared folders (`/share/public` and `/share/user2`);

    - `/share/public` can be read and written by anyone;

    - `/share/user2`, instead, can be accessed only by `user2`.

2) After writing this configuration file, you start the docker image `adevur/easy-samba`.

3) This image reads your configuration file, creates the two users, creates the folders (if they don't exist), and then configure their filesystem permissions accordingly to your configuration file.

4) Now you can connect to your container using Windows or any other SAMBA client.

> See also the [`Tutorial`](https://github.com/adevur/docker-easy-samba/blob/master/docs/TUTORIAL.md) in order to get started.

### tags
Available tags:

- Latest unstable release (2.4.0): [`latest`](https://github.com/adevur/docker-easy-samba/blob/master/unstable/latest/Dockerfile).

  > NOTE: `latest` tag works for `amd64`, `arm64v8` and `ppc64le` architectures; however, you can also use tags `latest-amd64`, `latest-arm64v8` and `latest-ppc64le`, if you need to download a specific architecture.

- Latest stable release (1.19.1): [`stable`](https://github.com/adevur/docker-easy-samba/blob/master/stable/latest/Dockerfile).

  > NOTE: at the moment, stable branch (i.e. `easy-samba` version `1.x.x`) only supports `amd64` architecture. Tag `stable-amd64` is also available as an alias for `stable`.

- Latest long-term release (none at the moment): `lts`. This tag cannot be used yet since there is no long-term release at the moment.

> See also chapters [`Versioning`](https://github.com/adevur/docker-easy-samba/blob/master/README.md#versioning)
and [`Branches`](https://github.com/adevur/docker-easy-samba/blob/master/README.md#branches) for more info.

> If you're looking for version history and changelogs, take a look at the [`Changelog`](https://github.com/adevur/docker-easy-samba/blob/master/docs/CHANGELOG.md).

### versioning
Versions are in this format: `x.y.z`. Where:

- `x` is a major release, and when it gets updated it may break compatibility with older major releases; so that you could be forced to change your software after this update.

- `y` is a minor release, and when it gets updated it adds new features, but it maintains compatibility with the major release; so you're not obliged to change your software after this update (unless you want to take advantage of the new features, of course).

- `z` is a bugfix release, and when it gets updated it brings bug-fixes and security fixes; so you're not obliged to change your software after this update.

### branches
There are three branches: `unstable`, `stable` and `long-term`. Where:

- `unstable` is the latest unstable release. It is not recommended for use in production, because it brings new features more often, and these features are not finalized: they could change in the future and, if you use them, you would be forced to change your software.

- `stable` is the latest stable release. It can be used in production, because it brings new features less often, only when they're already finalized and stable.

- `long-term` is the latest long-term release. It is based on a previous major release than the one in `stable` and `unstable` branches; it only gets bugfixes and security fixes, since new features are only introduced in `stable` and `unstable` branches. You may want to use `long-term` in production, if you don't need latest features of `stable` branch.

### building
- To build latest unstable release, run:
  ```sh
  docker build --tag local/easy-samba:latest ./unstable/latest
  ```

- To build latest stable release, run:
  ```sh
  docker build --tag local/easy-samba:stable ./stable/latest
  ```

- To build a specific release, run (for example):
  ```sh
  docker build --tag local/easy-samba:1.0.0 ./stable/1.0.0
  ```

### usage
In order to use this image, you can have a look at the [`Tutorial`](https://github.com/adevur/docker-easy-samba/blob/master/docs/TUTORIAL.md).

If you need more information for advanced use, have a look at the [`Documentation`](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md).

