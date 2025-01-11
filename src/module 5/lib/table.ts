import {
  type DataType,
  getSQLType,
  prepareEntry,
  processTableEntry,
  stringifyValue,
} from "./convert";
import type {
  FilterFunction,
  ProcessedTableEntry,
  RestrictedTableEntry,
  TableEntry,
  TableEntryKeys,
} from "./types";
import type { SqliteWrapper } from "./wrapper";

export type Table<TableType extends TableEntry> = {
  /**
   * Checks if a column exists.
   *
   * @param column - The column to check.
   * @returns A promise that resolves to a boolean, or rejects if an error occurs.
   */
  readonly has: (column: string) => Promise<boolean>;

  /**
   * Gets a list of all columns in the table.
   *
   * @returns A promise that resolves into a string array, or rejects if an error occurs.
   */
  readonly columns: () => Promise<string[]>;

  /**
   * Creates a new column on the table.
   *
   * @param column - The name of the column.
   * @param type - The DataType of the column.
   * @returns A promise that resolves when the column is created, or rejects if an error occurs.
   */
  readonly create: (column: string, type: DataType) => Promise<void>;

  /**
   * Drops a column from the table.
   *
   * @param column - The name of the column.
   * @returns A promise that resolves when the column is dropped, or rejects if an error occured.
   */
  readonly drop: (column: string) => Promise<void>;

  /**
   * Gets all entries in the table.
   *
   * @param FetchedColumns - The list of column keys avaliable.
   * @param columns - A list of columns to get. Defaults to all columns if empty.
   * @returns A promise that resolves into all table entries, or rejects if an error occurs.
   */
  readonly all: <FetchedColumns extends TableEntryKeys<TableEntry>>(
    ...columns: FetchedColumns[]
  ) => Promise<RestrictedTableEntry<TableType, FetchedColumns>[]>;

  /**
   * Gets entries from the table.
   *
   * @param FetchedColumns - The list of column keys avaliable.
   * @param columns - A list of columns to get. Defaults to all columns if empty.
   * @param filter - The predefined filter tag or filter function to use. Defaults to `"ALL"`.
   * @returns A promise that resolves into the requested table entries, or rejects if an error occurs.
   */
  readonly get: <FetchedColumns extends TableEntryKeys<TableEntry>>(
    columns: FetchedColumns[],
    filter?: FilterFunction<RestrictedTableEntry<TableType, FetchedColumns>>,
  ) => Promise<RestrictedTableEntry<TableType, FetchedColumns>[]>;

  /**
   * Adds a new entry to the table.
   *
   * @param entry - The entry data to add.
   * @returns A promise that resolves into the added data, or rejects if an error occurs.
   */
  readonly add: (entry: TableType) => Promise<ProcessedTableEntry<TableType>>;

  /**
   * Deletes all entries from the table where a key equals a value.
   *
   * @param column - The column in which to check the data from.
   * @param value - The value in which to look for.
   * @returns A promise that resolves when successful, or rejects if an error occurs.
   */
  readonly delete: (column: string, value: unknown) => Promise<void>;

  /**
   * Gets a string representation of the table.
   *
   * @returns A promise that resolves into a string, or rejects if an error occurs.
   */
  readonly toString: () => Promise<string>;
};

/**
 * Constructs a Table.
 *
 * @param wrapper - The SQLite3 reference from the Database.
 * @param name - The name of the table.
 */
