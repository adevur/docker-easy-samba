# EasySamba Security Advisory Center
This document contains useful information about `easy-samba` security and known vulnerabilities.

An `easy-samba` security vulnerability is named `ESV-#` (where `#` is the counter, e.g. `ESV-1`).

## List of security vulnerabilities

- [ESV-1](https://github.com/adevur/docker-easy-samba/blob/master/SECURITY.md#ESV-1)

- [ESV-2](https://github.com/adevur/docker-easy-samba/blob/master/SECURITY.md#ESV-2)

- [ESV-3](https://github.com/adevur/docker-easy-samba/blob/master/SECURITY.md#ESV-3)

## ESV-3

### Status: `FIXED` (in version `1.18.1`)
### Affected versions: `1.17.0`, `1.17.1`, `1.18.0`
### Severity: `MODERATE`

### Description
In `easy-samba` versions `1.17.0`-`1.18.0`, `Remote API` feature `certificate-negotiation` makes an improper use of `AES-256-CTR` encryption algorithm.

`certificate-negotiation` feature is used (for example, in `ConfigGen.js` library) in order to automatically get the remote container's HTTPS certificate (and not manually supply one). When a remote client wants to retrieve the remote container's certificate, it sends a request to the `Remote API` server (i.e. `easy-samba`), and the server replies with the certificate encrypted using the secret token as password. This way, the remote client can verify if the certificate is authentic, by decrypting the latter with the secret token.

### Severity
Severity is moderate, because an attacker may eavesdrop the communication between a remote client and the `easy-samba` container, and in some way may be able to pass a malevolent certificate to the remote client and thus steal the secret token.

In practice, since the encrypted content is not confidential (`Remote API` certificate is public), this security vulnerability should not be harmful.

No case of successful exploit is known.

### Fixes and workarounds
The only available fix is to update `easy-samba` to version `1.18.1` or newer.

If you are not able to update `easy-samba` and/or remote client's `ConfigGen.js` library, you should stop using `certificate-negotiation` feature, by manually passing the container's certificate to `ConfigGen.remote()` function.

> SEE ALSO: [changelog of `easy-samba` version `1.18.1`](https://github.com/adevur/docker-easy-samba/blob/master/docs/CHANGELOG.md#stable-security-1181-2019-08-26-utc)

## ESV-2

### Status: `FIXED` (in version `1.17.0`)
### Affected versions: from `1.11.0` to `1.16.1`
### Severity: `MODERATE`

### Description
In `easy-samba` versions `1.11.0`-`1.16.1`, `Remote API` implementation unsafely checks the token sent by a remote client.

### Severity
Severity is moderate, because an attacker may perform a timing attack in order to steal the secret token of `Remote API`. If the token gets stolen, the attacker may get access to confidential data, and may cause denial of service in several ways.

No case of successful exploit is known.

### Fixes and workarounds
The only available fix is to update `easy-samba` to version `1.17.0` or newer.

## ESV-1

### Status: `FIXED` (in version `1.0.2`)
### Affected versions: `1.0.0`, `1.0.1`
### Severity: `LOW`

### Description
First versions of `easy-samba` didn't check `password` property of users defined in `config.json` file. Since `easy-samba` passes `password` property as stdin to Linux command `passwd` during users creation phase, this is a potential security vulnerability.

### Severity
Severity is low enough, because an attacker that is able to malevolently modify a `password` property in `config.json` file has also `root` privilege. Since the attacker has already `root` privilege, they can cause more serious damage directly, without the need of exploit `password` property.

### Fixes and workarounds
The only available fix is to update `easy-samba` to version `1.0.2` or newer.
