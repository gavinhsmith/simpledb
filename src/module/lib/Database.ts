import SqliteWrapper from "./wrapper";
import { Config, parseConfig } from "./config";
import Table from "./table";
import { TableEntry, TableColumns, FilterFunction } from "./types";
import { getSQLType } from "./convert";

/** A Simple Database. */
export class Database {
  /** The SQLite Database instance to connect with. */
  private readonly db: SqliteWrapper;
  /** The file path to the database, or "memory" if in-memory. */
  private readonly path: string;
  /** The config that was given to the module. */
  private readonly config: Config;

  /**
   * Constructs a Database.
   * @param file The path to the file of the database, or "memory" for an in-memory database.
   * @param config Config paramaters for the database.
   */
  constructor(file: "memory" | "disk" | string, config: Partial<Config> = {}) {
    // Config Setup
    this.config = parseConfig(config);

    // Set Path
    this.path = file;

    this.db = new SqliteWrapper(file, this.config.verbose);
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
   * @param <T> The table entry data.
   * @param table The name of the table.
   * @returns A Table instance to run operations with.
   */
  public table<T extends TableEntry>(table: string): Table<T> {
    return new Table(this.db, table, this.config.types);
  }

  /**
   * Gets references to all the tables of the database.
   * @param filter A filter function that restricts the results.
   * @returns All tables within the database.
   */
  public tables(
    filter: FilterFunction<string> = "ALL"
  ): Promise<Table<TableEntry>[]> {
    return new Promise((resolve, reject) => {
      // SELECT name FROM sqlite_master WHERE type='table';

      this.db
        .query<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type='table';"
        )
        .then((rows) => {
          const tables: Table<TableEntry>[] = [];

          for (const row of rows) {
            if (filter === "ALL" || filter(row.name))
              tables.push(this.table(row.name));
          }

          resolve(tables);
        })
        .catch(reject);
    });
  }

  /**
   * Creates a new table on the Database.
   * @param <T> The types of data within the table.
   * @param name The name of the table.
   * @param columns Definitions for the table columns.
   * @param primary_key The primary key for this table.
   * @returns A promise that resolves into a Table instance, and rejects if an error occurs.
   */
  public create<T extends TableEntry>(
    name: string,
    columns: TableColumns<T>,
    primary_key: keyof T
  ): Promise<Table<T>> {
    return new Promise((resolve, reject) => {
      this.exists(name)
        .then((exists) => {
          if (!exists) {
            // CREATE TABLE {table}({name} {type} {isPrimaryKey});

            const column_names = Object.keys(columns);

            if (!column_names.includes(<string>primary_key)) {
              reject(new Error("Invalid key property."));
              return;
            }

            // Create the query
            let sqlQuery = `CREATE TABLE ${name}(`;
            for (let i = 0; i < column_names.length; i++) {
              sqlQuery += `${column_names[i]} ${getSQLType(
                columns[column_names[i]]
              )}${primary_key === column_names[i] ? " PRIMARY KEY" : ""}${
                i < column_names.length - 1 ? ", " : ""
              }`;
            }
            sqlQuery += ");";

            this.db
              .exec(sqlQuery)
              .then(() => {
                resolve(this.table<T>(name));
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
            this.db.exec(`DROP TABLE ${table}`).then(resolve).catch(reject);
          } else reject(new Error("Table does not exist."));
        })
        .catch(reject);
    });
  }

  // Database Tools

  /**
   * Gets the SQLite3 instance. Mostly used for testing.
   * @returns The instace that the Database uses.
   */
  public getSQLiteInstance() {
    return this.db.getInstance();
  }

  /**
   * Close the Database connection.
   * @returns A promise that resolves when the connection is closed.
   */
  public close(): Promise<void> {
    return new Promise((resolve) => {
      this.db.close().then((error) => {
        if (error) console.warn(error);
        resolve();
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
