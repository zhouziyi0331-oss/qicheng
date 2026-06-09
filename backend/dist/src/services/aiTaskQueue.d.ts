import Queue from 'bull';
/**
 * AI任务队列处理器
 * 统一调度所有AI相关的异步任务
 */
export declare const aiTaskQueue: Queue.Queue<any>;
/**
 * 任务类型定义
 */
export declare enum AITaskType {
    PROFILE_ANALYSIS = "profile-analysis",// AI-01: 学生画像生成
    PROJECT_CONDITION_ANALYSIS = "project-condition-analysis",// 项目需求条件分析
    MATCH_ANALYSIS = "match-analysis",// AI-02: 适配性判断
    SUBMISSION_REVIEW = "submission-review",// AI-03: 交付物预审核
    GROWTH_REPORT = "growth-report",// AI-04: 成长报告
    MENTOR_GUIDANCE = "mentor-guidance"
}
/**
 * 任务数据接口
 */
interface ProfileAnalysisJob {
    type: AITaskType.PROFILE_ANALYSIS;
    studentId: string;
    assessmentId: string;
    answers: any;
    scores: any;
}
interface ProjectConditionAnalysisJob {
    type: AITaskType.PROJECT_CONDITION_ANALYSIS;
    taskId: string;
    title: string;
    description: string;
    deliverableType: string;
    cycle: number;
    budget: number;
}
interface MatchAnalysisJob {
    type: AITaskType.MATCH_ANALYSIS;
    taskId: string;
    studentIds: string[];
}
interface MentorGuidanceJob {
    type: AITaskType.MENTOR_GUIDANCE;
    orderId: string;
    studentId: string;
    scenario: 'T01' | 'T02' | 'T03' | 'T04' | 'T05';
    context: any;
}
type AITaskJob = ProfileAnalysisJob | ProjectConditionAnalysisJob | MatchAnalysisJob | MentorGuidanceJob;
/**
 * 辅助函数：添加任务到队列
 */
export declare function enqueueAITask(taskData: AITaskJob, options?: any): Promise<Queue.Job<any>>;
/**
 * 获取队列状态
 */
export declare function getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    total: number;
}>;
export default aiTaskQueue;
//# sourceMappingURL=aiTaskQueue.d.ts.map