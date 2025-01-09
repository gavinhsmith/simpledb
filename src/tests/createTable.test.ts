import Database from "@module";

function rejectMessage(error: Error) {
  return `testCreateTable(): ${error.message}`;
}

type TestTableData = { id: number; entry: string };

/**
 * Tests the Database.create() method.
 * @returns A promise that resolves if passed, and rejects if failed.
 */
export default function testCreateTable(): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = new Database("memory", { verbose: true });

    db.create<TestTableData>(
      "test_table",
      { id: "INTENGER", entry: "TEXT" },
      "id"
    )
      .then(() => {
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
