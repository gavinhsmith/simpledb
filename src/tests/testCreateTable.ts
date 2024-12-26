import Database from "../Database.js";
import { DataType, TableColumnSettings } from "../DatabaseTypes.js";
import Table from "../Table.js";

function rejectMessage(error: Error) {
  return `testCreateTable(): ${error.message}`;
}

/**
 * Tests the Database.create() method.
 * @returns A promise that resolves if passed, and rejects if failed.
 */
export default function testCreateTable(): Promise<void> {
  return new Promise((resolve, reject) => {
    let db = new Database("memory", true);

    db.create<{ id: number; column: string }>("test_table", [
      {
        name: "id",
        type: DataType.INT,
        isPrimaryKey: true,
      },
      {
        name: "column",
        type: DataType.STRING,
      },
    ])
      .then((_table) => {
        new Table(db.getSQLiteInstance(), "test_table")
          .exists()
          .then(resolve)
          .catch((error: Error) => {
            reject(rejectMessage(error));
          });
      })
      .catch((error: Error) => {
        reject(rejectMessage(error));
      });
  });
}
