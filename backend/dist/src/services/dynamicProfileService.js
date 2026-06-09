"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicProfileService = void 0;
const aiServiceClient_1 = require("./aiServiceClient");
const errorHandler_1 = require("../middleware/errorHandler");
const db_1 = require("../utils/db");
class DynamicProfileService {
    /**
     * 任务完成后更新学生能力画像
     */
    async updateAfterTaskCompletion(studentId, taskId, assignmentId) {
        return this.updateStudentProfile(studentId, taskId, assignmentId);
    }
    /**
     * 任务完成后更新学生能力画像
     */
    async updateStudentProfile(studentId, taskId, submissionId) {
        try {
            const result = await aiServiceClient_1.aiServiceClient.updateProfile({
                student_id: studentId,
                task_id: taskId,
                performance: {
                    rating: 0,
                    completion_time: 0,
                },
            });
            return result;
        }
        catch (error) {
            console.error('Profile update failed:', error);
            throw new errorHandler_1.AppError(error.response?.status || 500, error.response?.data?.message || 'Failed to update student profile');
        }
    }
    /**
     * 格式化画像更新结果为前端友好的格式
     */
    formatProfileUpdateForFrontend(response) {
        return {
            studentId: response.student_id,
            previousProfile: {
                opcTag: response.previous_profile.opc_tag,
                capabilityScores: response.previous_profile.capability_scores,
            },
            updatedProfile: {
                opcTag: response.updated_profile.opc_tag,
                capabilityScores: response.updated_profile.capability_scores,
            },
            changes: {
                opcTagChanged: response.changes.opc_tag_changed,
                significantScoreChanges: response.changes.significant_score_changes.map(change => ({
                    dimension: change.dimension,
                    oldScore: change.old_score,
                    newScore: change.new_score,
                    change: change.change,
                })),
            },
            insights: {
                strengths: response.insights.strengths,
                areasForImprovement: response.insights.areas_for_improvement,
                growthTrajectory: response.insights.growth_trajectory,
                recommendedNextTasks: response.insights.recommended_next_tasks,
            },
            notificationSent: response.notification_sent,
            updatedAt: response.updated_at,
        };
    }
    /**
     * 判断是否有显著变化需要通知学生
     */
    hasSignificantChanges(response) {
        return (response.changes.opc_tag_changed ||
            response.changes.significant_score_changes.length > 0);
    }
    /**
     * 生成变化摘要文本
     */
    generateChangeSummary(response) {
        const parts = [];
        if (response.changes.opc_tag_changed) {
            parts.push(`你的学习类型从 ${response.previous_profile.opc_tag} 变更为 ${response.updated_profile.opc_tag}`);
        }
        if (response.changes.significant_score_changes.length > 0) {
            const improvements = response.changes.significant_score_changes.filter(c => c.change > 0);
            const declines = response.changes.significant_score_changes.filter(c => c.change < 0);
            if (improvements.length > 0) {
                const dimensions = improvements.map(c => this.translateDimension(c.dimension)).join('、');
                parts.push(`${dimensions} 能力有显著提升`);
            }
            if (declines.length > 0) {
                const dimensions = declines.map(c => this.translateDimension(c.dimension)).join('、');
                parts.push(`${dimensions} 需要更多关注`);
            }
        }
        return parts.join('；');
    }
    /**
     * 翻译能力维度名称
     */
    translateDimension(dimension) {
        const translations = {
            technical_depth: '技术深度',
            problem_solving: '问题解决',
            communication: '沟通表达',
            collaboration: '团队协作',
            learning_agility: '学习敏捷度',
            delivery_quality: '交付质量',
        };
        return translations[dimension] || dimension;
    }
    /**
     * 批量更新多个学生的能力画像
     */
    async batchUpdate(updates) {
        try {
            const results = await Promise.all(updates.map(update => this.updateStudentProfile(update.studentId, update.taskId, update.submissionId)));
            return results;
        }
        catch (error) {
            console.error('Batch profile update failed:', error);
            throw new errorHandler_1.AppError(error.response?.status || 500, error.response?.data?.message || 'Failed to batch update profiles');
        }
    }
    /**
     * 获取学生的能力画像历史记录
     */
    async getProfileHistory(studentId, limit = 20) {
        try {
            const query = `
        SELECT
          id,
          student_id,
          task_id,
          submission_id,
          previous_profile,
          updated_profile,
          changes,
          insights,
          created_at
        FROM profile_history
        WHERE student_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;
            const result = await db_1.pool.query(query, [studentId, limit]);
            return result.rows.map((record) => ({
                id: record.id,
                studentId: record.student_id,
                taskId: record.task_id,
                submissionId: record.submission_id,
                previousProfile: {
                    opcTag: record.previous_profile.opc_tag,
                    capabilityScores: record.previous_profile.capability_scores,
                },
                updatedProfile: {
                    opcTag: record.updated_profile.opc_tag,
                    capabilityScores: record.updated_profile.capability_scores,
                },
                changes: {
                    opcTagChanged: record.changes.opc_tag_changed,
                    significantScoreChanges: record.changes.significant_score_changes.map((change) => ({
                        dimension: change.dimension,
                        oldScore: change.old_score,
                        newScore: change.new_score,
                        change: change.change,
                    })),
                },
                insights: {
                    strengths: record.insights.strengths,
                    areasForImprovement: record.insights.areas_for_improvement,
                    growthTrajectory: record.insights.growth_trajectory,
                    recommendedNextTasks: record.insights.recommended_next_tasks,
                },
                createdAt: record.created_at,
            }));
        }
        catch (error) {
            console.error('Failed to get profile history:', error);
            throw new errorHandler_1.AppError(500, 'Failed to get profile history');
        }
    }
}
exports.dynamicProfileService = new DynamicProfileService();
//# sourceMappingURL=dynamicProfileService.js.map