import testCreateTable from "./testCreateTable.js";
Promise.all([testCreateTable()])
    .then(() => {
    console.info("All tests passed!");
})
    .catch((error) => {
    console.error("Test failed!");
    console.error(error);
    process.exit(1);
});
