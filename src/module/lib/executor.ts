import sqlite3 from "sqlite3";

/**
 * Executes a query on a Database.
 * @param db The SQLite database to query.
 * @param sql The SQL query to send.
 * @param paramaters Any query paramaters to send.
 * @returns A promise which resolves if successful, or rejects if an error occured.
 */
export function execOnDatabase(
  db: sqlite3.Database,
  sql: string,
  ...paramaters: unknown[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, paramaters, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Query a Database for information.
 * @param <T> The type of data that will be returned from the query.
 * @param db The SQLite database to query.
 * @param sql The SQL query to send.
 * @param paramaters Any query paramaters to send.
 * @returns A promise contains an array of the requested data, or rejects if an error occured.
 */
export function queryOnDatabase<T>(
  db: sqlite3.Database,
  sql: string,
  ...paramaters: unknown[]
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, paramaters, (error, rows: T[]) => {
      if (error) {
        reject(error);
      } else {
        resolve(rows);
      }
    });
  });
}
