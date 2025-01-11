import { Database } from "../module";

const fail = (reason: Error | string): Error => {
  return new Error(
    `testCreateTable(): ${reason instanceof Error ? reason.message : reason}${reason instanceof Error ? reason : ""}`,
  );
};

type TestTableData = {
  id: number;
  entry: string;
};

/**
 * Tests the Database.create() method.
 *
 * @returns A promise that resolves if passed, and rejects if failed.
 */
export const testCreateTable: () => Promise<void> = () => {
  return new Promise((resolve, reject) => {
    const db = Database("memory", { verbose: true });

    db.create<TestTableData>("test_table", { id: "int", entry: "string" }, "id")
      .then(() => {
        db.has("test_table")
          .then((exists) => {
            if (exists) {
              resolve();
            } else {
              reject(fail('Table "test_table" was not created.'));
            }
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
