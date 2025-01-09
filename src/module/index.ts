/**
 * @module simpledb
 *
 * A node module for creating/managing easy-access SQLite databases.
 *
 * @author gavinhsmith
 */

import Database from "./lib/database";

export * from "./lib/database";
export * from "./lib/table";
export * from "./lib/column";

export default Database;
