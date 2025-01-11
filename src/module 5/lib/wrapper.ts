import { Database as SQLiteDatabase, verbose } from "sqlite3";

/** Structure for query paramaters. In the form of `$key: any`. */
export type Paramaters = {
  [key: `$${string}`]: unknown;
} | null;

/** Function to construct the SQLite wrapper. */
export type SqliteWrapperBuilder = (
  file: string,
  useVerbose: boolean,
) => SqliteWrapper;

/** A wrapper around sqlite for clean up use. */
export type SqliteWrapper = {
  /**
   * Gets the instance of sqlite3 being used.
   *
   * @returns The internal instance of the sqlite3 Database.
   */
  readonly getInstance: () => SQLiteDatabase;

  /**
   * Execute a query on the database, does not return any data.
   *
   * @param sql - The SQL query to execute.
   * @param params - Paramaters to inject. Uses `$name` format in SQL, so use `{ $key: replacement }`.
   * @returns A promise that resolves when completed, or rejects if an error occurs.
   */
  readonly exec: (sql: string, params?: Paramaters) => Promise<void>;

  /**
   * Execute a query on the database, returns all fetched data.
   *
   * @param ResponseType - The expected data in an entry.
   * @param sql - The SQL query to execute.
   * @param params - Paramaters to inject. Uses `$name` format in SQL.
   * @returns A promise that resolves into the requested rows, or rejects if an error occurs.
   */
  readonly query: <ResponseType>(
    sql: string,
    params?: Paramaters,
  ) => Promise<ResponseType[]>;

  /**
   * Cancel the current operation if one exists and shut down the database.
   *
   * @returns A promise that always resolves when done. May contain an error in paramater, but will not reject.
   */
  readonly close: () => Promise<Error | null>;
};

/**
 * Constructs a new SqliteWrapper.
 *
 * @param file - The file to hook the database into. If `memory` or `disk` uses an non-persistant database in the respective location.
 * @param useVerbose - If the verbose version of sqlite should be used.
 * @returns A usable sqlite wrapper.
 */
export const makeWrapper: SqliteWrapperBuilder = (file, useVerbose) => {
  if (useVerbose) {
    verbose();
  }

  let filePath;

  switch (file) {
    case "memory": {
      filePath = ":memory:";
      break;
    }
    case "disk": {
      filePath = "";
      break;
    }
    default: {
      filePath = file;
      break;
    }
  }

  const instance = new SQLiteDatabase(filePath);

  const getInstance = () => instance;

  const exec: SqliteWrapper["exec"] = (sql, params) => {
    return new Promise((resolve, reject) => {
      instance.run(sql, params ?? {}, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  };

  const query: SqliteWrapper["query"] = <ResponseType>(
    sql: string,
    params: Paramaters | undefined,
  ): Promise<ResponseType[]> => {
    return new Promise((resolve, reject) => {
      instance.all(sql, params ?? {}, (error, rows) => {
        if (error) {
          reject(error);
        } else {
          resolve(rows as ResponseType[]);
        }
      });
    });
  };

  const close: SqliteWrapper["close"] = () => {
    return new Promise((resolve) => {
      instance.interrupt();
      instance.close(resolve);
    });
  };

  return { getInstance, exec, query, close };
};
