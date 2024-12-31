import Database from "./Database.js";
import DBTable from "./Table.js";
import DBColumn from "./Column.js";
import {
  DataType as DBTDT,
  TableColumnSettings as DBTTCS,
} from "./DatabaseTypes.js";

export type DataType = DBTDT;
export type TableColumnSettings = DBTTCS;

export default Database;
export const Table = DBTable;
export const Column = DBColumn;
