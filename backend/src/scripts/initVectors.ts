#!/usr/bin/env ts-node
/**
 * 向量初始化脚本
 * 为现有的任务和学生生成embedding向量
 *
 * 运行方式：
 * npm run init-vectors
 * 或
 * ts-node src/scripts/initVectors.ts
 */

import vectorGenerationService from '../services/vectorGenerationService';
import studentCapabilityService from '../services/studentCapabilityService';
import logger from '../utils/logger';

async function initVectors() {
  logger.info('========================================');
  logger.info('开始初始化向量系统');
  logger.info('========================================\n');

  try {
    // 1. 初始化所有学生的能力画像
    logger.info('步骤 1/3: 初始化学生能力画像...');
    await studentCapabilityService.initializeAllStudents();
    logger.info('✓ 学生能力画像初始化完成\n');

    // 2. 为所有任务生成向量
    logger.info('步骤 2/3: 为所有任务生成向量...');
    await vectorGenerationService.updateAllTaskEmbeddings();
    logger.info('✓ 任务向量生成完成\n');

    // 3. 为所有学生生成向量
    logger.info('步骤 3/3: 为所有学生生成向量...');
    await vectorGenerationService.updateAllStudentEmbeddings();
    logger.info('✓ 学生向量生成完成\n');

    logger.info('========================================');
    logger.info('向量初始化完成！');
    logger.info('========================================');
    logger.info('\n现在可以使用语义匹配功能了。');
    logger.info('\n企业发布任务后，调用以下API触发匹配：');
    logger.info('POST /api/v1/tasks/:taskId/trigger-matching\n');

    process.exit(0);
  } catch (error: unknown) {
    logger.error('\n❌ 向量初始化失败:', error);
    logger.error('Vector initialization failed:', error);
    process.exit(1);
  }
}

// 运行初始化
initVectors();
