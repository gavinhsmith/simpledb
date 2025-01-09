/** Data types recognized by SQLite. */
export type SQLType =
  | "NULL"
  | "INTENGER"
  | "REAL"
  | "TEXT"
  | "BLOB"
  | `CHAR(${number})`;

/** Possible data types for the Database. Includes raw types. */
export type DataType =
  | "string"
  | "int"
  | "float"
  | "boolean"
  | "null"
  | SQLType;

/**
 * Gets the SQLite type from either a simple type or another SQLite type.
 * @param type The type to load.
 * @returns A type compatable with SQLite.
 */
export function getSQLType(type: DataType): SQLType {
  switch (type) {
    case "string":
      return "TEXT";
    case "int":
      return "INTENGER";
    case "float":
      return "REAL";
    case "boolean":
      return "CHAR(1)";
    case "null":
      return "NULL";
    default:
      return type;
  }
}
