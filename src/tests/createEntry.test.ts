import Database from "@module";

function rejectMessage(error: Error) {
  return `testCreateEntry(): ${error.message}\n${error}`;
}

type TestTableData = { id: number; entry: string; date: () => number };

/**
 * Tests the Table.add() method.
 * @returns A promise that resolves if passed, and rejects if failed.
 */
export default function testCreateEntry(): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = new Database("memory", { verbose: true });

    db.create<TestTableData>(
      "test_table",
      { id: "INTENGER", entry: "TEXT", date: "INTENGER" },
      "id"
    )
      .then(() => {
        const expected: TestTableData[] = [];
        expected[0] = {
          id: 0,
          entry: "Entry #1",
          date: () => new Date().getTime(),
        };
        expected[1] = {
          id: 1,
          entry: "Entry #2",
          date: () => new Date().getTime(),
        };
        expected[2] = {
          id: 2,
          entry: "Entry #3",
          date: () => new Date().getTime(),
        };

        const promises: Promise<TestTableData>[] = [];
        for (const expect of expected) {
          promises.push(db.table<TestTableData>("test_table").add(expect));
        }

        Promise.all(promises)
          .then((actual) => {
            for (let i = 0; i < actual.length; i++) {
              if (actual[i] !== expected[i]) {
                reject(
                  rejectMessage(
                    new Error(
                      `Table data was not what was expected. Should be ${expected[i]} but was ${actual[i]}.`
                    )
                  )
                );
                return;
              }
              resolve();
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
