import { Database } from "../module";

const fail = (reason: Error | string): Error => {
  return new Error(
    `testUpdateEntry(): ${reason instanceof Error ? reason.message : reason}${reason instanceof Error ? reason : ""}`,
  );
};

type TestTableData = {
  id: number;
  entry: string;
  date: string;
};

/**
 * Tests the Table.update() method.
 *
 * @returns A promise that resolves if passed, and rejects if failed.
 */
export const testUpdateEntry: () => Promise<void> = () => {
  return new Promise((resolve, reject) => {
    const db = Database("memory", {
      verbose: true,
    });

    const oldEntry = { id: 0, entry: "Value 1", date: "Random Date" };

    db.create<TestTableData>(
      "test_table",
      { id: "int", entry: "string", date: "string" },
      "id",
    )
      .then(() => {
        const newEntry = {
          entry: "Updated Value 1",
          date: new Date().toISOString(),
        };

        db.table<TestTableData>("test_table")
          .add(oldEntry)
          .then(() => {
            db.table<TestTableData>("test_table")
              .update("id", 0, newEntry)
              .then((rows) => {
                if (
                  rows.length === 1 &&
                  rows[0].id === oldEntry.id &&
                  rows[0].entry === newEntry.entry &&
                  rows[0].date === newEntry.date
                ) {
                  resolve();
                } else {
                  reject(fail("Row was not correctly updated."));
                }
              })
              .catch((error: Error) => {
                reject(fail(error));
              });
          })
          .catch((error: Error) => {
            reject(fail(error));
          });
      })
      .catch((error: Error) => {
        reject(fail(error));
      });
  });
};
