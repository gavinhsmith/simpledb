import Database, { ExtendedType } from "@module";

function rejectMessage(error: Error) {
  return `testCreateEntry(): ${error.message}\n${error}`;
}

type TestTableData = { id: number; entry: string; date: ExtendedType };

/**
 * Tests the Table.add() method.
 * @returns A promise that resolves if passed, and rejects if failed.
 */
export default function testCreateEntry(): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = new Database("memory", {
      verbose: true,
      types: { date: ExtendedType.DATES },
    });

    db.create<TestTableData>(
      "test_table",
      { id: "int", entry: "string", date: "string" },
      "id"
    )
      .then(() => {
        const expected: TestTableData[] = [];
        expected[0] = {
          id: 0,
          entry: "Entry #1",
          date: ExtendedType.DATES,
        };
        expected[1] = {
          id: 1,
          entry: "Entry #2",
          date: ExtendedType.DATES,
        };
        expected[2] = {
          id: 2,
          entry: "Entry #3",
          date: ExtendedType.DATES,
        };
        expected[3] = {
          id: 3,
          entry: "Entry #4",
          date: ExtendedType.DATES,
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
                        `Table data was not what was expected. Should be ${expect} but was ${entry}.`
                      )
                    );
                  }
                })
                .catch(reject);
            })
          );
        }

        Promise.all(promises)
          .then(() => {
            db.table<TestTableData>("test_table")
              .get(null, "ALL")
              .then((rows) => {
                if (rows.length === 4) {
                  console.debug(rows);
                  resolve();
                } else {
                  reject(rejectMessage(new Error("Restriction failed.")));
                }
              })
              .catch((error: Error) => {
                reject(rejectMessage(error));
              });
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
