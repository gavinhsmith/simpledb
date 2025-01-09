/** Different data types for the Database. */
export type DataType =
  | "NULL"
  | "INTENGER"
  | "REAL"
  | "TEXT"
  | "BLOB"
  | `CHAR(${number})`;

/** Table entries. */
export type TableEntry = { [key: string]: unknown };

/** Properly stringified table entries. */
export type CleanTableEntry<T extends TableEntry> = StringifiedObject<T>;

/** Table columns and their type. */
export type TableColumns<T extends TableEntry> = {
  [Prop in keyof T as string]: DataType;
};

/** A object thats elements have been stringified. */
export type StringifiedObject<T extends object> = {
  [Prop in keyof T]: string;
};
