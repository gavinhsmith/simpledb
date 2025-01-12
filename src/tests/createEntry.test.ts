import { Database } from "../module";

const fail = (reason: Error | string): Error => {
  return new Error(
    `testCreateEntry(): ${reason instanceof Error ? reason.message : reason}${reason instanceof Error ? reason : ""}`,
  );
};

type TestTableData = {
  id: number;
  entry: string;
  date: string;
};

/**
 * Tests the Table.add() method.
 *
 * @returns A promise that resolves if passed, and rejects if failed.
 */
export const testCreateEntry: () => Promise<void> = () => {
  return new Promise((resolve, reject) => {
    const db = Database("memory", {
      verbose: true,
    });

    db.create<TestTableData>(
      "test_table",
      { id: "int", entry: "string", date: "string" },
      "id",
    )
      .then(() => {
        const expected: TestTableData[] = [];

        expected[0] = {
          id: 0,
          entry: "Entry #1",
          date: new Date().toISOString(),
        };
        expected[1] = {
          id: 1,
          entry: "Entry #2",
          date: new Date().toISOString(),
        };
        expected[2] = {
          id: 2,
          entry: "Entry #3",
          date: new Date().toISOString(),
        };
        expected[3] = {
          id: 3,
          entry: "Entry #4",
          date: new Date().toISOString(),
        };

        const promises: Promise<void>[] = [];

        for (const expect of expected) {
          promises.push(
            new Promise((resolve, reject) => {
              db.table<TestTableData>("test_table")
                .add(expect)
                .then((entry) => {
                  if (entry.id === expect.id && entry.entry === expect.entry) {
                    resolve();
                  } else {
                    reject(
                      new Error(
                        `Table data was not what was expected. Should be ${JSON.stringify(expect)} but was ${JSON.stringify(entry)}.`,
                      ),
                    );
                  }
                })
                .catch(reject);
            }),
          );
        }

        Promise.all(promises)
          .then(() => {
            db.table<TestTableData>("test_table")
              .get([], "ALL")
              .then((rows) => {
                if (rows.length === 4) {
                  resolve();
                } else {
                  reject(fail("Restriction failed."));
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
