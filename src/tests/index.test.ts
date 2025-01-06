import testCreateTable from "./createTable.test.js";
import testCreateEntry from "./createEntry.test.js";

Promise.all([testCreateTable(), testCreateEntry()])
  .then(() => {
    console.info("All tests passed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test failed!");
    console.error(error);
    process.exit(1);
  });
