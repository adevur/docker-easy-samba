# ESV (EasySamba Vulnerabilities) Database

## List of security vulnerabilities

- [ESV-1](https://github.com/adevur/docker-easy-samba/blob/master/SECURITY.md#ESV-1)

- [ESV-2](https://github.com/adevur/docker-easy-samba/blob/master/SECURITY.md#ESV-2)

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
