
# easy-samba advanced tutorials collection
This is a collection of several tutorials, that will teach you how to use `easy-samba`. There are 2 categories: `config.json` and `ConfigGen.js`.

> NOTE: it is recommended that you first read [`easy-samba quick-start tutorial`](https://github.com/adevur/docker-easy-samba/blob/master/docs/TUTORIAL.md). It is also recommended that you take a look at the [Documentation](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md) while reading these tutorials, in order to better take advantage of all the topics.

Here's the list of tutorials:

- Category `config.json`:

  - how to write basic configuration files

  - how to use `groups`

  - how to use `ro:` and `no:` access rules

  - how to create guest (anonymous) shares

- Category `ConfigGen.js`:

  - how to write basic `config.gen.js` files

  - how to manage users

  - how to manage groups

  - how to manage shared folders

  - how to create guest (anonymous) shared folders

  - how to use `config.shares.setFixedRules()`

  - how to handle events

## category `ConfigGen.js`

### how to write basic `config.gen.js` files
In this tutorial we're going to create a simple `config.gen.js` file. 

> SEE ALSO: [`config.gen.js` chapter of Documentation](https://github.com/adevur/docker-easy-samba/blob/master/docs/DOCUMENTATION.md#configgenjs).

This file is a Javascript script, and its purpose is to write a `config.json` file in a dynamic way. You put this file in the same directory where you would put a `config.json` file (i.e. the directory that will be mounted as `/share` inside the container); when `easy-samba` starts, and it sees that `config.json` file is missing, it will execute command `node /share/config.gen.js`. Executing your `config.gen.js` script should create a valid `/share/config.json` file (that will then be used by `easy-samba` itself).

In order to write `config.gen.js` scripts, we're going to use a library, embedded in `easy-samba` containers, named `ConfigGen.js`, and located at path `/startup/ConfigGen.js` inside the container. This library (that is a one-file stand-alone Javascript library) gives us several functions that simplify the writing of `config.json` files.

Let's start creating the directory that we will later mount inside the container as `/share`:
```sh
mkdir /nas/share
```

Now, let's create our `config.gen.js` script:
```sh
nano /nas/share/config.gen.js
```

Put this sample code in it:
```js
// we first include ConfigGen.js library in our script
const ConfigGen = require("/startup/ConfigGen.js");

// then we create a new configuration
const config = new ConfigGen();

// we modify that configuration, for example, setting the domain
config.domain("WORKGROUP");

// we also create a new user with name "user1" and password "123456"
config.users.add("user1", "123456");

// and then we add a new shared folder with name "folder1", path "/share/folder1" and that is writable and readable by every user
config.shares.add("folder1", "/share/folder1", ["rw:*"]);

// we can finally write our "config.json" file
config.saveToFile("/share/config.json");
```

If we run `easy-samba`, we'll see that our script has been executed, and that this is the content of newly-generated `/nas/share/config.json` file:
```json
{
    "domain": "WORKGROUP",
    "users": [
        { "name": "user1", "password": "123456" }
    ],
    "shares": [
        { "name": "folder1", "path": "/share/folder1", "access": ["rw:*"] }
    ]
}
```




