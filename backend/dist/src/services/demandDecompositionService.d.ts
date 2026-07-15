/**
 * Phase 3.4: 需求自动拆解推送服务
 * 企业发布大需求，系统自动拆解成小任务，精准推送给合适的学生
 */
export interface Subtask {
    id: string;
    decompositionId: string;
    parentTaskId: string;
    subtaskTitle: string;
    subtaskDescription: string;
    subtaskType: string;
    requiredSkills: string[];
    difficultyLevel: number;
    estimatedHours: number;
    subtaskOrder: number;
    dependencies: string[];
    budgetAllocation: number;
    status: string;
    assignedStudentId?: string;
}
export interface DecompositionResult {
    decompositionId: string;
    subtasks: Subtask[];
    totalSubtasks: number;
}
export interface PushResult {
    subtaskId: string;
    studentId: string;
    matchScore: number;
    matchReasons: any;
    pushed: boolean;
}
declare class DemandDecompositionService {
    /**
     * AI自动拆解大需求
     */
    decomposeTaskWithAI(params: {
        taskId: string;
        companyId: string;
        taskTitle: string;
        taskDescription: string;
        totalBudget: number;
    }): Promise<DecompositionResult>;
    /**
     * 智能推送子任务给合适的学生
     */
    pushSubtaskToStudents(params: {
        subtaskId: string;
        maxPushCount?: number;
    }): Promise<PushResult[]>;
    /**
     * 学生响应子任务推送
     */
    respondToSubtask(params: {
        subtaskId: string;
        studentId: string;
        response: 'accepted' | 'rejected';
        rejectionReason?: string;
    }): Promise<boolean>;
    /**
     * 获取学生收到的子任务推送
     */
    getStudentSubtaskPushes(params: {
        studentId: string;
        responseStatus?: 'pending' | 'accepted' | 'rejected' | 'ignored';
        limit?: number;
    }): Promise<any[]>;
}
declare const _default: DemandDecompositionService;
export default _default;
//# sourceMappingURL=demandDecompositionService.d.ts.map