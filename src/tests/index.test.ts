import { testCreateEntry } from "./createEntry.test.js";
import { testCreateTable } from "./createTable.test.js";
import { testUpdateEntry } from "./updateEntry.test.js";

Promise.all([testCreateTable(), testCreateEntry(), testUpdateEntry()])
  .then(() => {
    console.info("All tests passed!");
    process.exit(0);
  })
  // eslint-disable-next-line unicorn/prefer-top-level-await
  .catch((error) => {
    console.error("Test failed!");
    console.error(error);
    process.exit(1);
  });