export const Table = <TableType extends TableEntry>(
  wrapper: SqliteWrapper,
  name: string,
): Table<TableType> => {
  const has: Table<TableType>["has"] = (column) => {
    return new Promise((resolve, reject) => {
      wrapper
        .query<{ CNTREC: number }>(
          "SELECT COUNT(*) AS CNTREC FROM pragma_table_info($table) WHERE name=$value;",
          {
            $table: name,
            $column: column,
          },
        )
        .then((rows) => {
          resolve(rows[0].CNTREC >= 1);
        })
        .catch(reject);
    });
  };

  const columns: Table<TableType>["columns"] = () => {
    return new Promise((resolve, reject) => {
      // SELECT name FROM pragma_table_info({table});

      wrapper
        .query<{ name: string }>(
          `SELECT name FROM pragma_table_info('${name}');`,
        )
        .then((rows) => {
          const cols: string[] = [];

          for (const row of rows) {
            cols.push(row.name);
          }

          resolve(cols);
        })
        .catch(reject);
    });
  };

  const create: Table<TableType>["create"] = (column, type) => {
    return new Promise((resolve, reject) => {
      has(column)
        .then((exists) => {
          if (exists) {
            reject(new Error("Column already exists."));
          } else {
            // ALTER TABLE {table} ADD COLUMN {name} {type};

            wrapper
              .exec(
                `ALTER TABLE ${name} ADD COLUMN ${column} ${getSQLType(type)};`,
              )
              .then(() => {
                resolve();
              })
              .catch(reject);
          }
        })
        .catch(reject);
    });
  };

  const drop: Table<TableType>["drop"] = (column) => {
    return new Promise((resolve, reject) => {
      has(column)
        .then((exists) => {
          if (exists) {
            // ALTER TABLE {table} DROP COLUMN {name};

            wrapper
              .exec(`ALTER TABLE ${name} DROP COLUMN ${column};`)
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
  };

  const all: Table<TableType>["all"] = <
    FetchedColumns extends TableEntryKeys<TableEntry>,
  >(
    ...cols: FetchedColumns[]
  ): Promise<RestrictedTableEntry<TableType, FetchedColumns>[]> => {
    return new Promise((resolve, reject) => {
      // SELECT {columns} FROM {table};

      wrapper
        .query<RestrictedTableEntry<TableType, FetchedColumns>>(
          `SELECT ${cols.length === 0 ? "*" : cols.join(",")} FROM ${name};`,
        )
        .then((rows) => {
          resolve(rows);
        })
        .catch(reject);
    });
  };

  const get: Table<TableType>["get"] = <
    FetchedColumns extends TableEntryKeys<TableEntry>,
  >(
    cols: FetchedColumns[],
    filter:
      | FilterFunction<RestrictedTableEntry<TableType, FetchedColumns>>
      | undefined,
  ): Promise<RestrictedTableEntry<TableType, FetchedColumns>[]> => {
    return new Promise((resolve, reject) => {
      all(...cols)
        .then((rows) => {
          const out: RestrictedTableEntry<TableType, FetchedColumns>[] =
            filter === undefined || filter === "ALL" ? rows : [];

          if (filter !== undefined && filter !== "ALL") {
            for (const row of rows) {
              if (filter(row)) {
                out.push(row);
              }
            }
          }

          resolve(out);
        })
        .catch(reject);
    });
  };

  const add: Table<TableType>["add"] = (entry) => {
    return new Promise((resolve, reject) => {
      const keys: string[] = Object.keys(entry);
      const processed = processTableEntry(entry);
      const preped = prepareEntry(processed);
      const values: string[] = [];

      for (const key of keys) {
        values.push(preped[key]);
      }

      // INSERT INTO {table} ({...columns}) VALUES ({...values});

      wrapper
        .exec(
          `INSERT INTO ${name} (${keys.join(",")}) VALUES (${values.join(
            ",",
          )});`,
        )
        .then(() => {
          resolve(processed);
        })
        .catch(reject);
    });
  };

  const deleteFunc: Table<TableType>["delete"] = (column, value) => {
    return new Promise((resolve, reject) => {
      // DELETE FROM {table} WHERE {column} = {value};

      wrapper
        .exec(`DELETE FROM ${name} WHERE ${column} = ${stringifyValue(value)};`)
        .then(resolve)
        .catch(reject);
    });
  };

  const toString: Table<TableType>["toString"] = () => {
    return new Promise((resolve, reject) => {
      columns()
        .then((cols) => {
          resolve(`Table{name=${name},columns=[${cols.join(",")}]}`);
        })
        .catch(reject);
    });
  };

  return {
    has,
    columns,
    create,
    drop,
    all,
    get,
    add,
    delete: deleteFunc,
    toString,
  };
};
