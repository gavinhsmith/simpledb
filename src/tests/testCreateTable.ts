import Database from "../Database.js";
import { DataType } from "../DatabaseTypes.js";
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
        type: "INTENGER",
        isPrimaryKey: true,
      },
      {
        name: "column",
        type: "TEXT",
      },
    ])
      .then((_table) => {
        db.table("test_table")
          .exists()
          .then((exists) => {
            if (exists) {
              resolve();
            } else {
              reject(new Error('Table "test_table" does not exist.'));
            }
          })
          .catch((error: Error) => {
            reject(rejectMessage(error));
          });
      })
      .catch((error: Error) => {
        reject(rejectMessage(error));
      });
  });
}
