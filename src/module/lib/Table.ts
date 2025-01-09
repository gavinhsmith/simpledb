import { Database } from "sqlite3";
import { execOnDatabase, queryOnDatabase } from "./executor";
import Column, { ColumnSearcherFunction } from "./Column";
import { DataType, TableEntry, StringifiedObject } from "./types";

/** A Table within a Database. */
export class Table<T extends TableEntry> {
  /** The SQLite instance to utilize. */
  private db: Database;
  /** The name of the table. */
  private name: string;

  /**
   * Constructs a Table.
   * @param sql The SQLite3 reference from the Database.
   * @param name The name of the table.
   */
  constructor(sql: Database, name: string) {
    this.db = sql;
    this.name = name;
  }

  // Table Operations

  /**
   * Checks if the table/a column exists.
   * @param column The column to check, will check if the table exists if left blank.
   * @returns A promise that resolves to a boolean, or rejects if an error occurs.
   */
  public exists(column?: string): Promise<boolean> {
    // No Column: SELECT name FROM sqlite_master WHERE type='table' AND name='{table}';
    // Column: See Column.exists().

    if (column != null) {
      return this.column(column).exists();
    } else {
      return new Promise((resolve, reject) => {
        queryOnDatabase(
          this.db,
          "SELECT name FROM sqlite_master WHERE type='table' AND name=(?);",
          this.name
        )
          .then((rows) => {
            resolve(rows.length >= 1);
          })
          .catch(reject);
      });
    }
  }

  /**
   * Gets a Column instance from the table.
   * @param <K> The type of data that is in the column.
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

      queryOnDatabase<{ name: string }>(
        this.db,
        `SELECT name FROM pragma_table_info('${this.name}');`
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
   * Creates a new column on the table.
   * @param <K> The type of data that is in the column.
   * @param column The name of the column.
   * @param type The DataType of the column.
   * @returns A promise that resolves into a Column instance, or rejects if an error occurs.
   */
  public create<K>(column: string, type: DataType): Promise<Column<K, T>> {
    return new Promise((resolve, reject) => {
      this.exists(column)
        .then((exists) => {
          if (!exists) {
            // ALTER TABLE {table} ADD COLUMN {name} {type};

            execOnDatabase(
              this.db,
              `ALTER TABLE ${this.name} ADD COLUMN ${column} ${type};`
            )
              .then(() => {
                resolve(this.column<K>(column));
              })
              .catch(reject);
          } else reject(new Error("Column already exists."));
        })
        .catch(reject);
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
        .then((exists) => {
          if (exists) {
            // ALTER TABLE {table} DROP COLUMN {name};

            execOnDatabase(
              this.db,
              `ALTER TABLE ${this.name} DROP COLUMN ${column};`
            )
              .then(() => {
                resolve();
              })
              .catch(reject);
          } else {
            reject(new Error("Column does not exist."));
          }
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

      queryOnDatabase<T>(this.db, `SELECT * FROM ${this.name}`)
        .then((rows) => {
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
          const out: T[] = [];

          for (const row of rows) {
            if (searcher(row)) out.push(row);
          }

          resolve(out);
        })
        .catch(reject);
    });
  }

  /**
   * Internal helper to properly stringify a value for SQL.
   * @private
   *
   * @param value The value to convert.
   * @returns A string representation.
   */
  private stringifyValue(value: unknown): string {
    const cleanStr = (value: string): string =>
      `'${value.replace(/'/g, "\\'")}'`;

    switch (typeof value) {
      case "string":
        return cleanStr(value);
      case "boolean":
        return cleanStr(value ? "T" : "F");
      case "object":
        return cleanStr(JSON.stringify(value));
      case "function":
        return cleanStr(String(value()));
      case "symbol":
        return cleanStr(
          value.description != null ? value.description : value.toString()
        );
      case "undefined":
        return "null";
      default:
        return String(value);
    }
  }

  /**
   * Internal helper to stringify an object's data for SQL.
   * @private
   *
   * @param entry The object to stringify.
   * @returns An object containing strings.
   */
  private stringifyObject<K extends { [key: string]: unknown }>(
    object: K
  ): StringifiedObject<K> {
    const out: { [key: string]: string } = {};

    const keys = Object.keys(object);

    for (const key of keys) {
      out[key] = this.stringifyValue(object[key]);
    }

    return <StringifiedObject<K>>(<unknown>out);
  }

  /**
   * Adds a new entry to the table.
   * @param entry The entry data to add.
   * @returns A promise that resolves into the added data, or rejects if an error occurs.
   */
  public add(entry: T): Promise<T> {
    console.info(this.stringifyObject(entry));

    return new Promise((resolve, reject) => {
      const keys: string[] = Object.keys(entry);
      const values: string[] = [];

      for (const key of keys) {
        switch (typeof entry[key]) {
          case "string":
            values.push(`"${entry[key].replace(/"/g, '\\"')}"`);
            break;
          case "boolean":
            values.push(entry[key] ? "'T'" : "'F'");
            break;
          default:
            values.push(String(entry[key]));
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
  public delete(column: string, value: unknown): Promise<void> {
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

// Export Default
export default Table;
