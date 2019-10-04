

FROM docker.io/centos:7

LABEL org.label-schema.schema-version = "1.0" \
    org.label-schema.name = "easy-samba" \
    org.label-schema.description = "SAMBA server based on CentOS 7, easy to set up." \
    org.label-schema.license = "MIT" \
    org.label-schema.version = "1.x.x" \
    org.label-schema.url = "https://hub.docker.com/r/adevur/easy-samba" \
    org.label-schema.vcs-url = "https://github.com/adevur/docker-easy-samba" \
    maintainer = "adevur (madavurro@protonmail.com)"

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


