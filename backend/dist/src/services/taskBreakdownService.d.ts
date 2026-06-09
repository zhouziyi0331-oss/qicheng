interface TaskBreakdownResponse {
    task_id: string;
    student_id: string;
    breakdown: {
        phases: Array<{
            phase_number: number;
            title: string;
            description: string;
            estimated_hours: number;
            subtasks: Array<{
                title: string;
                description: string;
                estimated_hours: number;
                dependencies?: string[];
            }>;
            success_criteria: string[];
            potential_challenges: string[];
        }>;
        personalized_tips: string[];
        similar_task_references: Array<{
            task_id: string;
            title: string;
            similarity_score: number;
            key_learnings: string[];
        }>;
    };
    breakdown_strategy: string;
    created_at: string;
}
declare class TaskBreakdownService {
    /**
     * 为学生生成个性化的任务拆解
     */
    breakdownTask(taskId: string, studentId: string): Promise<TaskBreakdownResponse>;
    /**
     * 格式化拆解结果为前端友好的格式
     */
    formatBreakdownForFrontend(breakdown: TaskBreakdownResponse): {
        taskId: string;
        studentId: string;
        strategy: string;
        phases: {
            phaseNumber: number;
            title: string;
            description: string;
            estimatedHours: number;
            subtasks: {
                title: string;
                description: string;
                estimatedHours: number;
                dependencies: string[];
            }[];
            successCriteria: string[];
            potentialChallenges: string[];
        }[];
        personalizedTips: string[];
        similarTaskReferences: {
            taskId: string;
            title: string;
            similarityScore: number;
            keyLearnings: string[];
        }[];
        createdAt: string;
    };
}
export declare const taskBreakdownService: TaskBreakdownService;
export {};
//# sourceMappingURL=taskBreakdownService.d.ts.map