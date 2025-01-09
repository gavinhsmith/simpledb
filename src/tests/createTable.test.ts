import Database from "@module";

function rejectMessage(error: Error) {
  return `testCreateTable(): ${error.message}\n${error}`;
}

type TestTableData = { id: number; entry: string };

/**
 * Tests the Database.create() method.
 * @returns A promise that resolves if passed, and rejects if failed.
 */
export default function testCreateTable(): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = new Database("memory", { verbose: true });

    db.create<TestTableData>("test_table", { id: "int", entry: "string" }, "id")
      .then(() => {
        db.table("test_table")
          .exists()
          .then((exists) => {
            if (exists) {
              resolve();
            } else {
              reject(
                rejectMessage(new Error('Table "test_table" was not created.'))
              );
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
