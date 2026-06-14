import cron from 'node-cron';
import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';
import semanticMatchingEngine from '../services/semanticMatchingEngine';
import websocketService from '../services/websocketService';

/**
 * 匹配任务调度器
 * 负责自动更新任务-学生匹配结果
 */

class MatchingScheduler {
  private dailyMatchJob: cron.ScheduledTask | null = null;

  /**
   * 启动调度器
   */
  start() {
    // 每天凌晨3点自动重新匹配所有开放任务
    this.dailyMatchJob = cron.schedule('0 3 * * *', async () => {
      logger.info('Starting daily matching task...');
      await this.rematchAllOpenTasks();
    });

    logger.info('Matching scheduler started');
  }

  /**
   * 停止调度器
   */
  stop() {
    if (this.dailyMatchJob) {
      this.dailyMatchJob.stop();
      logger.info('Matching scheduler stopped');
    }
  }

  /**
   * 重新匹配所有开放任务
   */
  async rematchAllOpenTasks(): Promise<void> {
    try {
      // 获取所有开放且启用匹配的任务
      const tasks = await query<{ id: string; title: string; company_id: string }>(
        `SELECT id, title, company_id
         FROM tasks
         WHERE status = 'open'
           AND matching_enabled = true
         ORDER BY created_at DESC`
      );

      logger.info(`Found ${tasks.rows.length} open tasks to rematch`);

      let successCount = 0;
      let errorCount = 0;

      for (const task of tasks.rows) {
        try {
          await this.rematchTask(task.id, task.company_id);
          successCount++;

          // 避免过载
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error: any) {
          errorCount++;
          logger.error(`Failed to rematch task ${task.id}:`, error);
        }
      }

      logger.info(`Daily matching completed: ${successCount} success, ${errorCount} errors`);
    } catch (error: any) {
      logger.error('Failed to rematch all open tasks:', error);
    }
  }

