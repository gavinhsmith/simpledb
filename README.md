# simpledb

A node module for creating/managing easy-access SQLite databases.

![NPM Version](https://img.shields.io/npm/v/%40gavinhsmith%2Fsimpledb?style=flat-square&label=NPM%20Version&labelColor=cc3838&color=f0f0f0)
![NPM Downloads](https://img.shields.io/npm/d18m/%40gavinhsmith%2Fsimpledb?style=flat-square&label=NPM%20Downloads&labelColor=cc3838&color=f0f0f0)
![License](https://img.shields.io/github/license/gavinhsmith/simpledb?style=flat-square&label=Licence&color=f0f0f0)

## Install

Install shutdown via your favorite package manager.

### NPM

```shell
npm install @gavinhsmith/simpledb
```

### Yarn

```shell
yarn add @gavinhsmith/simpledb
```

## Usage

Include in your project create a new instace of the Database class.

```ts
// Import the module.
import Database from "@gavinhsmith/simpledb";

// Load the database.
const db = new Database("file.db");

// Qeury the database.
db.table("users").allEntries().then((entries) => {...});
```

## Config

Module can be configed in the `Database` constructor. Currently there are no config options.

```ts
// Config will look like this when done.

const db = new Database("file.db", {...});
```

## Contributing

Clone the repository, and run `npm i` or `yarn` to install the dependancies and build the module. Run module tests via the `test` script in package.json.

Workflow tests require [act](https://github.com/nektos/act). You **do not need** this for module development, as workflow tests are not run during CI.

I'll review pull requests in time.
