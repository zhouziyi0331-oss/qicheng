"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../utils/db");
(async () => {
    try {
        const tasks = await (0, db_1.query)('SELECT id, title, company_id, status FROM tasks LIMIT 5');
        console.log('Tasks in database:');
        console.log(JSON.stringify(tasks, null, 2));
        process.exit(0);
    }
    catch (error) {
        console.error('Error querying tasks:', error);
        process.exit(1);
    }
})();
//# sourceMappingURL=queryTasks.js.map