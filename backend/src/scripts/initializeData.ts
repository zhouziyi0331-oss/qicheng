/**
 * 数据初始化脚本
 * 为现有的任务和学生生成向量和能力画像
 */

import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';
import vectorEmbeddingService from '../services/vectorEmbeddingService';
import qichengTeacherService from '../services/qichengTeacherService';
import studentCapabilityService from '../services/studentCapabilityService';

/**
 * 初始化所有学生的能力画像
 */
async function initializeStudentCapabilities() {
  try {
    logger.info('Starting student capabilities initialization...');

    // 获取所有学生
    const students = await query<{ id: string; username: string }>(
      `SELECT id, username FROM users WHERE role = 'student' AND status = 'active'`
    );

    logger.info(`Found ${students.length} students to initialize`);

    let successCount = 0;
    let errorCount = 0;

    for (const student of students) {
      try {
        // 检查是否已有能力画像
        const existing = await queryOne(
          `SELECT id FROM student_capabilities WHERE student_id = $1`,
          [student.id]
        );

        if (existing) {
          logger.info(`Student ${student.username} already has capability profile, skipping`);
          continue;
        }

        // 获取OPC测评结果（如果有）
        const opcResult = await queryOne<{
          openness: number;
          persistence: number;
          creativity: number;
          personality_style: string;
        }>(
          `SELECT openness, persistence, creativity, personality_style
           FROM opc_test_results
           WHERE student_id = $1
           ORDER BY created_at DESC
           LIMIT 1`,
          [student.id]
        );

        // 初始化能力画像
        await studentCapabilityService.initializeCapability(student.id, opcResult ? {
          openness: opcResult.openness,
          persistence: opcResult.persistence,
          creativity: opcResult.creativity,
          personalityStyle: opcResult.personality_style
        } : undefined);

        successCount++;
        logger.info(`✓ Initialized capability for student ${student.username} (${successCount}/${students.length})`);

        // 避免API限流
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        errorCount++;
        logger.error(`✗ Failed to initialize student ${student.username}:`, error);
      }
    }

    logger.info(`Student capabilities initialization completed: ${successCount} success, ${errorCount} errors`);

  } catch (error: any) {
    logger.error('Failed to initialize student capabilities:', error);
    throw error;
  }
}

/**
 * 为所有现有任务生成向量和翻译
 */
async function initializeTaskVectors() {
  try {
    logger.info('Starting task vectors initialization...');

    // 获取所有开放的任务
    const tasks = await query<{ id: string; title: string; status: string }>(
      `SELECT id, title, status FROM tasks WHERE status IN ('open', 'in_progress')`
    );

    logger.info(`Found ${tasks.length} tasks to initialize`);

    let successCount = 0;
    let errorCount = 0;

    for (const task of tasks) {
      try {
        // 检查是否已有向量
        const existing = await queryOne(
          `SELECT combined_embedding FROM tasks WHERE id = $1 AND combined_embedding IS NOT NULL`,
          [task.id]
        );

        if (existing) {
          logger.info(`Task ${task.title} already has embedding, skipping vector generation`);
        } else {
          // 生成任务向量
          await (vectorEmbeddingService as any).updateTaskEmbedding(task.id);
          logger.info(`✓ Generated vector for task ${task.title}`);
        }

        // 检查是否已有翻译
        const translation = await qichengTeacherService.getTranslation(task.id);

        if (translation) {
          logger.info(`Task ${task.title} already has translation, skipping`);
        } else {
          // 生成任务翻译
          await qichengTeacherService.analyzeAndTranslateTask(task.id as any);
          logger.info(`✓ Generated translation for task ${task.title}`);
        }

        successCount++;
        logger.info(`✓ Initialized task ${task.title} (${successCount}/${tasks.length})`);

        // 避免API限流
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error: any) {
        errorCount++;
        logger.error(`✗ Failed to initialize task ${task.title}:`, error);
      }
    }

    logger.info(`Task vectors initialization completed: ${successCount} success, ${errorCount} errors`);

  } catch (error: any) {
    logger.error('Failed to initialize task vectors:', error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    logger.info('=== Data Initialization Started ===');

    // 1. 初始化学生能力画像
    await initializeStudentCapabilities();

    // 2. 初始化任务向量和翻译
    await initializeTaskVectors();

    logger.info('=== Data Initialization Completed ===');
    process.exit(0);

  } catch (error: any) {
    logger.error('Data initialization failed:', error);
    process.exit(1);
  }
}

// 运行初始化
if (require.main === module) {
  main();
}

export { initializeStudentCapabilities, initializeTaskVectors };
