import testCreateTable from "./testCreateTable.js";

process.on("SIGINT", () => {
  process.exit(1);
});
process.on("SIGKILL", () => {
  process.exit(1);
});
process.on("SIGTERM", () => {
  process.exit(1);
});
process.on("exit", (code) => {
  let logger = code === 0 ? console.info : console.error;
  logger("Gracefull shutdown...");
  logger(`Exited with code ${code}.`);
});

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

setTimeout(() => {
  console.info("waited");
}, 15 * 1000);
