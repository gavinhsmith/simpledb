import { Database as Sqlite3Database, verbose } from "sqlite3";
import { Config, parseConfig } from "./Config";
import Table, { EntryData } from "./Table";
import { execOnDatabase, queryOnDatabase } from "./executor";
import { TableColumnSettings } from "./DatabaseTypes";

/** A Simple Database. */
export class Database {
  /** The SQLite Database instance to connect with. */
  private db: Sqlite3Database;
  /** The file path to the database, or "memory" if in-memory. */
  private path: string;
  /** The config that was given to the module. */
  private config: Config;

  /**
   * Constructs a Database.
   * @param file The path to the file of the database, or "memory" for an in-memory database.
   * @param config Config paramaters for the database.
   */
  constructor(file: "memory" | string, config: Config = {}) {
    // Config Setup
    this.config = parseConfig(config);

    // Set Path
    this.path = file;

    // Pick which sqlite to use.
    const DBConstructor = config.verbose ? verbose().Database : Sqlite3Database;

    // Initiate DB
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
  public table<T extends { [key: string]: unknown }>(table: string): Table<T> {
    return new Table(this.db, table);
  }

  /**
   * Gets the names of all the tables of the database.
   * @param filter A filter function that restricts the results.
   * @returns All tables within the database.
   */
  public tables(
    filter: (name: string) => boolean = () => true
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      // SELECT name FROM sqlite_master WHERE type='table';

      queryOnDatabase<{ name: string }>(
        this.db,
        "SELECT name FROM sqlite_master WHERE type='table';"
      )
        .then((rows) => {
          const columns: string[] = [];

          for (const row of rows) {
            if (filter(row.name)) columns.push(row.name);
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
   * @param columns Definitions for the table columns.
   * @returns A promise that resolves into a Table instance, and rejects if an error occurs.
   */
  public create<T extends EntryData>(
    table: string,
    columns: TableColumnSettings,
    primary_key: keyof T
  ): Promise<Table<T>> {
    return new Promise((resolve, reject) => {
      this.exists(table)
        .then((exists) => {
          if (!exists) {
            // CREATE TABLE {table}({name} {type} {isPrimaryKey});

            const column_names = Object.keys(columns);

            if (!column_names.includes(<string>primary_key)) {
              reject(new Error("Invalid key property."));
              return;
            }

            // Create the query
            let sqlQuery = `CREATE TABLE ${table}(`;
            for (let i = 0; i < column_names.length; i++) {
              sqlQuery += `${column_names[i]} ${columns[column_names[i]]}${
                primary_key === column_names[i] ? " PRIMARY KEY" : ""
              }${i < column_names.length - 1 ? ", " : ""}`;
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
   * Gets the SQLite3 Database instance. Mostly used for testing.
   * @returns The instace that the Database uses.
   */
  public getSQLiteInstance(): Sqlite3Database {
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
      this.tables()
        .then((tables) => {
          resolve(`Database{path=${this.path},tables=[${tables.join(",")}]}`);
        })
        .catch(reject);
    });
  }
}

// Export Default
export default Database;
