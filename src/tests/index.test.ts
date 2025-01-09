import testCreateTable from "./createTable.test.js";
import testCreateEntry from "./createEntry.test.js";

new Promise<number>((exit) => {
  Promise.all([testCreateTable(), testCreateEntry()])
    .then(() => {
      console.info("All tests passed!");
      exit(0);
    })
    .catch((error) => {
      console.error("Test failed!");
      console.error(error);
      exit(1);
    });
}).then(process.exit);
