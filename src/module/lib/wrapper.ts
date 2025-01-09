import { Database as SQLiteDatabase, verbose } from "sqlite3";

/** Paramaters for a query. */
type Paramaters = { [key: `$${string}`]: unknown };

/** A wrapper around sqlite for clean up use. */
export default class SqliteWrapper {
  /** The sqlite Database instance. */
  private readonly instance: SQLiteDatabase;

  /**
   * @param file The file to hook the database into. If `memory` or `disk` uses an non-persistant database in the respective location.
   * @param useVerbose If the verbose version of sqlite should be used.
   */
  constructor(file: "memory" | "disk" | string, useVerbose: boolean) {
    // Let verbose if needed.
    if (useVerbose) verbose();

    // Initiate DB
    this.instance = new SQLiteDatabase(
      file === "memory" ? ":memory:" : file === "disk" ? "" : file
    );
  }

  /**
   * Gets the instance of sqlite3 we are using.
   * @returns An sqlite3 Database.
   */
  getInstance() {
    return this.instance;
  }

  /**
   * Execute a query on the database, does not return any data.
   * @param sql The SQL query to execute.
   * @param paramaters Paramaters to inject. Uses `$name` format in SQL.
   * @returns A promise that resolves when completed, or rejects if an error occurs.
   */
  exec(sql: string, paramaters: Paramaters = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      this.instance.run(sql, paramaters, function (error: Error) {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Execute a query on the database, returns all fetched data.
   * @param sql The SQL query to execute.
   * @param paramaters Paramaters to inject. Uses `$name` format in SQL.
   * @returns A promise that resolves into the requested rows, or rejects if an error occurs.
   */
  query<T>(sql: string, paramaters: Paramaters = {}): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.instance.all(sql, paramaters, function (error: Error, results: T[]) {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Cancel the current operation if one exists and shut down the database.
   * @returns A promise that resolves when done.
   */
  close(): Promise<Error | null> {
    return new Promise((resolve) => {
      this.instance.interrupt();
      this.instance.close(function (error: Error | null) {
        resolve(error);
      });
    });
  }
}
