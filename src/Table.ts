import { Database as DB } from "sqlite3";
import { execOnDatabase, queryOnDatabase } from "./executor";
import Column, { ColumnSearcherFunction } from "./Column";
import { DataType } from "./DatabaseTypes";
import { rejects } from "assert";

/** The base type of entry data types. */
export type EntryData = { [key: string]: any };

/** A Table within a Database. */
export default class Table<T extends EntryData> {
  /** The SQLite instance to utilize. */
  private db: DB;
  /** The name of the table. */
  private name: string;

  /**
   * Constructs a Table.
   * @param sql The SQLite3 reference from the Database.
   * @param name The name of the table.
   */
  constructor(sql: DB, name: string) {
    this.db = sql;
    this.name = name;
  }

  // Table Operations

  /**
   * Checks if the table/a column exists.
   * @param column The column to check, will check if the table exists if left blank.
   * @returns A promise that resolves if it exists, and rejects if it does not.
   */
  public exists(column?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // No Column: SELECT name FROM sqlite_master WHERE type='table' AND name='{table}';
      // Column: See Column.exists().

      if (column != null) {
        return this.column(column).exists();
      } else {
        queryOnDatabase(
          this.db,
          "SELECT name FROM sqlite_master WHERE type='table' AND name=(?);",
          this.name
        )
          .then((rows) => {
            if (rows.length >= 1) {
              resolve();
            } else {
              reject(new Error("Table does not exist."));
            }
          })
          .catch(reject);
      }
    });
  }

  /**
   * Gets a Column instance from the table.
   * @param <T> The type of data that is in the column.
   * @param column The name of the column.
   * @returns An instance that can do operations.
   */
  public column<K>(column: string): Column<K, T> {
    return new Column(this.db, column, this);
  }

  /**
   * Gets the names of all the columns of the table.
   * @returns All columns within the table.
   */
  public all(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      // SELECT name FROM pragma_table_info({table});

      queryOnDatabase(
        this.db,
        `SELECT name FROM pragma_table_info('${this.name}');`
      )
        .then((rows: { name: string }[]) => {
          let columns: string[] = [];

          for (let row of rows) {
            columns.push(row.name);
          }

          resolve(columns);
        })
        .catch(reject);
    });
  }

  /**
   * Creates a new column on the table.
   * @param <T> The type of data that is in the column.
   * @param column The name of the column.
   * @param type The DataType of the column.
   * @returns A promise that resolves into a Column instance, or rejects if an error occurs.
   */
  public create<K>(column: string, type: DataType): Promise<Column<K, T>> {
    return new Promise((resolve, reject) => {
      this.exists(column)
        .then(() => {
          reject(new Error("Column already exists."));
        })
        .catch((_error) => {
          // ALTER TABLE {table} ADD COLUMN {name} {type};

          execOnDatabase(
            this.db,
            `ALTER TABLE ${this.name} ADD COLUMN ${column} ${type};`
          )
            .then(() => {
              resolve(this.column<K>(column));
            })
            .catch(reject);
        });
    });
  }

  /**
   * Drops a column from the table.
   * @param column The name of the column.
   * @returns A promise that resolves when the column is dropped, or rejects if an error occured.
   */
  public drop(column: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.exists(column)
        .then(() => {
          // ALTER TABLE {table} DROP COLUMN {name};

          execOnDatabase(
            this.db,
            `ALTER TABLE ${this.name} DROP COLUMN ${column};`
          )
            .then(() => {
              resolve();
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  // Table Data Operations

  /**
   * Gets all entries in the table.
   * @returns A promise that resolves into all table entries, or rejects if an error occurs.
   */
  public allEntries(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      // SELECT * FROM {table};

      queryOnDatabase(this.db, `SELECT * FROM ${this.name}`)
        .then((rows: T[]) => {
          resolve(rows);
        })
        .catch(reject);
    });
  }

  /**
   * Gets entries from the table that are "approved" by the searcher.
   * @param searcher A method that verifies that an entry should be included in the result.
   * @returns A promise that resolves into the requested table entries, or rejects if an error occurs.
   */
  public get(searcher: ColumnSearcherFunction<T>): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.allEntries()
        .then((rows) => {
          let out: T[] = [];

          for (let row of rows) {
            if (searcher(row)) out.push(row);
          }

          resolve(out);
        })
        .catch(reject);
    });
  }

  /**
   * Adds a new entry to the table.
   * @param entry The entry data to add.
   * @returns A promise that resolves into the added data, or rejects if an error occurs.
   */
  public add(entry: T): Promise<T> {
    return new Promise((resolve, reject) => {
      let keys: string[] = Object.keys(entry);
      let values: string[] = [];

      for (let key of keys) {
        switch (typeof entry[key]) {
          case "string":
            values.push(`'${entry[key]}'`);
            break;
          case "boolean":
            values.push(entry[key] ? "'T'" : "'F'");
            break;
          default:
            values.push(entry[key]);
            break;
        }
      }

      // INSERT INTO {table} ({...columns}) VALUES ({...values});

      execOnDatabase(
        this.db,
        `INSERT INTO ${this.name} (${keys.join(",")}) VALUES (${values.join(
          ","
        )});`
      )
        .then(() => {
          resolve(entry);
        })
        .catch(reject);
    });
  }

  /**
   * Deletes all entries from the table where a key equals a value.
   * @param column The column in which to check the data from.
   * @param value The value in which to look for.
   * @returns A promise that resolves when successful, or rejects if an error occurs.
   */
  public delete(column: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      // DELETE FROM {table} WHERE {column} = {value};

      execOnDatabase(
        this.db,
        `DELETE FROM ${this.name} WHERE ${column} = ${value};`
      )
        .then(resolve)
        .catch(reject);
    });
  }

  // Table Tools

  /**
   * Gets the Table name.
   * @returns The name of the table.
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Gets a string representation of the table.
   * @returns A promise that resolves into a string, or rejects if an error occurs.
   */
  public toString(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.all()
        .then((columns) => {
          resolve(`Table{name=${this.name},columns=[${columns.join(",")}]}`);
        })
        .catch(reject);
    });
  }
}
