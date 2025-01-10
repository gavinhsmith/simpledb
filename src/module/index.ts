/**
 * @module simpledb
 *
 * A node module for creating/managing easy-access SQLite databases.
 *
 * @author gavinhsmith
 */

import Database from "./lib/database";
import ET from "./lib/extended";

export type ExtendedType = ET;
export const ExtendedType = ET;

export default Database;
