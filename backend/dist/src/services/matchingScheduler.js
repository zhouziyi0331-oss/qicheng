"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
const semanticMatchingEngine_1 = __importDefault(require("../services/semanticMatchingEngine"));
const websocketService_1 = __importDefault(require("../services/websocketService"));
/**
 * 匹配任务调度器
 * 负责自动更新任务-学生匹配结果
 */
class MatchingScheduler {
    constructor() {
        this.dailyMatchJob = null;
    }
    /**
     * 启动调度器
     */
    start() {
        // 每天凌晨3点自动重新匹配所有开放任务
        this.dailyMatchJob = node_cron_1.default.schedule('0 3 * * *', async () => {
            logger_1.default.info('Starting daily matching task...');
            await this.rematchAllOpenTasks();
        });
        logger_1.default.info('Matching scheduler started');
    }
    /**
     * 停止调度器
     */
    stop() {
        if (this.dailyMatchJob) {
            this.dailyMatchJob.stop();
            logger_1.default.info('Matching scheduler stopped');
        }
    }
    /**
     * 重新匹配所有开放任务
     */
    async rematchAllOpenTasks() {
        try {
            // 获取所有开放且启用匹配的任务
            const tasks = await (0, db_1.query)(`SELECT id, title, company_id
         FROM tasks
         WHERE status = 'open'
           AND matching_enabled = true
         ORDER BY created_at DESC`);
            logger_1.default.info(`Found ${tasks.length} open tasks to rematch`);
            let successCount = 0;
            let errorCount = 0;
            for (const task of tasks) {
                try {
                    await this.rematchTask(task.id, task.company_id);
                    successCount++;
                    // 避免过载
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                catch (error) {
                    errorCount++;
                    logger_1.default.error(`Failed to rematch task ${task.id}:`, error);
                }
            }
            logger_1.default.info(`Daily matching completed: ${successCount} success, ${errorCount} errors`);
        }
        catch (error) {
            logger_1.default.error('Failed to rematch all open tasks:', error);
        }
    }
    /**
     * 重新匹配单个任务
     */
    async rematchTask(taskId, companyId) {
        try {
            logger_1.default.info(`Rematching task ${taskId}...`);
            // 1. 找出最匹配的学生
            const matches = await semanticMatchingEngine_1.default.findBestStudentsForTask(taskId, 100);
            if (matches.length === 0) {
                logger_1.default.warn(`No matches found for task ${taskId}`);
                return;
            }
            // 2. 删除旧的匹配记录（保留已推送的）
            await (0, db_1.query)(`DELETE FROM task_student_matches
         WHERE task_id = $1 AND is_pushed = false`, [taskId]);
            // 3. 保存新的匹配结果
            for (const match of matches) {
                await (0, db_1.query)(`INSERT INTO task_student_matches (
            task_id, student_id, overall_score,
            skill_match_score, difficulty_match_score, domain_match_score,
            growth_potential_score, reliability_score, preference_score,
            match_breakdown, rank_in_task
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (task_id, student_id) DO UPDATE SET
            overall_score = EXCLUDED.overall_score,
            skill_match_score = EXCLUDED.skill_match_score_score,
            difficulty_match_score = EXCLUDED.difficulty_match_score_score,
            domain_match_score = EXCLUDED.domain_match_score_score,
            growth_potential_score = EXCLUDED.growth_potential_score_score,
            reliability_score = EXCLUDED.reliability_score_score,
            preference_score = EXCLUDED.preference_score,
            match_breakdown = EXCLUDED.match_breakdown,
            rank_in_task = EXCLUDED.rank_in_task,
            created_at = NOW()`, [
                    taskId,
                    match.student_id,
                    match.match_score.overall_score,
                    match.match_score.skill_match_score.score,
                    match.match_score.difficulty_match_score.score,
                    match.match_score.domain_match_score.score,
                    match.match_score.growth_potential_score.score,
                    match.match_score.reliability_score.score,
                    match.match_score.preference_score.score,
                    JSON.stringify(match.match_score.match_breakdown),
                    match.rank,
                ]);
            }
            // 4. 更新任务的匹配状态
            await (0, db_1.query)(`UPDATE tasks SET
          matched_students_count = $1,
          top_match_score = $2,
          matching_completed_at = NOW()
         WHERE id = $3`, [matches.length, matches[0].match_score.overall_score, taskId]);
            // 5. 通知企业（如果有新的高分匹配）
            const topScore = matches[0].match_score.overall_score;
            if (topScore > 0.8) {
                websocketService_1.default.notifyMatchComplete(companyId, taskId, matches.length);
            }
            logger_1.default.info(`Task ${taskId} rematched: ${matches.length} students, top score: ${topScore}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to rematch task ${taskId}:`, error);
            throw error;
        }
    }
    /**
     * 新学生完成OPC测评后，触发增量匹配
     */
    async matchNewStudentToOpenTasks(student_id) {
        try {
            logger_1.default.info(`Matching new student ${student_id} to open tasks...`);
            // 获取所有开放任务
            const tasks = await (0, db_1.query)(`SELECT id, title, company_id
         FROM tasks
         WHERE status = 'open'
           AND matching_enabled = true
         ORDER BY created_at DESC
         LIMIT 50`);
            if (tasks.length === 0) {
                logger_1.default.info('No open tasks to match');
                return;
            }
            let matchedCount = 0;
            for (const task of tasks) {
                try {
                    // 计算这个学生与任务的匹配度
                    const match_score = await semanticMatchingEngine_1.default.matchTaskWithStudent(task.id, student_id);
                    // 只保存匹配度 > 0.5 的结果
                    if (match_score.overall_score > 0.5) {
                        // 获取当前任务的匹配学生数量
                        const currentMatches = await (0, db_1.queryOne)(`SELECT COUNT(*) as count FROM task_student_matches WHERE task_id = $1`, [task.id]);
                        const rank = (currentMatches?.count || 0) + 1;
                        // 保存匹配结果
                        await (0, db_1.query)(`INSERT INTO task_student_matches (
                task_id, student_id, overall_score,
                skill_match_score, difficulty_match_score, domain_match_score,
                growth_potential_score, reliability_score, preference_score,
                match_breakdown, rank_in_task
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              ON CONFLICT (task_id, student_id) DO UPDATE SET
                overall_score = EXCLUDED.overall_score,
                skill_match_score = EXCLUDED.skill_match_score_score,
                difficulty_match_score = EXCLUDED.difficulty_match_score_score,
                domain_match_score = EXCLUDED.domain_match_score_score,
                growth_potential_score = EXCLUDED.growth_potential_score_score,
                reliability_score = EXCLUDED.reliability_score_score,
                preference_score = EXCLUDED.preference_score,
                match_breakdown = EXCLUDED.match_breakdown,
                rank_in_task = EXCLUDED.rank_in_task`, [
                            task.id,
                            student_id,
                            match_score.overall_score,
                            match_score.skill_match_score.score,
                            match_score.difficulty_match_score.score,
                            match_score.domain_match_score.score,
                            match_score.growth_potential_score.score,
                            match_score.reliability_score.score,
                            match_score.preference_score.score,
                            JSON.stringify(match_score.match_breakdown),
                            rank,
                        ]);
                        matchedCount++;
                        // 如果匹配度很高（Top 10），通知企业
                        if (match_score.overall_score > 0.8 && rank <= 10) {
                            websocketService_1.default.notifyMatchComplete(task.company_id, task.id, 1);
                        }
                    }
                    // 避免过载
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                catch (error) {
                    logger_1.default.error(`Failed to match student ${student_id} with task ${task.id}:`, error);
                }
            }
            logger_1.default.info(`New student ${student_id} matched to ${matchedCount} tasks`);
        }
        catch (error) {
            logger_1.default.error(`Failed to match new student ${student_id}:`, error);
        }
    }
    /**
     * 手动触发重新匹配（供API调用）
     */
    async triggerRematch(taskId, companyId) {
        await this.rematchTask(taskId, companyId);
    }
    /**
     * 新任务发布后，立即匹配到所有学生
     */
    async matchTaskToAllStudents(taskId) {
        try {
            logger_1.default.info(`Matching new task ${taskId} to all students...`);
            // 获取任务信息
            const task = await (0, db_1.queryOne)(`SELECT id, title, company_id FROM tasks WHERE id = $1`, [taskId]);
            if (!task) {
                logger_1.default.error(`Task ${taskId} not found`);
                return;
            }
            // 找出最匹配的学生（Top 100）
            const matches = await semanticMatchingEngine_1.default.findBestStudentsForTask(taskId, 100);
            if (matches.length === 0) {
                logger_1.default.warn(`No matches found for new task ${taskId}`);
                return;
            }
            // 保存匹配结果
            for (const match of matches) {
                await (0, db_1.query)(`INSERT INTO task_student_matches (
            task_id, student_id, overall_score,
            skill_match_score, difficulty_match_score, domain_match_score,
            growth_potential_score, reliability_score, preference_score,
            match_breakdown, rank_in_task
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (task_id, student_id) DO UPDATE SET
            overall_score = EXCLUDED.overall_score,
            skill_match_score = EXCLUDED.skill_match_score_score,
            difficulty_match_score = EXCLUDED.difficulty_match_score_score,
            domain_match_score = EXCLUDED.domain_match_score_score,
            growth_potential_score = EXCLUDED.growth_potential_score_score,
            reliability_score = EXCLUDED.reliability_score_score,
            preference_score = EXCLUDED.preference_score,
            match_breakdown = EXCLUDED.match_breakdown,
            rank_in_task = EXCLUDED.rank_in_task,
            created_at = NOW()`, [
                    taskId,
                    match.student_id,
                    match.match_score.overall_score,
                    match.match_score.skill_match_score.score,
                    match.match_score.difficulty_match_score.score,
                    match.match_score.domain_match_score.score,
                    match.match_score.growth_potential_score.score,
                    match.match_score.reliability_score.score,
                    match.match_score.preference_score.score,
                    JSON.stringify(match.match_score.match_breakdown),
                    match.rank,
                ]);
            }
            // 更新任务的匹配状态
            await (0, db_1.query)(`UPDATE tasks SET
          matched_students_count = $1,
          top_match_score = $2,
          matching_completed_at = NOW()
         WHERE id = $3`, [matches.length, matches[0].match_score.overall_score, taskId]);
            // 通知企业匹配完成
            const topScore = matches[0].match_score.overall_score;
            websocketService_1.default.notifyMatchComplete(task.company_id, taskId, matches.length);
            // 通知Top 5学生有新的推荐任务
            const topStudents = matches.slice(0, 5);
            for (const match of topStudents) {
                websocketService_1.default.notifyTaskRecommendation(match.student_id, {
                    taskId: task.id,
                    taskTitle: task.title,
                    message: `有一个新任务很适合你（匹配度${(match.match_score.overall_score * 100).toFixed(0)}%）`,
                });
            }
            logger_1.default.info(`New task ${taskId} matched to ${matches.length} students, top score: ${topScore}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to match new task ${taskId} to students:`, error);
            throw error;
        }
    }
}
exports.default = new MatchingScheduler();
//# sourceMappingURL=matchingScheduler.js.map