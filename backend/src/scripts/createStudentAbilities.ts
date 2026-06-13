import pool from '../utils/db';
import logger from '../utils/logger';

async function createStudentAbilities() {
  try {
    const students = [
      {
        id: 'f1241d8a-985e-4e99-9b66-2d88a54b6674',
        openness: 70,
        persistence: 65,
        creativity: 75,
        primary_track: 'content',
        current_level: 1
      },
      {
        id: '7bc1e8f4-5947-4e9f-8fa0-384d5395de36',
        openness: 80,
        persistence: 70,
        creativity: 60,
        primary_track: 'tool',
        current_level: 2
      },
      {
        id: '99999999-9999-9999-9999-999999999999',
        openness: 75,
        persistence: 80,
        creativity: 70,
        primary_track: 'content',
        current_level: 1
      },
      {
        id: '84443886-a97b-44cf-af56-95cc294e9062',
        openness: 60,
        persistence: 75,
        creativity: 65,
        primary_track: 'tool',
        current_level: 0
      }
    ];

    for (const student of students) {
      await pool.query(`
        INSERT INTO student_abilities (
          id, user_id, openness, persistence, creativity,
          primary_track, current_level, total_completed_tasks,
          level_0_completed, level_1_completed, level_2_completed,
          level_3_completed, level_4_completed, total_growth_points,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, 0, 0, 0, 0, 0, 0, 0,
          NOW(), NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          openness = EXCLUDED.openness,
          persistence = EXCLUDED.persistence,
          creativity = EXCLUDED.creativity,
          primary_track = EXCLUDED.primary_track,
          current_level = EXCLUDED.current_level,
          updated_at = NOW()
      `, [
        student.id,
        student.openness,
        student.persistence,
        student.creativity,
        student.primary_track,
        student.current_level
      ]);

      logger.info(`✅ Created/updated abilities for student ${student.id}`);
    }

    logger.info('\n✅ All student abilities created successfully!');
  } catch (error) {
    logger.error('❌ Error:', error);
    process.exit(1);
  }
}

createStudentAbilities();
