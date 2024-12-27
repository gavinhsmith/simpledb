/** Different data types for the Database. */
export type DataType =
  | "NULL"
  | "INTENGER"
  | "REAL"
  | "TEXT"
  | "BLOB"
  | `CHAR(${number})`;

/** Settings for a table column. */
export interface TableColumnSettings {
  name: string;
  type: DataType;
  isPrimaryKey?: boolean;
}
