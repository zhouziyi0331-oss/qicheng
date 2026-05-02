"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../utils/db");
(async () => {
    try {
        const taskId = '9a4ede4a-8560-4dcc-b3ca-25eaaebfdbf2';
        console.log('Checking ai_matches for task:', taskId);
        const matches = await (0, db_1.query)('SELECT * FROM ai_matches WHERE task_id = $1', [taskId]);
        console.log('Matches found:', matches.length);
        console.log(JSON.stringify(matches, null, 2));
        console.log('\nChecking if task has embeddings:');
        const task = await (0, db_1.query)('SELECT id, title, combined_embedding IS NOT NULL as has_embedding FROM tasks WHERE id = $1', [taskId]);
        console.log(JSON.stringify(task, null, 2));
        console.log('\nChecking students with embeddings:');
        const students = await (0, db_1.query)('SELECT id, nickname, profile_embedding IS NOT NULL as has_embedding FROM users WHERE role = $1 LIMIT 5', ['student']);
        console.log(JSON.stringify(students, null, 2));
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
//# sourceMappingURL=checkMatches.js.map