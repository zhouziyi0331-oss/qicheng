"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../utils/db"));
async function updateTaskLevel() {
    try {
        const taskId = '9a4ede4a-8560-4dcc-b3ca-25eaaebfdbf2';
        // Update task level
        await db_1.default.query('UPDATE tasks SET level = $1 WHERE id = $2', [2, taskId]);
        // Verify update
        const result = await db_1.default.query('SELECT id, title, level FROM tasks WHERE id = $1', [taskId]);
        console.log('Task updated:', result[0]);
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
updateTaskLevel();
//# sourceMappingURL=updateTaskLevel.js.map