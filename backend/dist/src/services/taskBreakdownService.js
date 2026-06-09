"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskBreakdownService = void 0;
const aiServiceClient_1 = require("./aiServiceClient");
const errorHandler_1 = require("../middleware/errorHandler");
class TaskBreakdownService {
    /**
     * 为学生生成个性化的任务拆解
     */
    async breakdownTask(taskId, studentId) {
        try {
            const result = await aiServiceClient_1.aiServiceClient.breakdownTask({
                task_id: taskId,
                student_id: studentId,
            });
            return result;
        }
        catch (error) {
            console.error('Task breakdown failed:', error);
            throw new errorHandler_1.AppError(error.response?.status || 500, error.response?.data?.message || 'Failed to breakdown task');
        }
    }
    /**
     * 格式化拆解结果为前端友好的格式
     */
    formatBreakdownForFrontend(breakdown) {
        return {
            taskId: breakdown.task_id,
            studentId: breakdown.student_id,
            strategy: breakdown.breakdown_strategy,
            phases: breakdown.breakdown.phases.map(phase => ({
                phaseNumber: phase.phase_number,
                title: phase.title,
                description: phase.description,
                estimatedHours: phase.estimated_hours,
                subtasks: phase.subtasks.map(subtask => ({
                    title: subtask.title,
                    description: subtask.description,
                    estimatedHours: subtask.estimated_hours,
                    dependencies: subtask.dependencies || [],
                })),
                successCriteria: phase.success_criteria,
                potentialChallenges: phase.potential_challenges,
            })),
            personalizedTips: breakdown.breakdown.personalized_tips,
            similarTaskReferences: breakdown.breakdown.similar_task_references.map(ref => ({
                taskId: ref.task_id,
                title: ref.title,
                similarityScore: ref.similarity_score,
                keyLearnings: ref.key_learnings,
            })),
            createdAt: breakdown.created_at,
        };
    }
}
exports.taskBreakdownService = new TaskBreakdownService();
//# sourceMappingURL=taskBreakdownService.js.map