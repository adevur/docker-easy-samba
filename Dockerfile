

FROM adevur/centos-nodejs:lts

MAINTAINER adevur (madavurro@protonmail.com)

RUN yum clean all -y \
  && yum update -y \
  && yum install -y \
    samba \
    samba-client \
    samba-common \
  && yum autoremove -y \
  && yum clean all -y

COPY ./startup /startup

CMD ["node", "/startup/index.js"]

EXPOSE 137/udp 138/udp 139/tcp 445/tcp

