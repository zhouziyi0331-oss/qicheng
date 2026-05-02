"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../utils/db");
(async () => {
    try {
        const result = await (0, db_1.query)(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'ai_matches'
      ORDER BY ordinal_position
    `);
        console.log('ai_matches table schema:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
//# sourceMappingURL=checkSchema.js.map