import { Database as DB, verbose } from "sqlite3";
import Table, { EntryData } from "./Table.js";
import { execOnDatabase, queryOnDatabase } from "./executor.js";
import { TableColumnSettings } from "./DatabaseTypes.js";

/** A Simple Database. */
export class Database {
  /** The SQLite Database instance to connect with. */
  private db: DB;
  /** The file path to the database, or "memory" if in-memory. */
  private path: string;

  /**
   * Constructs a Database.
   * @param file The path to the file of the database, or "memory" for an in-memory database.
   * @param useVerbose If this database should use the verbose version of `sqlite3`, defaults to `false`.
   */
  constructor(file: string, useVerbose: boolean = false) {
    this.path = file;
    const DBConstructor = useVerbose ? verbose().Database : DB;
    switch (file) {
      case "memory":
        this.db = new DBConstructor(":memory:");
        break;
      default:
        this.db = new DBConstructor(file);
        break;
    }
  }

  // Database Operations

  /**
   * Checks if a table exists on the Database.
   * @param table The name of the table.
   * @returns A promise that resolves to a boolean, or rejects if an error occurs.
   */
  public exists(table: string): Promise<boolean> {
    return this.table(table).exists();
  }

  /**
   * Gets a refrence to a Table.
   * @param table The name of the table.
   * @returns A Table instance to run operations with.
   */
  public table<T extends EntryData>(table: string): Table<T> {
    return new Table(this.db, table);
  }

  /**
   * Gets the names of all the tables of the database.
   * @returns All tables within the database.
   */
  public all(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      // SELECT name FROM sqlite_master WHERE type='table';

      queryOnDatabase<{ name: string }>(
        this.db,
        "SELECT name FROM sqlite_master WHERE type='table';"
      )
        .then((rows) => {
          const columns: string[] = [];

          for (const row of rows) {
            columns.push(row.name);
          }

          resolve(columns);
        })
        .catch(reject);
    });
  }

  /**
   * Creates a new table on the Database.
   * @param <T> The types of data within the table.
   * @param table The name of the table.
   * @param column_settings Definitions for the table columns.
   * @returns A promise that resolves into a Table instance, and rejects if an error occurs.
   */
  public create<T extends EntryData>(
    table: string,
    column_settings: TableColumnSettings[]
  ): Promise<Table<T>> {
    return new Promise((resolve, reject) => {
      this.exists(table)
        .then((exists) => {
          if (!exists) {
            // CREATE TABLE {table}({name} {type} {isPrimaryKey});

            // Check that there is exactly 1 key property.
            let seenKeyProperty = false;
            for (const column of column_settings) {
              if (column.isPrimaryKey != null && column.isPrimaryKey) {
                if (!seenKeyProperty) {
                  seenKeyProperty = true;
                } else {
                  reject(new Error("Too many key properties."));
                  return;
                }
              }
            }

            if (!seenKeyProperty) {
              reject(new Error("No key property."));
              return;
            }

            // Create the query
            let sqlQuery = `CREATE TABLE ${table}(`;
            for (let i = 0; i < column_settings.length; i++) {
              sqlQuery += `${column_settings[i].name} ${
                column_settings[i].type
              }${column_settings[i].isPrimaryKey ? " PRIMARY KEY" : ""}${
                i < column_settings.length - 1 ? ", " : ""
              }`;
            }
            sqlQuery += ");";

            execOnDatabase(this.db, sqlQuery)
              .then(() => {
                resolve(this.table<T>(table));
              })
              .catch(reject);
          } else reject(new Error("Table already exists."));
        })
        .catch(reject);
    });
  }

  /**
   * Drops a table from the Database.
   * @param table The name of the table.
   * @returns A promise that resolves when the table is dropped, and rejects if an error occurs.
   */
  public drop(table: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.exists(table)
        .then((exists) => {
          if (exists) {
            // DROP TABLE {table}
            execOnDatabase(this.db, `DROP TABLE ${table}`)
              .then(resolve)
              .catch(reject);
          } else reject(new Error("Table does not exist."));
        })
        .catch(reject);
    });
  }

  // Database Tools

  /**
   * Gets the SQLite3 Database instance.
   * @returns The instace that the Database uses.
   */
  public getSQLiteInstance(): DB {
    return this.db;
  }

  /**
   * Close the Database connection.
   * @returns A promise that resolves when the connection is closed.
   */
  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Gets a string representation of the database.
   * @returns A promise that resolves into a string, or rejects if an error occurs.
   */
  public toString(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.all()
        .then((tables) => {
          resolve(`Database{path=${this.path},tables=[${tables.join(",")}]}`);
        })
        .catch(reject);
    });
  }
}

// Export Default
export default Database;
