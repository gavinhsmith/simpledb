import type { Database as SQLiteDatabase } from "sqlite3";
import { type Config, parseConfig } from "./config";
import { getSQLType } from "./convert";
import { Table } from "./table";
import type { FilterFunction, TableColumns, TableEntry } from "./types";
import { makeWrapper, type SqliteWrapper } from "./wrapper";

/** Function to construct a database. */
export type DatabaseBuilder = (
  file: string,
  config: Partial<Config>,
) => Database;

export type Database = {
  // Database Operations

  /**
   * Checks if a table exists on the Database.
   *
   * @param table - The name of the table.
   * @returns A promise that resolves to a boolean, or rejects if an error occurs.
   */
  readonly has: (table: string) => Promise<boolean>;

  /**
   * Gets a refrence to a Table.
   *
   * @param T - The table entry data.
   * @param table - The name of the table.
   * @returns A Table instance to run operations with.
   */
  readonly table: <T extends TableEntry>(name: string) => Table<T>;

  /**
   * Gets references to all the tables of the database.
   *
   * @param filter - A filter function that restricts the results.
   * @returns All tables within the database.
   */
  readonly tables: (
    filter?: FilterFunction<string>,
  ) => Promise<Table<TableEntry>[]>;

  /**
   * Creates a new table on the Database.
   *
   * @param T - The types of data within the table.
   * @param name - The name of the table.
   * @param columns - Definitions for the table columns.
   * @param primary_key - The primary key for this table.
   * @returns A promise that resolves into a Table instance, and rejects if an error occurs.
   */
  readonly create: <T extends TableEntry>(
    name: string,
    columns: TableColumns<T>,
    primary_key: keyof T,
  ) => Promise<Table<T>>;

  /**
   * Drops a table from the Database.
   *
   * @param table - The name of the table.
   * @returns A promise that resolves when the table is dropped, and rejects if an error occurs.
   */
  readonly drop: (table: string) => Promise<void>;

  // Database Tools

  /**
   * Gets the SQLite3 instance. Mostly used for testing.
   *
   * @returns The instace that the Database uses.
   */
  readonly getSQLiteInstance: () => SQLiteDatabase;

  /**
   * Close the Database connection.
   *
   * @returns A promise that resolves when the connection is closed.
   */
  readonly close: () => Promise<void>;

  /**
   * Gets a string representation of the database.
   *
   * @returns A promise that resolves into a string, or rejects if an error occurs.
   */
  readonly toString: () => Promise<string>;
};

/**
 * Loads a database, or creates one if it did not already exist.
 *
 * @param file - The file to hook the database into. If `memory` or `disk` uses an non-persistant database in the respective location.
 * @param config - Configuration options for the Database.
 * @returns An instance hooked into your database.
 */
export const Database: DatabaseBuilder = (file, config) => {
  // Construct constants.

  const conf = parseConfig(config);
  const db: SqliteWrapper = makeWrapper(file, conf.verbose);

  // Construct methods.

  const has: Database["has"] = (tableName) => {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=$name;",
        { $name: tableName },
      )
        .then((rows) => {
          resolve(rows.length > 0);
        })
        .catch(reject);
    });
  };

  const table: Database["table"] = (name) => Table(db, name);

  const tables: Database["tables"] = (filter) => {
    return new Promise((resolve, reject) => {
      // Query: SELECT name FROM sqlite_master WHERE type='table';

      db.query<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table';",
      )
        .then((rows) => {
          const allTables: Table<TableEntry>[] = [];

          for (const row of rows) {
            if (filter === undefined || filter === "ALL" || filter(row.name)) {
              allTables.push(table(row.name));
            }
          }

          resolve(allTables);
        })
        .catch(reject);
    });
  };

  const create: Database["create"] = (name, columns, primaryKey) => {
    return new Promise((resolve, reject) => {
      has(name)
        .then((exists) => {
          if (exists) {
            reject(new Error(`Table "${name}" already exists.`));
          } else {
            // Query: CREATE TABLE {table}({name} {type} {isPrimaryKey});

            const columnNames = Object.keys(columns);

            if (!columnNames.includes(primaryKey as string)) {
              reject(new Error("Invalid key property."));

              return;
            }

            // Create the query
            let sqlQuery = `CREATE TABLE ${name}(`;

            let isFirstEntry = true;

            for (const columnName of columnNames) {
              sqlQuery = `${sqlQuery}${isFirstEntry ? "" : ", "}${columnName} ${getSQLType(
                columns[columnName],
              )}${primaryKey === columnName ? " PRIMARY KEY" : ""}`;
              isFirstEntry = false;
            }
            sqlQuery = `${sqlQuery});`;

            db.exec(sqlQuery)
              .then(() => {
                resolve(table(name));
              })
              .catch(reject);
          }
        })
        .catch(reject);
    });
  };

  const drop: Database["drop"] = (tableName) => {
    return new Promise((resolve, reject) => {
      has(tableName)
        .then((exists) => {
          if (exists) {
            // Query: DROP TABLE {table};
            db.exec(`DROP TABLE ${tableName};`).then(resolve).catch(reject);
          } else {
            reject(new Error(`Table "${tableName}" does not exist.`));
          }
        })
        .catch(reject);
    });
  };

  const getSQLiteInstance: Database["getSQLiteInstance"] = () =>
    db.getInstance();

  const close: Database["close"] = () => {
    return new Promise((resolve) => {
      db.close()
        .then((error) => {
          if (error) {
            console.warn(error);
          }
          resolve();
        })
        .catch(() => {
          // Won't ever happen. Resolves anywhere.
          resolve();
        });
    });
  };

  const toString: Database["toString"] = () => {
    return new Promise((resolve, reject) => {
      tables()
        .then((allTables) => {
          resolve(
            `Database{path=${file},tables=[${allTables.length > 1 ? "\n\t" : ""}${allTables.join(",\n\t")}${allTables.length > 1 ? "\n" : ""}]}`,
          );
        })
        .catch(reject);
    });
  };

  return {
    has,
    table,
    tables,
    create,
    drop,
    getSQLiteInstance,
    close,
    toString,
  };
};
