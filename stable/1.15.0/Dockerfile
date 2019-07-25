

FROM centos:7

MAINTAINER adevur (madavurro@protonmail.com)

RUN (curl -sL https://rpm.nodesource.com/setup_10.x | bash -) \
  && yum clean all -y \
  && yum update -y \
  && yum install -y \
    samba \
    samba-client \
    samba-common \
    nodejs \
    openssl \
    psmisc \
  && yum autoremove -y \
  && yum clean all -y \
  && npm install npm --global

COPY ./startup /startup

CMD ["node", "/startup/index.js"]

EXPOSE 137/udp 138/udp 139/tcp 445/tcp 9595/tcp


