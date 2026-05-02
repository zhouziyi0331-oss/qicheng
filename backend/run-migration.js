const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'qicheng_dev',
  user: process.env.DB_USER || 'alwan',
  password: process.env.DB_PASSWORD || '',
});

async function runMigration(filename) {
  const filePath = path.join(__dirname, 'migrations', filename);
  const sql = fs.readFileSync(filePath, 'utf8');

  console.log(`Running migration: ${filename}`);

  try {
    await pool.query(sql);
    console.log(`✅ ${filename} completed successfully`);
  } catch (error) {
    console.error(`❌ ${filename} failed:`, error.message);
    throw error;
  }
}

async function main() {
  const migrations = process.argv.slice(2);

  if (migrations.length === 0) {
    console.log('Usage: node run-migration.js <migration-file-1> [migration-file-2] ...');
    process.exit(1);
  }

  try {
    for (const migration of migrations) {
      await runMigration(migration);
    }
    console.log('\n✅ All migrations completed successfully');
  } catch (error) {
    console.error('\n❌ Migration failed');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
