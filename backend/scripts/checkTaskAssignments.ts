/**
 * 检查task_assignments表结构
 */

import { query } from '../src/utils/db';

async function checkTaskAssignments() {
  console.log('\n检查 task_assignments 表结构:\n');

  const result = await query<{ column_name: string; data_type: string; is_nullable: string }>(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_name = 'task_assignments'
     AND table_schema = 'public'
     ORDER BY ordinal_position`
  );

  result.forEach(col => {
    const nullable = col.is_nullable === 'YES' ? '(nullable)' : '';
    console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}`);
  });

  console.log(`\n总计: ${result.length}个字段\n`);

  process.exit(0);
}

checkTaskAssignments();
