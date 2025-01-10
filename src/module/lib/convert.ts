import { ProcessedTableEntry, SQLSafeTableEntry, TableEntry } from "./types";
import ExtendedType from "./extended";

/** Data types recognized by SQLite. */
export type SQLType =
  | "NULL"
  | "INTEGER"
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

/** Primative types that coralate to their SQLType. */
export type Primative<T extends SQLType> = T extends "NULL"
  ? null
  : T extends "INTEGER" | "REAL"
  ? number
  : T extends "CHAR(1)"
  ? boolean
  : string;

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
      return "INTEGER";
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

/**
 * Process all runtime (function-based) entries.
 *
 * @param entry The entry to process.
 * @returns The entry with all the data loaded.
 */
export function processTableEntry<T extends TableEntry>(
  entry: T
): ProcessedTableEntry<T> {
  const out: TableEntry = {};
  const keys = Object.keys(entry);

  for (const key of keys) {
    if (entry[key] instanceof ExtendedType) {
      out[key] = <ExtendedType>entry[key].set();
    } else {
      out[key] = entry[key];
    }
  }

  return <ProcessedTableEntry<T>>out;
}

/**
 * Helper to properly stringify a value for SQL.
 *
 * @param value The value to convert.
 * @returns An SQL-safe string representation.
 */
function stringifyValue(value: unknown): string {
  /** Cleans a string value. */
  const cleanStr = (value: string): string => `'${value.replace(/'/g, "\\'")}'`;

  switch (typeof value) {
    case "string":
      return cleanStr(value);
    case "boolean":
      return cleanStr(value ? "T" : "F");
    case "symbol":
      return cleanStr(
        value.description != null ? value.description : value.toString()
      );
    case "undefined":
      return "null";
    case "object":
      return cleanStr(JSON.stringify(value));
    default:
      return String(value);
  }
}

/**
 * Prepares an entry for being sent in a SQL query.
 *
 * @param entry The entry to prepare.
 * @returns An entry containing stringified values.
 */
export function prepareEntry<T extends TableEntry>(
  entry: T
): SQLSafeTableEntry<T> {
  const out: TableEntry = {};

  const keys = Object.keys(entry);

  for (const key of keys) {
    out[key] = stringifyValue(entry[key]);
  }

  return <SQLSafeTableEntry<T>>out;
}
