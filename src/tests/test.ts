import testCreateTable from "./testCreateTable.js";

Promise.all([testCreateTable()])
  .then(() => {
    console.info("All tests passed!");
    //process.exit(0);
  })
  .catch((error) => {
    console.error("Test failed!");
    console.error(error);
    process.exit(1);
  });
