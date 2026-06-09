/**
 * 列出所有表名
 */

import { query } from '../src/utils/db';

async function listTables() {
  const result = await query<{ tablename: string }>(
    `SELECT tablename
     FROM pg_tables
     WHERE schemaname = 'public'
     ORDER BY tablename`
  );

  console.log('\n所有表名:\n');
  result.forEach(r => console.log(`  - ${r.tablename}`));
  console.log(`\n总计: ${result.length}个表\n`);

  // 查找订单相关的表
  console.log('订单相关的表:');
  result.filter(r => r.tablename.includes('order')).forEach(r => console.log(`  ✓ ${r.tablename}`));

  console.log('\n用户相关的表:');
  result.filter(r => r.tablename.includes('user') || r.tablename.includes('student')).forEach(r => console.log(`  ✓ ${r.tablename}`));

  process.exit(0);
}

listTables();
