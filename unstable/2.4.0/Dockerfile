

FROM docker.io/adevur/centos-8:latest

LABEL org.label-schema.schema-version = "1.0" \
    org.label-schema.name = "easy-samba" \
    org.label-schema.description = "SAMBA server based on CentOS 8, easy to set up." \
    org.label-schema.license = "MIT" \
    org.label-schema.version = "2.4.0" \
    org.label-schema.url = "https://hub.docker.com/r/adevur/easy-samba" \
    org.label-schema.vcs-url = "https://github.com/adevur/docker-easy-samba" \
    maintainer = "adevur (madavurro@protonmail.com)"

RUN yum clean all -y \
  && yum update -y \
  && yum install -y \
    samba \
    samba-client \
    samba-common \
    openssl \
    psmisc \
    procps-ng \
    openldap-clients \
  && yum module install -y nodejs \
  && yum autoremove -y \
  && yum clean all -y

COPY ./startup /startup

CMD ["node", "/startup/index.js"]

EXPOSE 137/udp 138/udp 139/tcp 445/tcp 9595/tcp


