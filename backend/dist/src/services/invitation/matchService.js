"use strict";
/**
 * 邀请匹配服务
 * 基于能力、历史表现、标签、活跃度的智能匹配算法
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationMatchService = exports.InvitationMatchService = void 0;
const db_1 = require("../../utils/db");
class InvitationMatchService {
    /**
     * 为任务匹配最合适的学生
     */
    async matchStudentsForTask(companyId, taskRequirements) {
        // 1. 获取商家匹配配置
        const config = await this.getMatchConfig(companyId);
        // 2. 获取符合条件的候选学生
        const candidates = await this.getCandidateStudents(taskRequirements, config.blacklist_students);
        // 3. 计算每个学生的匹配分数
        const matches = [];
        for (const candidate of candidates) {
            const match_score = await this.calculateMatchScore(candidate, taskRequirements, config);
            if (matchScore.match_score >= config.min_match_score) {
                matches.push(matchScore);
            }
        }
        // 4. 按匹配分数排序，返回前N个
        matches.sort((a, b) => b.match_score - a.match_score);
        return matches.slice(0, taskRequirements.max_invitations);
    }
    /**
     * 获取商家匹配配置
     */
    async getMatchConfig(companyId) {
        const queryText = `
      SELECT * FROM invitation_match_configs
      WHERE company_id = $1
    `;
        const result = await (0, db_1.query)(queryText, [companyId]);
        if (result.length === 0) {
            // 返回默认配置
            return {
                ability_weight: 40,
                history_weight: 30,
                tag_weight: 20,
                activity_weight: 10,
                preferred_abilities: [],
                preferred_tags: [],
                min_match_score: 60,
                blacklist_students: [],
            };
        }
        return result[0];
    }
    /**
     * 获取候选学生列表
     */
    async getCandidateStudents(requirements, blacklist) {
        let queryText = `
      SELECT
        u.id as student_id,
        u.current_level,
        sp.d1, sp.d2, sp.d3, sp.d4, sp.d5, sp.d6,
        sp.tags,
        sp.completed_tasks,
        sp.avg_rating,
        sp.success_rate,
        sal.last_login_at
      FROM users u
      JOIN student_activity_logs sal ON u.id = sal.student_id
      WHERE
        sal.invitation_eligible = true
        AND sal.is_active = true
        AND u.current_level >= $1
    `;
        const params = [requirements.target_level_min];
        let paramIndex = 2;
        // 排除黑名单
        if (blacklist.length > 0) {
            queryText += ` AND u.id != ALL($${paramIndex}::uuid[])`;
            params.push(blacklist);
            paramIndex++;
        }
        // 能力要求
        if (requirements.target_abilities) {
            for (const [dimension, minScore] of Object.entries(requirements.target_abilities)) {
                queryText += ` AND sp.${dimension} >= $${paramIndex}`;
                params.push(minScore);
                paramIndex++;
            }
        }
        // 标签要求（至少匹配一个）
        if (requirements.target_tags && requirements.target_tags.length > 0) {
            queryText += ` AND sp.tags && $${paramIndex}::text[]`;
            params.push(requirements.target_tags);
            paramIndex++;
        }
        queryText += ` ORDER BY u.current_level DESC, sp.avg_rating DESC LIMIT 50`;
        const result = await (0, db_1.query)(queryText, params);
        return result.map(row => ({
            student_id: row.student_id,
            level_a: row.current_level,
            abilities: {
                d1: row.d1,
                d2: row.d2,
                d3: row.d3,
                d4: row.d4,
                d5: row.d5,
                d6: row.d6,
            },
            tags: row.tags || [],
            completed_tasks: row.completed_tasks || 0,
            avg_rating: row.avg_rating || 0,
            success_rate: row.success_rate || 0,
            last_login_at: row.last_login_at,
        }));
    }
    /**
     * 计算匹配分数（0-100）
     */
    async calculateMatchScore(student, requirements, config) {
        // 1. 能力匹配分数
        const abilityScore = this.calculateAbilityScore(student.abilities, requirements.target_abilities || {}, config.preferred_abilities);
        // 2. 历史表现分数
        const historyScore = this.calculateHistoryScore(student.completed_tasks, student.avg_rating, student.success_rate);
        // 3. 标签匹配分数
        const tagScore = this.calculateTagScore(student.tags, requirements.target_tags || [], config.preferred_tags);
        // 4. 活跃度分数
        const activityScore = this.calculateActivityScore(student.last_login_at);
        // 5. 加权总分
        const totalScore = Math.round((abilityScore * config.ability_weight +
            historyScore * config.history_weight +
            tagScore * config.tag_weight +
            activityScore * config.activity_weight) /
            100);
        return {
            student_id: student.student_id,
            match_score: totalScore,
            match_reason: {
                ability_score: abilityScore,
                history_score: historyScore,
                tag_score: tagScore,
                activity_score: activityScore,
            },
        };
    }
    /**
     * 计算能力匹配分数
     */
    calculateAbilityScore(studentAbilities, requiredAbilities, preferredAbilities) {
        let totalScore = 0;
        let count = 0;
        // 必需能力匹配
        for (const [dimension, required] of Object.entries(requiredAbilities)) {
            const actual = studentAbilities[dimension] || 0;
            const score = Math.min(100, (actual / required) * 100);
            totalScore += score;
            count++;
        }
        // 偏好能力加分
        for (const dimension of preferredAbilities) {
            const score = studentAbilities[dimension] || 0;
            totalScore += score * 0.5; // 偏好能力权重较低
            count++;
        }
        return count > 0 ? Math.round(totalScore / count) : 50;
    }
    /**
     * 计算历史表现分数
     */
    calculateHistoryScore(completedTasks, avgRating, successRate) {
        // 任务数量分数（最多50分）
        const taskScore = Math.min(50, completedTasks * 2);
        // 评分分数（最多30分）
        const ratingScore = (avgRating / 5) * 30;
        // 成功率分数（最多20分）
        const successScore = successRate * 20;
        return Math.round(taskScore + ratingScore + successScore);
    }
    /**
     * 计算标签匹配分数
     */
    calculateTagScore(studentTags, requiredTags, preferredTags) {
        let score = 0;
        // 必需标签匹配（每个20分）
        const requiredMatches = requiredTags.filter(tag => studentTags.includes(tag)).length;
        score += requiredMatches * 20;
        // 偏好标签匹配（每个10分）
        const preferredMatches = preferredTags.filter(tag => studentTags.includes(tag)).length;
        score += preferredMatches * 10;
        return Math.min(100, score);
    }
    /**
     * 计算活跃度分数
     */
    calculateActivityScore(lastLoginAt) {
        const now = new Date();
        const hoursSinceLogin = (now.getTime() - lastLoginAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLogin < 24)
            return 100; // 24小时内登录
        if (hoursSinceLogin < 72)
            return 80; // 3天内登录
        if (hoursSinceLogin < 120)
            return 60; // 5天内登录
        if (hoursSinceLogin < 168)
            return 40; // 7天内登录
        return 20; // 超过7天
    }
    /**
     * 更新商家匹配配置
     */
    async updateMatchConfig(companyId, config) {
        const fields = [];
        const values = [];
        let paramIndex = 1;
        for (const [key, value] of Object.entries(config)) {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
        values.push(companyId);
        const queryText = `
      INSERT INTO invitation_match_configs (company_id, ${Object.keys(config).join(', ')})
      VALUES ($${paramIndex}, ${Object.values(config).map((_, i) => `$${i + 1}`).join(', ')})
      ON CONFLICT (company_id)
      DO UPDATE SET ${fields.join(', ')}, updated_at = NOW()
    `;
        await (0, db_1.query)(queryText, values);
    }
}
exports.InvitationMatchService = InvitationMatchService;
exports.invitationMatchService = new InvitationMatchService();
//# sourceMappingURL=matchService.js.map