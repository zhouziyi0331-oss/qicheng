/**
 * 初始化学生能力画像脚本
 * 为所有现有学生创建初始的能力画像记录
 */

import { query, queryOne } from '../src/utils/db';
import logger from '../src/utils/logger';
import vectorGenerationService from '../src/services/vectorGenerationService';

interface Student {
  id: string;
  username: string;
  student_level: number;
}

async function initializeStudentCapabilities() {
  try {
    logger.info('Starting student capabilities initialization...');

    // 1. 获取所有学生用户
    const students = await query<Student>(
      `SELECT id, username, student_level
       FROM users
       WHERE role = 'student'
       ORDER BY created_at ASC`
    );

    logger.info(`Found ${students.rows.length} students to initialize`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const student of students.rows) {
      try {
        // 检查是否已存在能力画像
        const existing = await queryOne(
          `SELECT id FROM student_capabilities WHERE student_id = $1`,
          [student.id]
        );

        if (existing) {
          logger.info(`Student ${student.username} already has capability profile, skipping`);
          skipCount++;
          continue;
        }

        // 2. 获取学生的历史任务数据
        const taskStats = await queryOne<{
          tasks_completed: number;
          avg_quality: number;
          avg_satisfaction: number;
          on_time_rate: number;
          avg_response_hours: number;
        }>(
          `SELECT
            COUNT(*) FILTER (WHERE status = 'completed') as tasks_completed,
            AVG(quality_score) FILTER (WHERE quality_score IS NOT NULL) as avg_quality,
            AVG(client_satisfaction) FILTER (WHERE client_satisfaction IS NOT NULL) as avg_satisfaction,
            COUNT(*) FILTER (WHERE completed_at <= deadline) * 1.0 / NULLIF(COUNT(*) FILTER (WHERE status = 'completed'), 0) as on_time_rate,
            AVG(EXTRACT(EPOCH FROM (accepted_at - created_at)) / 3600) as avg_response_hours
           FROM task_assignments
           WHERE student_id = $1`,
          [student.id]
        );

        // 3. 获取学生的OPC测评结果
        const opcResults = await queryOne<{
          openness: number;
          persistence: number;
          creativity: number;
          personality_style: string;
        }>(
          `SELECT openness, persistence, creativity, personality_style
           FROM user_ability_profiles
           WHERE user_id = $1 AND is_current = true
           LIMIT 1`,
          [student.id]
        );

        // 4. 获取学生的技能标签
        const skills = await query<{ skill_name: string; proficiency: number }>(
          `SELECT skill_name, proficiency
           FROM student_skills
           WHERE student_id = $1`,
          [student.id]
        );

        // 5. 构建技能JSON
        const skillsJson: any = {};
        for (const skill of skills.rows) {
          skillsJson[skill.skill_name] = {
            proficiency: skill.proficiency || 0.5,
            confidence: 0.7,
            lastPracticed: new Date().toISOString().split('T')[0]
          };
        }

        // 如果没有技能数据，添加默认技能
        if (Object.keys(skillsJson).length === 0) {
          skillsJson['基础技能'] = {
            proficiency: 0.3,
            confidence: 0.5,
            lastPracticed: new Date().toISOString().split('T')[0]
          };
        }

        // 6. 生成初始向量（使用默认值）
        const defaultVector1536 = Array(1536).fill(0).map(() => Math.random() * 0.1);
        const defaultVector512 = Array(512).fill(0).map(() => Math.random() * 0.1);

        // 7. 插入能力画像记录
        await query(
          `INSERT INTO student_capabilities (
            student_id,
            skill_vector,
            trajectory_vector,
            quality_vector,
            preference_vector,
            combined_vector,
            skills,
            tasks_completed,
            avg_task_quality,
            avg_client_satisfaction,
            on_time_delivery_rate,
            avg_response_time_hours,
            quality_trend,
            growth_rate,
            skill_acquisition_rate,
            preferred_task_types,
            work_style,
            max_hours_per_week,
            opc_openness,
            opc_persistence,
            opc_creativity,
            personality_style
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
          )`,
          [
            student.id,
            JSON.stringify(defaultVector1536),
            JSON.stringify(defaultVector512),
            JSON.stringify(defaultVector512),
            JSON.stringify(defaultVector512),
            JSON.stringify(defaultVector1536),
            JSON.stringify(skillsJson),
            taskStats?.tasks_completed || 0,
            taskStats?.avg_quality || null,
            taskStats?.avg_satisfaction || null,
            taskStats?.on_time_rate || null,
            taskStats?.avg_response_hours || null,
            'stable',
            0.5,
            0.5,
            ['general'],
            JSON.stringify({ workHours: 'flexible', communicationStyle: 'responsive' }),
            20,
            opcResults?.openness || 5,
            opcResults?.persistence || 5,
            opcResults?.creativity || 5,
            opcResults?.personality_style || 'balanced'
          ]
        );

        // 8. 异步生成真实向量（不阻塞主流程）
        vectorGenerationService.updateStudentEmbedding(student.id).catch(err => {
          logger.error(`Failed to generate vectors for student ${student.id}:`, err);
        });

        logger.info(`✅ Initialized capability profile for student ${student.username}`);
        successCount++;

        // 避免过载
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errorCount++;
        logger.error(`Failed to initialize student ${student.username}:`, error);
      }
    }

    logger.info('='.repeat(60));
    logger.info('Student capabilities initialization completed!');
    logger.info(`✅ Success: ${successCount}`);
    logger.info(`⏭️  Skipped: ${skipCount}`);
    logger.info(`❌ Errors: ${errorCount}`);
    logger.info('='.repeat(60));

    process.exit(0);
  } catch (error) {
    logger.error('Failed to initialize student capabilities:', error);
    process.exit(1);
  }
}

// 运行脚本
initializeStudentCapabilities();
