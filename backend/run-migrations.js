const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng'
});

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`Running migration: ${file}`);
    try {
      await pool.query(sql);
      console.log(`✓ ${file} completed`);
    } catch (error) {
      console.error(`✗ ${file} failed:`, error.message);
      // Continue with next migration even if one fails
    }
  }

  await pool.end();
  console.log('All migrations completed');
}

runMigrations().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
