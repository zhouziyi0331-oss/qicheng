"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
/**
 * E-07: 学生成长轨迹服务
 * 追踪和可视化学生的成长历程
 */
class StudentGrowthService {
    /**
     * 获取学生成长时间轴
     */
    async getGrowthTimeline(studentId, options = {}) {
        const { startDate, endDate, eventTypes, limit = 50 } = options;
        // 构建查询条件
        let eventQuery = `
      SELECT * FROM student_growth_events
      WHERE student_id = $1
    `;
        const eventParams = [studentId];
        let paramIndex = 2;
        if (startDate) {
            eventQuery += ` AND event_date >= $${paramIndex}`;
            eventParams.push(startDate);
            paramIndex++;
        }
        if (endDate) {
            eventQuery += ` AND event_date <= $${paramIndex}`;
            eventParams.push(endDate);
            paramIndex++;
        }
        if (eventTypes && eventTypes.length > 0) {
            eventQuery += ` AND event_type = ANY($${paramIndex})`;
            eventParams.push(eventTypes);
            paramIndex++;
        }
        eventQuery += ` ORDER BY event_date DESC LIMIT $${paramIndex}`;
        eventParams.push(limit);
        // 并行查询所有数据
        const [eventsResult, milestonesResult, skillsResult] = await Promise.all([
            database_1.pool.query(eventQuery, eventParams),
            database_1.pool.query(`SELECT * FROM student_milestones
         WHERE student_id = $1
         ORDER BY unlocked_at DESC`, [studentId]),
            database_1.pool.query(`SELECT * FROM student_skill_evolution
         WHERE student_id = $1
         ORDER BY current_level DESC, current_proficiency DESC`, [studentId]),
        ]);
        const events = eventsResult.rows;
        const milestones = milestonesResult.rows;
        const skillEvolution = skillsResult.rows;
        // 计算摘要统计
        const highImpactEvents = events.filter((e) => e.impact_score >= 0.7).length;
        const skillsMastered = skillEvolution.filter((s) => s.current_level >= 5).length;
        const recentTrend = this.calculateGrowthTrend(events);
        return {
            events,
            milestones,
            skill_evolution: skillEvolution,
            summary: {
                total_events: events.length,
                total_milestones: milestones.length,
                high_impact_events: highImpactEvents,
                skills_mastered: skillsMastered,
                growth_trend: recentTrend,
            },
        };
    }
    /**
     * 记录成长事件
     */
    async recordGrowthEvent(data) {
        const { studentId, eventType, title, description, impactScore, relatedTaskId, relatedSkill, metricChange, eventDate = new Date(), } = data;
        const result = await database_1.pool.query(`INSERT INTO student_growth_events
       (id, student_id, event_type, title, description, impact_score,
        related_task_id, related_skill, metric_change, event_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (student_id, event_type, event_date) DO UPDATE
       SET title = EXCLUDED.title,
           description = EXCLUDED.description,
           impact_score = EXCLUDED.impact_score
       RETURNING *`, [
            (0, uuid_1.v4)(),
            studentId,
            eventType,
            title,
            description,
            impactScore,
            relatedTaskId,
            relatedSkill,
            metricChange ? JSON.stringify(metricChange) : null,
            eventDate,
        ]);
        // 检查是否触发新里程碑
        await this.checkAndUnlockMilestones(studentId);
        return result.rows[0];
    }
    /**
     * 任务完成后自动记录成长事件
     */
    async recordTaskCompletionEvent(studentId, taskId, taskTitle, rating) {
        const impactScore = this.calculateImpactScore(rating);
        await this.recordGrowthEvent({
            studentId,
            eventType: 'task_completed',
            title: `完成任务: ${taskTitle}`,
            description: `成功交付任务并获得${rating.toFixed(1)}星评价`,
            impactScore,
            relatedTaskId: taskId,
            metricChange: {
                metric: 'tasks_completed',
                change: '+1',
                rating: rating,
            },
        });
    }
    /**
     * 等级提升时记录事件
     */
    async recordLevelUpEvent(studentId, oldLevel, newLevel) {
        await this.recordGrowthEvent({
            studentId,
            eventType: 'level_up',
            title: `等级提升至 Lv.${newLevel}`,
            description: `从Lv.${oldLevel}成长到Lv.${newLevel}`,
            impactScore: 0.9,
            metricChange: {
                metric: 'level',
                from: oldLevel,
                to: newLevel,
                improvement: `+${newLevel - oldLevel}`,
            },
        });
    }
    /**
     * 技能习得时记录事件
     */
    async recordSkillAcquiredEvent(studentId, skillName, proficiency) {
        await this.recordGrowthEvent({
            studentId,
            eventType: 'skill_acquired',
            title: `掌握新技能: ${skillName}`,
            description: `熟练度达到${(proficiency * 100).toFixed(0)}%`,
            impactScore: proficiency * 0.8,
            relatedSkill: skillName,
            metricChange: {
                metric: 'skills',
                skill: skillName,
                proficiency: proficiency,
            },
        });
        // 更新技能进化记录
        await this.updateSkillEvolution(studentId, skillName, proficiency);
    }
    /**
     * 更新技能进化记录
     */
    async updateSkillEvolution(studentId, skillName, proficiency) {
        const level = Math.ceil(proficiency * 10); // 0.5 = level 5
        // 获取现有记录
        const existing = await database_1.pool.query(`SELECT * FROM student_skill_evolution
       WHERE student_id = $1 AND skill_name = $2`, [studentId, skillName]);
        if (existing.rows.length === 0) {
            // 新技能
            await database_1.pool.query(`INSERT INTO student_skill_evolution
         (id, student_id, skill_name, current_level, current_proficiency,
          level_history, practice_count, trend)
         VALUES ($1, $2, $3, $4, $5, $6, 1, 'rising')`, [
                (0, uuid_1.v4)(),
                studentId,
                skillName,
                level,
                proficiency,
                JSON.stringify([
                    {
                        date: new Date().toISOString().split('T')[0],
                        level,
                        proficiency,
                    },
                ]),
            ]);
        }
        else {
            // 更新现有技能
            const record = existing.rows[0];
            const levelHistory = record.level_history || [];
            levelHistory.push({
                date: new Date().toISOString().split('T')[0],
                level,
                proficiency,
            });
            // 计算成长趋势
            const trend = this.calculateSkillTrend(levelHistory);
            const growthRate = this.calculateGrowthRate(levelHistory);
            await database_1.pool.query(`UPDATE student_skill_evolution
         SET current_level = $1,
             current_proficiency = $2,
             level_history = $3,
             practice_count = practice_count + 1,
             growth_rate = $4,
             trend = $5,
             last_practiced_at = NOW(),
             updated_at = NOW()
         WHERE student_id = $6 AND skill_name = $7`, [level, proficiency, JSON.stringify(levelHistory), growthRate, trend, studentId, skillName]);
        }
    }
    /**
     * 检查并解锁里程碑
     */
    async checkAndUnlockMilestones(studentId) {
        const unlockedMilestones = [];
        // 获取学生统计数据
        const stats = await this.getStudentStats(studentId);
        // 定义里程碑规则
        const milestoneRules = [
            {
                type: 'first_task',
                condition: stats.tasks_completed >= 1,
                title: '初次出征',
                description: '完成第一个任务',
                icon: '🎯',
                color: '#3B82F6',
            },
            {
                type: 'tasks_10',
                condition: stats.tasks_completed >= 10,
                title: '小有成就',
                description: '累计完成10个任务',
                icon: '⭐',
                color: '#8B5CF6',
            },
            {
                type: 'tasks_50',
                condition: stats.tasks_completed >= 50,
                title: '经验丰富',
                description: '累计完成50个任务',
                icon: '🏆',
                color: '#F59E0B',
            },
            {
                type: 'perfect_rating',
                condition: stats.perfect_ratings >= 1,
                title: '完美交付',
                description: '首次获得5星好评',
                icon: '🌟',
                color: '#10B981',
            },
        ];
        // 检查每个里程碑
        for (const rule of milestoneRules) {
            if (rule.condition) {
                const existing = await database_1.pool.query(`SELECT * FROM student_milestones
           WHERE student_id = $1 AND milestone_type = $2`, [studentId, rule.type]);
                if (existing.rows.length === 0) {
                    // 解锁新里程碑
                    const result = await database_1.pool.query(`INSERT INTO student_milestones
             (id, student_id, milestone_type, title, description, icon, badge_color, unlocked_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             RETURNING *`, [(0, uuid_1.v4)(), studentId, rule.type, rule.title, rule.description, rule.icon, rule.color]);
                    unlockedMilestones.push(result.rows[0]);
                }
            }
        }
        return unlockedMilestones;
    }
    /**
     * 获取学生统计数据
     */
    async getStudentStats(studentId) {
        const result = await database_1.pool.query(`SELECT
         COUNT(*) FILTER (WHERE status = 'completed') as tasks_completed,
         COUNT(*) FILTER (WHERE status = 'completed' AND client_rating = 5.0) as perfect_ratings,
         AVG(client_rating) FILTER (WHERE status = 'completed') as avg_rating
       FROM task_assignments
       WHERE student_id = $1`, [studentId]);
        return result.rows[0] || { tasks_completed: 0, perfect_ratings: 0, avg_rating: 0 };
    }
    /**
     * 计算影响力分数
     */
    calculateImpactScore(rating) {
        if (rating >= 4.5)
            return 0.8;
        if (rating >= 4.0)
            return 0.6;
        if (rating >= 3.5)
            return 0.4;
        return 0.2;
    }
    /**
     * 计算成长趋势
     */
    calculateGrowthTrend(events) {
        if (events.length < 3)
            return 'insufficient_data';
        // 获取最近30天的事件
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentEvents = events.filter((e) => new Date(e.event_date) >= thirtyDaysAgo);
        if (recentEvents.length === 0)
            return 'inactive';
        const avgImpact = recentEvents.reduce((sum, e) => sum + e.impact_score, 0) / recentEvents.length;
        if (avgImpact >= 0.7)
            return 'accelerating';
        if (avgImpact >= 0.5)
            return 'steady';
        return 'slowing';
    }
    /**
     * 计算技能趋势
     */
    calculateSkillTrend(levelHistory) {
        if (levelHistory.length < 2)
            return 'stable';
        const recent = levelHistory.slice(-5); // 最近5次
        let upCount = 0;
        let downCount = 0;
        for (let i = 1; i < recent.length; i++) {
            if (recent[i].proficiency > recent[i - 1].proficiency)
                upCount++;
            else if (recent[i].proficiency < recent[i - 1].proficiency)
                downCount++;
        }
        if (upCount > downCount)
            return 'rising';
        if (downCount > upCount)
            return 'declining';
        return 'stable';
    }
    /**
     * 计算成长速率
     */
    calculateGrowthRate(levelHistory) {
        if (levelHistory.length < 2)
            return 0;
        const first = levelHistory[0];
        const last = levelHistory[levelHistory.length - 1];
        const proficiencyChange = last.proficiency - first.proficiency;
        const daysDiff = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff === 0)
            return 0;
        return proficiencyChange / daysDiff; // 每天的熟练度增长
    }
}
exports.default = new StudentGrowthService();
//# sourceMappingURL=studentGrowthService.js.map