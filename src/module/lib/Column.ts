import Table from "./table";
import { FilterFunction, TableEntry } from "./types";
import SqliteWrapper from "./wrapper";

/**
 * A Column within a Table.
 * @param <ColumnType> The type of data in this column.
 * */
export class Column<ColumnType, TableType extends TableEntry> {
  /** The SQLite instance to utilize. */
  private db: SqliteWrapper;
  /** The reference to the parent table. */
  private table: Table<TableType>;
  /** The name of the column. */
  private name: string;

  /**
   * Constructs a Column.
   * @param wrapper The SQLite3 reference from the Database.
   * @param name The name of the column.
   * @param table The column's parent table.
   */
  constructor(wrapper: SqliteWrapper, name: string, table: Table<TableType>) {
    this.db = wrapper;
    this.name = name;
    this.table = table;
  }

  // Column Operations

  /**
   * Checks if the column/an entry exists.
   * @param entry The entry to check, will check if the column exists if left blank.
   * @returns A promise that resolves to a boolean, or rejects if an error occurs.
   */
  public exists(entry?: ColumnType): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // No Entry: SELECT COUNT(*) AS CNTREC FROM pragma_table_info({table}) WHERE name={column};
      // Entry: SELECT * FROM {table} WHERE {column}={entry};

      if (entry != null) {
        this.db
          .query(`SELECT * FROM $table WHERE $column=$value`, {
            $table: this.table.name,
            $column: this.name,
            $value: entry,
          })
          .then((rows) => {
            resolve(rows.length >= 1);
          })
          .catch(reject);
      } else {
        this.db
          .query<{ CNTREC: number }>(
            "SELECT COUNT(*) AS CNTREC FROM pragma_table_info($table) WHERE name=$value;",
            {
              $table: this.table.name,
              $column: this.name,
            }
          )
          .then((rows) => {
            resolve(rows[0].CNTREC >= 1);
          })
          .catch(reject);
      }
    });
  }

  /**
   * Gets all of the entries within the column.
   * @returns All entries.
   */
  public all(): Promise<ColumnType[]> {
    return new Promise((resolve, reject) => {
      // SELECT {column} FROM {table};

      this.db
        .query<{ [key: string]: ColumnType }>(
          `SELECT ${this.name} FROM ${this.table.name}`
        )
        .then((entries) => {
          const out: ColumnType[] = [];
          for (const entry of entries) {
            if (this.table.types[this.name] != null) {
              out.push(
                <ColumnType>(
                  this.table.types[this.name].get(<ColumnType>entry[this.name])
                )
              );
            } else {
              out.push(entry[this.name]);
            }
          }
          resolve(out);
        })
        .catch(reject);
    });
  }

  /**
   * Gets entries from the column.
   * @param filter A method returns true for any row in the column that should be included. Defaults to all.
   * @returns A promise that resolves into the entries requested.
   */
  public get(filter: FilterFunction<ColumnType>): Promise<ColumnType[]> {
    return new Promise((resolve, reject) => {
      this.all()
        .then((entires) => {
          const out: ColumnType[] = [];

          for (const entry of entires) {
            if (this.table.types[this.name] != null) {
              if (
                filter === "ALL" ||
                filter(<ColumnType>this.table.types[this.name]?.get(entry))
              )
                out.push(entry);
            } else {
              if (filter === "ALL" || filter(entry)) out.push(entry);
            }
          }

          resolve(out);
        })
        .catch(reject);
    });
  }

  // Column Tools

  /**
   * Gets a string representation of the column.
   * @returns A promise that resolves into a string, or rejects if an error occurs.
   */
  public toString(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.all()
        .then((entries) => {
          resolve(`Column{name=${this.name},entries=[${entries.join(",")}]}`);
        })
        .catch(reject);
    });
  }
}

// Export Defaults
export default Column;
