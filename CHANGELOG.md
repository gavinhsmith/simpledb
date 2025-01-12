## v1.2.2: Added `Database.update()`

> Full Changelog: [1.2.1 -> 1.2.2](https://github.com/gavinhsmith/simpledb/compare/1.2.1...1.2.2)

Added `Database.update(column: string, equals: unknown, replacements: Partial<Entry>): Promise<Entry[]>`, allowing updates on the database. Returns a list of all affected rows.

## Old Releases

### v1.2.1: Patch release

> Full Changelog: [1.2.0 -> 1.2.1](https://github.com/gavinhsmith/simpledb/compare/1.2.0...1.2.1)

Fixed issue with workflow publishing wrong directory.

### v1.2.0: Major module refactor.

> Full Changelog: [1.0.8 -> 1.2.0](https://github.com/gavinhsmith/simpledb/compare/1.0.8...1.2.0)

**THIS IS A BREAKING CHANGE**

I added sherif to the eslint config, and many many hundreds of things broke. I fixed all of them I think.

#### Breaking Changes

- `Database` and `Table` are now functions, not a class, Do not use `new` keyword.
- `Column` class was removed, column operations can be done with the table.
- `Database.exists()` has been renamed to `Database.has()`.
- `Table.exists()` has been renamed to `Table.has()`. No longer can be run without paramaters to check for table.
- Extended types have been removed. I might re-implement them later, but at the moment they were clunky and bad.

### v1.0.8

> Full Changelog: [1.0.7 -> 1.0.8](https://github.com/gavinhsmith/simpledb/compare/1.0.7...1.0.8)

### v1.0.7

> Full Changelog: [1.0.6 -> 1.0.7](https://github.com/gavinhsmith/simpledb/compare/1.0.6...1.0.7)

### v1.0.6

> Full Changelog: [1.0.5 -> 1.0.6](https://github.com/gavinhsmith/simpledb/compare/1.0.5...1.0.6)

### v1.0.5

> Full Changelog: [1.0.4 -> 1.0.5](https://github.com/gavinhsmith/simpledb/compare/1.0.4...1.0.5)

### v1.0.4

> Full Changelog: [1.0.3 -> 1.0.4](https://github.com/gavinhsmith/simpledb/compare/1.0.3...1.0.4)

### v1.0.3

> Full Changelog: [1.0.2 -> 1.0.3](https://github.com/gavinhsmith/simpledb/compare/1.0.2...1.0.3)

### v1.0.2

> Full Changelog: [1.1.1-2 -> 1.0.2](https://github.com/gavinhsmith/simpledb/compare/1.1.1-2...1.0.2)

### Alpha Versions

> Full Changelog: [1.1.1-2](https://github.com/gavinhsmith/simpledb/commits/1.1.1-2)
