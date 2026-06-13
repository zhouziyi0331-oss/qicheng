/**
 * 匹配处理Worker
 * 异步处理学生-任务匹配计算
 */

import { matchingQueue } from '../config/queue';
import crossPlatformService from '../services/crossPlatformService';
import { notificationQueue } from '../config/queue';

// ============================================================================
// 任务类型定义
// ============================================================================

interface RecalculateMatchesJob {
  change_id: string;
  task_id: string;
  student_ids: string[];
  new_requirements: any;
}

interface StudentLevelChangedJob {
  student_id: string;
  old_level: number;
  new_level: number;
}

// ============================================================================
// 处理器注册
// ============================================================================

/**
 * 处理需求变更后的匹配重算
 * 并发数：5个
 */
matchingQueue.process('recalculate-matches', 5, async (job) => {
  const { task_id, student_ids, new_requirements } = job.data as RecalculateMatchesJob;
  
  logger.info(`🔄 Recalculating matches for task ${task_id}, ${student_ids.length} students`);
  
  const results = [];
  let completed = 0;
  
  // 并行处理学生匹配
  for (const studentId of student_ids) {
    try {
      // 重新计算匹配分数
      const newScore = await crossPlatformService.recalculateMatchScore(
        studentId,
        task_id,
        new_requirements
      );
      
      results.push({
        student_id: studentId,
        new_score: newScore,
        status: 'success'
      });
      
      completed++;
      
      // 更新进度
      job.progress((completed / student_ids.length) * 100);
      
      // 如果分数变化，推送通知任务到通知队列
      await notificationQueue.add('matching-score-changed', {
        student_id: studentId,
        task_id: task_id,
        new_score: newScore,
      });
      
    } catch (error: any) {
      logger.error(`Failed to recalculate for student ${studentId}:`, error);
      results.push({
        student_id: studentId,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  logger.info(`✅ Recalculation completed: ${completed}/${student_ids.length} succeeded`);
  
  return {
    completed,
    total: student_ids.length,
    results,
  };
});

/**
 * 处理学生等级变化
 * 并发数：3个
 */
matchingQueue.process('student-level-changed', 3, async (job) => {
  const { student_id, old_level, new_level } = job.data as StudentLevelChangedJob;
  
  logger.info(`🔄 Processing level change for student ${student_id}: ${old_level} → ${new_level}`);
  
  try {
    const result = await crossPlatformService.handleLevelChange(
      student_id,
      old_level,
      new_level
    );
    
    logger.info(`✅ Level change processed:`, result);
    
    return result;
  } catch (error: any) {
    logger.error(`Failed to process level change:`, error);
    throw error;
  }
});

// ============================================================================
// Worker启动
// ============================================================================

export function startMatchingWorker() {
  logger.info('🚀 Matching worker started');
  logger.info('  - recalculate-matches: concurrency 5');
  logger.info('  - student-level-changed: concurrency 3');
  
  // 监听队列事件
  matchingQueue.on('completed', (job, result) => {
    logger.info(`✅ [Matching] ${job.name} completed:`, {
      jobId: job.id,
      duration: `${Date.now() - job.timestamp}ms`,
    });
  });
  
  matchingQueue.on('failed', (job, err) => {
    logger.error(`❌ [Matching] ${job?.name} failed:`, {
      jobId: job?.id,
      error: err.message,
    });
  });
}

export default {
  startMatchingWorker,
};
