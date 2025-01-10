import Column from "./column";
import {
  TableEntry,
  FilterFunction,
  RestrictedTableEntry,
  ProcessedTableEntry,
  TableEntryKeys,
} from "./types";
import {
  DataType,
  getSQLType,
  prepareEntry,
  processTableEntry,
} from "./convert";
import SqliteWrapper from "./wrapper";
import { ExtendedTypeList } from "./extended";

/** A Table within a Database. */
export class Table<TableType extends TableEntry> {
  /** The SQLite instance to utilize. */
  private db: SqliteWrapper;
  /** The name of the table. */
  public readonly name: string;
  /** A list of extended types that need to be processed. */
  public readonly types: ExtendedTypeList;

  /**
   * Constructs a Table.
   * @param <TableType> The data we expect the table to have.
   * @param wrapper The SQLite3 reference from the Database.
   * @param name The name of the table.
   * @param types Any extended types that need to be processed.
   */
  constructor(
    wrapper: SqliteWrapper,
    name: string,
    types: ExtendedTypeList = {}
  ) {
    this.db = wrapper;
    this.name = name;
    this.types = types;
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
        this.db
          .query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=$name;",
            { $name: this.name }
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
   * @param <ColumnType> The type of data that is in the column.
   * @param column The name of the column.
   * @returns An instance that can do operations.
   */
  public column<ColumnType>(column: string): Column<ColumnType, TableType> {
    return new Column(this.db, column, this);
  }

  /**
   * Gets a reference to all columns of the table.
   * @returns All columns within the table.
   */
  public columns(): Promise<Column<keyof TableType, TableType>[]> {
    return new Promise((resolve, reject) => {
      // SELECT name FROM pragma_table_info({table});

      this.db
        .query<{ name: string }>(
          `SELECT name FROM pragma_table_info('${this.name}');`
        )
        .then((rows) => {
          const columns: Column<keyof TableType, TableType>[] = [];

          for (const row of rows) {
            columns.push(this.column(row.name));
          }

          resolve(columns);
        })
        .catch(reject);
    });
  }

  /**
   * Creates a new column on the table.
   * @param <ColumnType> The type of data that is in the column.
   * @param column The name of the column.
   * @param type The DataType of the column.
   * @returns A promise that resolves into a Column instance, or rejects if an error occurs.
   */
  public create<ColumnType>(
    column: string,
    type: DataType
  ): Promise<Column<ColumnType, TableType>> {
    return new Promise((resolve, reject) => {
      this.exists(column)
        .then((exists) => {
          if (!exists) {
            // ALTER TABLE {table} ADD COLUMN {name} {type};

            this.db
              .exec(
                `ALTER TABLE ${this.name} ADD COLUMN ${column} ${getSQLType(
                  type
                )};`
              )
              .then(() => {
                resolve(this.column<ColumnType>(column));
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

            this.db
              .exec(`ALTER TABLE ${this.name} DROP COLUMN ${column};`)
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
   * @param <FetchedColumns> The list of column keys avaliable.
   * @param columns A list of columns to get. Defaults to all columns if empty.
   * @returns A promise that resolves into all table entries, or rejects if an error occurs.
   */
  public all<FetchedColumns extends TableEntryKeys<TableType>>(
    columns: FetchedColumns[] | null = null
  ): Promise<RestrictedTableEntry<TableType, FetchedColumns>[]> {
    return new Promise((resolve, reject) => {
      // SELECT {columns} FROM {table};

      this.db
        .query<RestrictedTableEntry<TableType, FetchedColumns>>(
          `SELECT ${
            columns === null || columns.length === 0 ? "*" : columns.join(",")
          } FROM ${this.name};`
        )
        .then((rows) => {
          const out: RestrictedTableEntry<TableType, FetchedColumns>[] = [];

          for (const row of rows) {
            let cleaned: { [key: string]: unknown } = row;

            for (const column of Object.keys(row)) {
              if (this.types[column] != null) {
                const obj: { [key: string]: unknown } = {};
                obj[column] = this.types[column].get(cleaned[column]);
                cleaned = { ...cleaned, ...obj };
              }
            }

            out.push(<RestrictedTableEntry<TableType, FetchedColumns>>cleaned);
          }

          resolve(<RestrictedTableEntry<TableType, FetchedColumns>[]>out);
        })
        .catch(reject);
    });
  }

  /**
   * Gets entries from the table.
   * @param <FetchedColumns> The list of column keys avaliable.
   * @param columns A list of columns to get. Defaults to all columns if empty.
   * @param filter The predefined filter tag or filter function to use. Defaults to `"ALL"`.
   * @returns A promise that resolves into the requested table entries, or rejects if an error occurs.
   */
  public get<FetchedColumns extends TableEntryKeys<TableType>>(
    columns: FetchedColumns[] | null = null,
    filter: FilterFunction<
      RestrictedTableEntry<TableType, FetchedColumns>
    > = "ALL"
  ): Promise<RestrictedTableEntry<TableType, FetchedColumns>[]> {
    return new Promise((resolve, reject) => {
      this.all<FetchedColumns>(columns)
        .then((rows) => {
          const out: RestrictedTableEntry<TableType, FetchedColumns>[] =
            filter === "ALL" ? rows : [];

          if (filter != "ALL") {
            for (const row of rows) {
              if (filter(row)) out.push(row);
            }
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
  public add(entry: TableType): Promise<ProcessedTableEntry<TableType>> {
    return new Promise((resolve, reject) => {
      const keys: string[] = Object.keys(entry);
      const processed = processTableEntry(entry);
      const preped = prepareEntry(processed);
      const values: string[] = [];

      for (const key of keys) {
        values.push(preped[key]);
      }

      // INSERT INTO {table} ({...columns}) VALUES ({...values});

      this.db
        .exec(
          `INSERT INTO ${this.name} (${keys.join(",")}) VALUES (${values.join(
            ","
          )});`
        )
        .then(() => {
          resolve(processed);
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

      this.db
        .exec(`DELETE FROM ${this.name} WHERE ${column} = ${value};`)
        .then(resolve)
        .catch(reject);
    });
  }

  // Table Tools

  /**
   * Gets a string representation of the table.
   * @returns A promise that resolves into a string, or rejects if an error occurs.
   */
  public toString(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.columns()
        .then((columns) => {
          resolve(`Table{name=${this.name},columns=[${columns.join(",")}]}`);
        })
        .catch(reject);
    });
  }
}

// Export Default
export default Table;
