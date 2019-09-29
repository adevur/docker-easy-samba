

FROM adevur/centos-8:latest

MAINTAINER adevur (madavurro@protonmail.com)

RUN yum clean all -y \
  && yum update -y \
  && yum install -y \
    samba \
    samba-client \
    samba-common \
    openssl \
    psmisc \
    procps-ng \
  && yum module install -y nodejs \
  && yum autoremove -y \
  && yum clean all -y

COPY ./startup /startup

CMD ["node", "/startup/index.js"]

EXPOSE 137/udp 138/udp 139/tcp 445/tcp 9595/tcp


