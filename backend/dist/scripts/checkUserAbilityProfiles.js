"use strict";
/**
 * 检查user_ability_profiles表结构
 */
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/utils/db");
async function checkUserAbilityProfiles() {
    console.log('\n检查 user_ability_profiles 表结构:\n');
    const result = await (0, db_1.query)(`SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_name = 'user_ability_profiles'
     AND table_schema = 'public'
     ORDER BY ordinal_position`);
    result.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '';
        console.log(`  ${col.column_name.padEnd(35)} ${col.data_type.padEnd(25)} ${nullable}`);
    });
    console.log(`\n总计: ${result.length}个字段\n`);
    process.exit(0);
}
checkUserAbilityProfiles();
//# sourceMappingURL=checkUserAbilityProfiles.js.map