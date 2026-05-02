"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../utils/db"));
async function checkEmbeddingFormat() {
    try {
        // Check task embedding
        const taskResult = await db_1.default.query('SELECT id, combined_embedding FROM tasks WHERE id = $1', ['9a4ede4a-8560-4dcc-b3ca-25eaaebfdbf2']);
        if (taskResult.length > 0) {
            const task = taskResult[0];
            console.log('Task embedding type:', typeof task.combined_embedding);
            console.log('Task embedding is null?', task.combined_embedding === null);
            console.log('Is array?', Array.isArray(task.combined_embedding));
            if (task.combined_embedding) {
                console.log('Length:', task.combined_embedding.length);
                console.log('First few values:', task.combined_embedding.slice?.(0, 5));
            }
        }
        // Check student embedding
        const studentResult = await db_1.default.query('SELECT id, nickname, profile_embedding FROM users WHERE role = $1 LIMIT 1', ['student']);
        if (studentResult.length > 0) {
            const student = studentResult[0];
            console.log('\nStudent embedding type:', typeof student.profile_embedding);
            console.log('Student embedding is null?', student.profile_embedding === null);
            console.log('Is array?', Array.isArray(student.profile_embedding));
            if (student.profile_embedding) {
                console.log('Length:', student.profile_embedding.length);
                console.log('First few values:', student.profile_embedding.slice?.(0, 5));
            }
        }
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
checkEmbeddingFormat();
//# sourceMappingURL=checkEmbeddingFormat.js.map