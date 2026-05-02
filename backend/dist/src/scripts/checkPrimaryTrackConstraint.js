"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../utils/db");
async function checkConstraint() {
    try {
        const result = await (0, db_1.query)(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conname = 'student_abilities_primary_track_check';
    `);
        console.log('Constraint definition:');
        console.log(result[0]);
    }
    catch (error) {
        console.error('Error:', error);
    }
    process.exit(0);
}
checkConstraint();
//# sourceMappingURL=checkPrimaryTrackConstraint.js.map