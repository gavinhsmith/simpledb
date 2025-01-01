/**
 * @module simpledb
 *
 * A node module for creating/managing easy-access SQLite databases.
 *
 * @author gavinhsmith
 */

// Imports
import DBDatabase from "./lib/Database.js";
import DBTable from "./lib/Table.js";
import DBColumn from "./lib/Column.js";
import {
  DataType as DBTDT,
  TableColumnSettings as DBTTCS,
} from "./lib/DatabaseTypes.js";

// Exports
export type DataType = DBTDT;
export type TableColumnSettings = DBTTCS;

export const Database = DBDatabase;
export const Table = DBTable;
export const Column = DBColumn;

// Export Default
export default Database;
