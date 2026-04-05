import { pool } from '../../src/utils/db';

export default async function globalTeardown() {
  try {
    await pool.query(`
      DELETE FROM growth_timeline WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '1390000%');
      DELETE FROM onboarding_status WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '1390000%');
      DELETE FROM student_balances WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '1390000%');
      DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '1390000%');
      DELETE FROM student_profiles WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '1390000%');
      DELETE FROM company_profiles WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '1390000%');
      DELETE FROM users WHERE phone LIKE '1390000%';
    `);
  } finally {
    await pool.end();
  }
}
