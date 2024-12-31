import Database from "./lib/Database.js";
import DBTable from "./lib/Table.js";
import DBColumn from "./lib/Column.js";
import {
  DataType as DBTDT,
  TableColumnSettings as DBTTCS,
} from "./lib/DatabaseTypes.js";

export type DataType = DBTDT;
export type TableColumnSettings = DBTTCS;

export default Database;
export const Table = DBTable;
export const Column = DBColumn;
