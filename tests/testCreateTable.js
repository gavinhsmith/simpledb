import Database from "../dist/index.js";
function rejectMessage(error) {
    return `testCreateTable(): ${error.message}`;
}
export default function testCreateTable() {
    return new Promise((resolve, reject) => {
        const db = new Database("memory", true);
        db.create("test_table", [
            {
                name: "id",
                type: "INTENGER",
                isPrimaryKey: true,
            },
            {
                name: "column",
                type: "TEXT",
            },
        ])
            .then(() => {
            db.table("test_table")
                .exists()
                .then((exists) => {
                if (exists) {
                    resolve();
                }
                else {
                    reject(new Error('Table "test_table" does not exist.'));
                }
            })
                .catch((error) => {
                reject(rejectMessage(error));
            });
        })
            .catch((error) => {
            reject(rejectMessage(error));
        });
    });
}
