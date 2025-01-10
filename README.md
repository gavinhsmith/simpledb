# simpledb

A node module for creating/managing easy-access SQLite databases.

[![NPM Version](https://img.shields.io/npm/v/%40gavinhsmith%2Fsimpledb?style=flat-square&label=NPM%20Version&labelColor=cc3838&color=f0f0f0)](https://www.npmjs.com/package/@gavinhsmith/simpledb)
[![NPM Downloads](https://img.shields.io/npm/d18m/%40gavinhsmith%2Fsimpledb?style=flat-square&label=NPM%20Downloads&labelColor=cc3838&color=f0f0f0)](https://www.npmjs.com/package/@gavinhsmith/simpledb)
[![License](https://img.shields.io/github/license/gavinhsmith/simpledb?style=flat-square&label=Licence&color=f0f0f0)](https://github.com/gavinhsmith/simpledb?tab=MIT-1-ov-file)

## Install

Install `simpledb` via your favorite package manager.

### [NPM](https://www.npmjs.com/package/@gavinhsmith/simpledb)

```shell
npm install @gavinhsmith/simpledb
```

### [Yarn](https://yarnpkg.com/package?name=%40gavinhsmith%2Fsimpledb)

```shell
yarn add @gavinhsmith/simpledb
```

## Usage

TypeDoc Files can be found at the [API Docs](https://gavinhsmith.github.io/simpledb/).

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

Module can be configed in the `Database` constructor.

```ts
const db = new Database("file.db", {
  verbose: true,
  types: ExtendedType.DATES;
});
```

### Config Options

| Config Option |              Type               | Default |                                   Description                                    |
| :-----------: | :-----------------------------: | :-----: | :------------------------------------------------------------------------------: |
|   _verbose_   |            `boolean`            | `false` |   Enables sqlite3.verbose() and enables verbose logging throughout the module.   |
|    _types_    | `{[key: string]: ExtendedType}` |  `{}`   | Exteneded types that allow extra functionallity beyond the regular Sqlite types. |

## Contributing

Clone the repository, and run `npm i` or `yarn` to install the dependancies and build the module. Run module tests via the `test` script in package.json.

Workflow tests require [act](https://github.com/nektos/act). You **do not need** this for module development, as workflow tests are not run during CI.

I'll review pull requests in time.