  /**
   * 重新匹配单个任务
   */
  async rematchTask(taskId: string, companyId: string): Promise<void> {
    try {
      logger.info(`Rematching task ${taskId}...`);

      // 1. 找出最匹配的学生
      const matches = await semanticMatchingEngine.findBestStudentsForTask(taskId, 100);

      if (matches.length === 0) {
        logger.warn(`No matches found for task ${taskId}`);
        return;
      }

      // 2. 删除旧的匹配记录（保留已推送的）
      await query(
        `DELETE FROM task_student_matches
         WHERE task_id = $1 AND is_pushed = false`,
        [taskId]
      );

      // 3. 保存新的匹配结果
      for (const match of matches) {
        await query(
          `INSERT INTO task_student_matches (
            task_id, student_id, overall_score,
            skill_match_score, difficulty_match_score, domain_match_score,
            growth_potential_score, reliability_score, preference_score,
            match_breakdown, rank_in_task
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (task_id, student_id) DO UPDATE SET
            overall_score = EXCLUDED.overall_score,
            skill_match_score = EXCLUDED.skill_match_score,
            difficulty_match_score = EXCLUDED.difficulty_match_score,
            domain_match_score = EXCLUDED.domain_match_score,
            growth_potential_score = EXCLUDED.growth_potential_score,
            reliability_score = EXCLUDED.reliability_score,
            preference_score = EXCLUDED.preference_score,
            match_breakdown = EXCLUDED.match_breakdown,
            rank_in_task = EXCLUDED.rank_in_task,
            created_at = NOW()`,
          [
            taskId,
            match.student_id,
            match.match_score.overall_score,
            match.match_score.skillMatch.score,
            match.match_score.difficultyMatch.score,
            match.match_score.domainMatch.score,
            match.match_score.growth_potential.score,
            match.match_score.reliability.score,
            match.match_score.preference_alignment.score,
            JSON.stringify(match.match_score.breakdown),
            match.rank,
          ]
        );
      }

      // 4. 更新任务的匹配状态
      await query(
        `UPDATE tasks SET
          matched_students_count = $1,
          top_match_score = $2,
          matching_completed_at = NOW()
         WHERE id = $3`,
        [matches.length, matches[0].match_score.overall_score, taskId]
      );

      // 5. 通知企业（如果有新的高分匹配）
      const topScore = matches[0].match_score.overall_score;
      if (topScore > 0.8) {
        websocketService.notifyMatchComplete(companyId, taskId, matches.length);
      }

      logger.info(`Task ${taskId} rematched: ${matches.length} students, top score: ${topScore}`);
    } catch (error: any) {
      logger.error(`Failed to rematch task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 新学生完成OPC测评后，触发增量匹配
   */
  async matchNewStudentToOpenTasks(student_id: string): Promise<void> {
    try {
      logger.info(`Matching new student ${student_id} to open tasks...`);

      // 获取所有开放任务
      const tasks = await query<{ id: string; title: string; company_id: string }>(
        `SELECT id, title, company_id
         FROM tasks
         WHERE status = 'open'
           AND matching_enabled = true
         ORDER BY created_at DESC
         LIMIT 50`
      );

      if (tasks.rows.length === 0) {
        logger.info('No open tasks to match');
        return;
      }

      let matchedCount = 0;

      for (const task of tasks.rows) {
        try {
          // 计算这个学生与任务的匹配度
          const match_score = await semanticMatchingEngine.matchTaskWithStudent(task.id, student_id);

          // 只保存匹配度 > 0.5 的结果
          if (match_score.overall_score > 0.5) {
            // 获取当前任务的匹配学生数量
            const currentMatches = await queryOne<{ count: number }>(
              `SELECT COUNT(*) as count FROM task_student_matches WHERE task_id = $1`,
              [task.id]
            );

            const rank = (currentMatches?.count || 0) + 1;

            // 保存匹配结果
            await query(
              `INSERT INTO task_student_matches (
                task_id, student_id, overall_score,
                skill_match_score, difficulty_match_score, domain_match_score,
                growth_potential_score, reliability_score, preference_score,
                match_breakdown, rank_in_task
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              ON CONFLICT (task_id, student_id) DO UPDATE SET
                overall_score = EXCLUDED.overall_score,
                skill_match_score = EXCLUDED.skill_match_score,
                difficulty_match_score = EXCLUDED.difficulty_match_score,
                domain_match_score = EXCLUDED.domain_match_score,
                growth_potential_score = EXCLUDED.growth_potential_score,
                reliability_score = EXCLUDED.reliability_score,
                preference_score = EXCLUDED.preference_score,
                match_breakdown = EXCLUDED.match_breakdown,
                rank_in_task = EXCLUDED.rank_in_task`,
              [
                task.id,
                student_id,
                match_score.overall_score,
                match_score.skillMatch.score,
                match_score.difficultyMatch.score,
                match_score.domainMatch.score,
                match_score.growth_potential.score,
                match_score.reliability.score,
                match_score.preference_alignment.score,
                JSON.stringify(match_score.breakdown),
                rank,
              ]
            );

            matchedCount++;

            // 如果匹配度很高（Top 10），通知企业
            if (match_score.overall_score > 0.8 && rank <= 10) {
              websocketService.notifyMatchComplete(task.company_id, task.id, 1);
            }
          }

          // 避免过载
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          logger.error(`Failed to match student ${student_id} with task ${task.id}:`, error);
        }
      }

      logger.info(`New student ${student_id} matched to ${matchedCount} tasks`);
    } catch (error: any) {
      logger.error(`Failed to match new student ${student_id}:`, error);
    }
  }

  /**
   * 手动触发重新匹配（供API调用）
   */
  async triggerRematch(taskId: string, companyId: string): Promise<void> {
    await this.rematchTask(taskId, companyId);
  }

  /**
   * 新任务发布后，立即匹配到所有学生
   */
  async matchTaskToAllStudents(taskId: string): Promise<void> {
    try {
      logger.info(`Matching new task ${taskId} to all students...`);

      // 获取任务信息
      const task = await queryOne<{ id: string; title: string; company_id: string }>(
        `SELECT id, title, company_id FROM tasks WHERE id = $1`,
        [taskId]
      );

      if (!task) {
        logger.error(`Task ${taskId} not found`);
        return;
      }

      // 找出最匹配的学生（Top 100）
      const matches = await semanticMatchingEngine.findBestStudentsForTask(taskId, 100);

      if (matches.length === 0) {
        logger.warn(`No matches found for new task ${taskId}`);
        return;
      }

      // 保存匹配结果
      for (const match of matches) {
        await query(
          `INSERT INTO task_student_matches (
            task_id, student_id, overall_score,
            skill_match_score, difficulty_match_score, domain_match_score,
            growth_potential_score, reliability_score, preference_score,
            match_breakdown, rank_in_task
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (task_id, student_id) DO UPDATE SET
            overall_score = EXCLUDED.overall_score,
            skill_match_score = EXCLUDED.skill_match_score,
            difficulty_match_score = EXCLUDED.difficulty_match_score,
            domain_match_score = EXCLUDED.domain_match_score,
            growth_potential_score = EXCLUDED.growth_potential_score,
            reliability_score = EXCLUDED.reliability_score,
            preference_score = EXCLUDED.preference_score,
            match_breakdown = EXCLUDED.match_breakdown,
            rank_in_task = EXCLUDED.rank_in_task,
            created_at = NOW()`,
          [
            taskId,
            match.student_id,
            match.match_score.overall_score,
            match.match_score.skillMatch.score,
            match.match_score.difficultyMatch.score,
            match.match_score.domainMatch.score,
            match.match_score.growth_potential.score,
            match.match_score.reliability.score,
            match.match_score.preference_alignment.score,
            JSON.stringify(match.match_score.breakdown),
            match.rank,
          ]
        );
      }

      // 更新任务的匹配状态
      await query(
        `UPDATE tasks SET
          matched_students_count = $1,
          top_match_score = $2,
          matching_completed_at = NOW()
         WHERE id = $3`,
        [matches.length, matches[0].match_score.overall_score, taskId]
      );

      // 通知企业匹配完成
      const topScore = matches[0].match_score.overall_score;
      websocketService.notifyMatchComplete(task.company_id, taskId, matches.length);

      // 通知Top 5学生有新的推荐任务
      const topStudents = matches.slice(0, 5);
      for (const match of topStudents) {
        websocketService.notifyTaskRecommendation(match.student_id, {
          taskId: task.id,
          taskTitle: task.title,
          message: `有一个新任务很适合你（匹配度${(match.match_score.overall_score * 100).toFixed(0)}%）`,
        });
      }

      logger.info(`New task ${taskId} matched to ${matches.length} students, top score: ${topScore}`);
    } catch (error: any) {
      logger.error(`Failed to match new task ${taskId} to students:`, error);
      throw error;
    }
  }
}

export default new MatchingScheduler();
