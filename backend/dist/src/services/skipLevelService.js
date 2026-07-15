"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
/**
 * 跳级系统服务层
 */
class SkipLevelService {
    /**
     * 检查跳级资格
     */
    async checkEligibility(studentId) {
        const [students] = await database_1.pool.query('SELECT level, level_name FROM students WHERE id = ?', [studentId]);
        if (!students || students.length === 0) {
            throw new Error('学员不存在');
        }
        const student = students[0];
        const currentLevel = student.level;
        // 检查级别要求
        if (currentLevel < 3) {
            return {
                eligible: false,
                currentLevel,
                currentLevelName: student.level_name,
                reason: '需要达到 Lv.3 才能申请跳级',
                canSkipTo: []
            };
        }
        // 检查冷却期
        const [cooldowns] = await database_1.pool.query('SELECT levels_required, levels_completed FROM skip_level_cooldowns WHERE student_id = ? AND levels_completed < levels_required ORDER BY id DESC LIMIT 1', [studentId]);
        if (cooldowns && cooldowns.length > 0) {
            const cooldown = cooldowns[0];
            return {
                eligible: false,
                currentLevel,
                currentLevelName: student.level_name,
                reason: `需要正常升满 ${cooldown.levels_required - cooldown.levels_completed} 级后才能再次申请`,
                canSkipTo: [],
                cooldownLevels: cooldown.levels_required - cooldown.levels_completed
            };
        }
        // 检查是否有进行中的任务
        const [activeTasks] = await database_1.pool.query('SELECT id FROM skip_level_applications WHERE student_id = ? AND status IN ("pending", "in_progress", "submitted")', [studentId]);
        if (activeTasks && activeTasks.length > 0) {
            return {
                eligible: false,
                currentLevel,
                currentLevelName: student.level_name,
                reason: '已有进行中的跳级任务',
                canSkipTo: []
            };
        }
        // 计算可跳级的目标级别
        const canSkipTo = [];
        if (currentLevel === 3)
            canSkipTo.push(4, 5);
        else if (currentLevel === 4)
            canSkipTo.push(5, 6);
        else if (currentLevel === 5)
            canSkipTo.push(6);
        return {
            eligible: true,
            currentLevel,
            currentLevelName: student.level_name,
            canSkipTo,
            cooldownLevels: 0
        };
    }
    /**
     * 申请跳级
     */
    async applySkipLevel(studentId, targetLevel) {
        // 再次验证资格
        const eligibility = await this.checkEligibility(studentId);
        if (!eligibility.eligible) {
            throw new Error(eligibility.reason || '不符合跳级条件');
        }
        if (!eligibility.canSkipTo.includes(targetLevel)) {
            throw new Error('目标级别无效');
        }
        const [students] = await database_1.pool.query('SELECT level, track_name FROM students WHERE id = ?', [studentId]);
        const student = students[0];
        // 生成任务ID
        const taskId = `skip_task_${Date.now()}_${studentId}`;
        // 计算截止时间（7天后）
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7);
        // 创建申请记录
        await database_1.pool.query('INSERT INTO skip_level_applications (student_id, from_level, target_level, track_name, task_id, deadline, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [studentId, student.level, targetLevel, student.track_name, taskId, deadline, 'pending']);
        // 获取application_id
        const [applications] = await database_1.pool.query('SELECT id FROM skip_level_applications WHERE task_id = ?', [taskId]);
        const applicationId = applications[0].id;
        // 创建任务详情
        const taskName = `Lv.${student.level} → Lv.${targetLevel} 跳级任务`;
        const description = targetLevel === 4
            ? '打造一个完整的内容矩阵'
            : '构建完整内容IP';
        const requirements = [
            { id: 1, icon: '⏰', text: '7天内完成所有任务，逾期视为失败' },
            { id: 2, icon: '📝', text: '在至少 2 个平台各发布 1 篇以上内容，共 3 篇' },
            { id: 3, icon: '📊', text: '提交数据分析报告，包含阅读量、互动率等核心指标' },
            { id: 4, icon: '👨‍🏫', text: '获得至少 1 位导师的评审确认' }
        ];
        await database_1.pool.query('INSERT INTO skip_level_tasks (id, application_id, name, description, requirements) VALUES (?, ?, ?, ?, ?)', [taskId, applicationId, taskName, description, JSON.stringify(requirements)]);
        // 初始化子任务
        const subTasks = [
            { id: 1, name: 'AI 短视频脚本创作', xp: 120, status: 'locked' },
            { id: 2, name: 'AI 视频素材生成', xp: 150, status: 'locked' },
            { id: 3, name: '品牌宣传内容策划', xp: 200, status: 'locked' },
            { id: 4, name: '长篇内容创作发布', xp: 180, status: 'locked' },
            { id: 5, name: `Lv.${targetLevel} 综合测试`, xp: 350, status: 'locked' }
        ];
        for (const task of subTasks) {
            await database_1.pool.query('INSERT INTO skip_level_progress (task_id, sub_task_id, sub_task_name, xp, status) VALUES (?, ?, ?, ?, ?)', [taskId, task.id, task.name, task.xp, task.status]);
        }
        return {
            taskId,
            deadline: deadline.toISOString()
        };
    }
    /**
     * 获取任务详情
     */
    async getTask(taskId, studentId) {
        const [tasks] = await database_1.pool.query(`SELECT t.*, a.from_level, a.target_level, a.track_name, a.deadline, a.status
       FROM skip_level_tasks t
       JOIN skip_level_applications a ON t.application_id = a.id
       WHERE t.id = ? AND a.student_id = ?`, [taskId, studentId]);
        if (!tasks || tasks.length === 0) {
            throw new Error('任务不存在');
        }
        const task = tasks[0];
        return {
            id: task.id,
            fromLevel: task.from_level,
            toLevel: task.target_level,
            name: task.name,
            description: task.description,
            requirements: JSON.parse(task.requirements),
            deadline: Math.ceil((new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            trackName: task.track_name,
            passScore: task.pass_score || 80
        };
    }
    /**
     * 领取任务（开始计时）
     */
    async receiveTask(taskId, studentId) {
        // 验证任务归属
        const [applications] = await database_1.pool.query('SELECT id, status FROM skip_level_applications WHERE task_id = ? AND student_id = ?', [taskId, studentId]);
        if (!applications || applications.length === 0) {
            throw new Error('任务不存在');
        }
        if (applications[0].status !== 'pending') {
            throw new Error('任务已被领取');
        }
        // 更新状态为进行中
        await database_1.pool.query('UPDATE skip_level_applications SET status = "in_progress" WHERE task_id = ?', [taskId]);
        // 解锁第一个子任务
        await database_1.pool.query('UPDATE skip_level_progress SET status = "active" WHERE task_id = ? AND sub_task_id = 1', [taskId]);
        return { success: true };
    }
    /**
     * 获取任务进度
     */
    async getProgress(taskId, studentId) {
        // 验证归属
        const [applications] = await database_1.pool.query('SELECT from_level, target_level, track_name, deadline FROM skip_level_applications WHERE task_id = ? AND student_id = ?', [taskId, studentId]);
        if (!applications || applications.length === 0) {
            throw new Error('任务不存在');
        }
        const app = applications[0];
        const daysLeft = Math.ceil((new Date(app.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        // 获取子任务
        const [subTasks] = await database_1.pool.query('SELECT sub_task_id as id, sub_task_name as name, sub_task_name as desc, xp, status, progress FROM skip_level_progress WHERE task_id = ? ORDER BY sub_task_id', [taskId]);
        const completed = subTasks.filter(t => t.status === 'done').length;
        const totalProgress = Math.round((completed / subTasks.length) * 100);
        return {
            taskId,
            fromLevel: app.from_level,
            toLevel: app.target_level,
            trackName: app.track_name,
            daysLeft,
            totalProgress,
            completedTasks: completed,
            totalTasks: subTasks.length,
            subTasks
        };
    }
    /**
     * 更新子任务进度
     */
    async updateSubTaskProgress(taskId, subTaskId, progress, studentId) {
        // 验证归属
        const [applications] = await database_1.pool.query('SELECT id FROM skip_level_applications WHERE task_id = ? AND student_id = ?', [taskId, studentId]);
        if (!applications || applications.length === 0) {
            throw new Error('任务不存在');
        }
        // 更新进度
        await database_1.pool.query('UPDATE skip_level_progress SET progress = ? WHERE task_id = ? AND sub_task_id = ?', [progress, taskId, subTaskId]);
        // 如果完成，更新状态并解锁下一个
        if (progress >= 100) {
            await database_1.pool.query('UPDATE skip_level_progress SET status = "done", completed_at = NOW() WHERE task_id = ? AND sub_task_id = ?', [taskId, subTaskId]);
            // 解锁下一个任务
            await database_1.pool.query('UPDATE skip_level_progress SET status = "active" WHERE task_id = ? AND sub_task_id = ?', [taskId, subTaskId + 1]);
        }
        return { success: true };
    }
    /**
     * 提交作品
     */
    async submitWork(taskId, workData, studentId) {
        // 验证归属
        const [applications] = await database_1.pool.query('SELECT id FROM skip_level_applications WHERE task_id = ? AND student_id = ?', [taskId, studentId]);
        if (!applications || applications.length === 0) {
            throw new Error('任务不存在');
        }
        // 保存提交
        await database_1.pool.query('INSERT INTO skip_level_submissions (task_id, submission_type, content) VALUES (?, ?, ?)', [taskId, workData.type, JSON.stringify(workData.content)]);
        return { success: true };
    }
    /**
     * 申请评分
     */
    async requestScore(taskId, studentId) {
        // 验证归属和状态
        const [applications] = await database_1.pool.query('SELECT id, status FROM skip_level_applications WHERE task_id = ? AND student_id = ?', [taskId, studentId]);
        if (!applications || applications.length === 0) {
            throw new Error('任务不存在');
        }
        if (applications[0].status !== 'in_progress') {
            throw new Error('任务状态错误');
        }
        // 更新状态
        await database_1.pool.query('UPDATE skip_level_applications SET status = "submitted" WHERE task_id = ?', [taskId]);
        // TODO: 通知导师评分（可以发送消息或邮件）
        return { success: true };
    }
    /**
     * 获取评分结果
     */
    async getScore(taskId, studentId) {
        // 验证归属
        const [applications] = await database_1.pool.query('SELECT id FROM skip_level_applications WHERE task_id = ? AND student_id = ?', [taskId, studentId]);
        if (!applications || applications.length === 0) {
            throw new Error('任务不存在');
        }
        // 获取评分
        const [scores] = await database_1.pool.query(`SELECT s.*, m.name as mentor_name, m.role as mentor_role
       FROM skip_level_scores s
       LEFT JOIN mentors m ON s.mentor_id = m.id
       WHERE s.task_id = ?`, [taskId]);
        if (!scores || scores.length === 0) {
            throw new Error('评分未完成');
        }
        const score = scores[0];
        return {
            totalScore: score.total_score,
            passed: score.total_score >= 80,
            passLine: 80,
            breakdown: JSON.parse(score.breakdown),
            mentorName: score.mentor_name || '导师',
            mentorRole: score.mentor_role || '高级导师',
            mentorComment: score.mentor_comment || ''
        };
    }
    /**
     * 获取奖励
     */
    async getRewards(taskId, studentId) {
        const score = await this.getScore(taskId, studentId);
        if (!score.passed) {
            throw new Error('未通过跳级');
        }
        return {
            xp: 500,
            bonus: 200,
            badge: '跳级徽章'
        };
    }
    /**
     * 领取奖励
     */
    async claimRewards(taskId, studentId) {
        const connection = await database_1.pool.getConnection();
        try {
            await connection.beginTransaction();
            // 验证评分
            const score = await this.getScore(taskId, studentId);
            if (!score.passed) {
                throw new Error('未通过跳级');
            }
            // 获取目标级别
            const [applications] = await connection.query('SELECT target_level, status FROM skip_level_applications WHERE task_id = ? AND student_id = ?', [taskId, studentId]);
            if (applications[0].status === 'passed') {
                throw new Error('奖励已领取');
            }
            // 更新学员级别
            await connection.query('UPDATE students SET level = ?, xp = xp + 500, balance = balance + 200 WHERE id = ?', [applications[0].target_level, studentId]);
            // 更新申请状态
            await connection.query('UPDATE skip_level_applications SET status = "passed" WHERE task_id = ?', [taskId]);
            // 添加徽章
            await connection.query('INSERT INTO badges (student_id, badge_type, badge_name, earned_at) VALUES (?, ?, ?, NOW())', [studentId, 'skip_level', '跳级徽章']);
            await connection.commit();
            return { success: true };
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    /**
     * 获取改进建议
     */
    async getImprovementGuide(taskId, studentId) {
        const score = await this.getScore(taskId, studentId);
        // 分析弱项
        const breakdown = score.breakdown;
        const weakItems = breakdown
            .filter(item => item.score < 80)
            .map(item => ({
            name: item.name,
            score: item.score,
            gap: 80 - item.score,
            tip: `${item.name}方面还需加强`,
            color: item.color
        }));
        // 生成建议
        const suggestions = [
            {
                icon: '📊',
                iconBg: 'rgba(190, 215, 209, 0.15)',
                name: '学习数据分析框架',
                desc: '推荐从「阅读量 → 完读率 → 互动率 → 转化率」这条链路入手。',
                tag: '重点推荐',
                tagColor: 'tag-mist'
            }
        ];
        return {
            weakItems,
            suggestions
        };
    }
}
exports.default = new SkipLevelService();
//# sourceMappingURL=skipLevelService.js.map