import { ITaskProgress } from '../models/TaskProgress';
/**
 * 任务进度服务
 *
 * 核心功能：根据真实项目内容，AI生成个性化的任务拆解
 * 每个项目的拆解都是独一无二的，不是通用模板
 */
export declare class TaskProgressService {
    /**
     * 为项目生成任务拆解（AI深度分析项目内容）
     */
    generateTaskDecomposition(userId: string, projectType: 'practice' | 'real', projectId: string): Promise<ITaskProgress>;
    /**
     * 获取项目的任务进度
     */
    getTaskProgress(userId: string, projectId: string): Promise<ITaskProgress | null>;
    /**
     * 更新任务状态
     */
    updateTaskStatus(userId: string, progressId: string, taskNumber: number, updates: {
        status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
        progress?: number;
        startedAt?: Date;
        completedAt?: Date;
        actualDuration?: string;
    }): Promise<ITaskProgress | null>;
    /**
     * 记录任务中遇到的问题和解决方案
     */
    addChallenge(userId: string, progressId: string, taskNumber: number, problem: string, solution: string): Promise<ITaskProgress | null>;
    /**
     * 添加任务反思
     */
    addReflection(userId: string, progressId: string, taskNumber: number, reflection: {
        whatWorked: string[];
        whatToImprove: string[];
        lessonsLearned: string[];
    }): Promise<ITaskProgress | null>;
    /**
     * 生成项目完成总结（AI分析）
     */
    generateProjectSummary(userId: string, progressId: string): Promise<ITaskProgress | null>;
    /**
     * 获取用户所有项目的任务进度列表
     */
    getUserTaskProgressList(userId: string, status?: string): Promise<ITaskProgress[]>;
    /**
     * 计算总时间（辅助方法）
     */
    private calculateTotalTime;
}
export declare const taskProgressService: TaskProgressService;
//# sourceMappingURL=taskProgress.service.d.ts.map