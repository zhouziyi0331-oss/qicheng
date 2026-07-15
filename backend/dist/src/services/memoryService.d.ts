/**
 * 6层记忆系统服务
 * Phase R1: 为导师Agent提供完整的记忆读写API
 */
import { MentorMemory, CoreProfile, TaskContext, RecentSummary, GrowthArchive, RelationshipMemory } from '../types/orchestrator';
export declare class MemoryService {
    /**
     * 加载所有6层记忆
     */
    loadAllLayers(userId: string): Promise<MentorMemory>;
    /**
     * L5: 加载核心画像
     */
    loadCoreProfile(userId: string): Promise<CoreProfile | null>;
    /**
     * L6: 加载关系记忆
     */
    loadRelationshipMemory(userId: string): Promise<RelationshipMemory | null>;
    /**
     * L4: 加载成长档案
     */
    loadGrowthArchive(userId: string): Promise<GrowthArchive | null>;
    /**
     * L3: 加载近期摘要
     */
    loadRecentSummary(userId: string): Promise<RecentSummary | null>;
    /**
     * L2: 加载任务记忆
     */
    loadTaskContext(userId: string, taskId: string): Promise<TaskContext | null>;
    /**
     * 更新L5核心画像
     */
    updateCoreProfile(userId: string, updates: Partial<CoreProfile>): Promise<void>;
    /**
     * 更新L6关系记忆
     */
    updateRelationshipMemory(userId: string, updates: {
        addQuote?: {
            quote: string;
            context: string;
        };
        addPromise?: {
            promise: string;
        };
        addAnchor?: {
            type: string;
            description: string;
            triggerContext: string;
        };
        addSummary?: {
            topic: string;
            emotionalTone: string;
            outcome: string;
        };
        updateStage?: 'new' | 'warming' | 'trusted' | 'deep';
    }): Promise<void>;
    /**
     * 更新L4成长档案
     */
    updateGrowthArchive(userId: string, updates: {
        addMilestone?: {
            type: string;
            description: string;
            impact: string;
        };
        addTaskReport?: {
            taskId: string;
            keyLearnings: string[];
            breakthrough?: string;
        };
        addScoreSnapshot?: any;
    }): Promise<void>;
    /**
     * 创建L2任务记忆
     */
    createTaskContext(userId: string, taskId: string, initialData: Partial<TaskContext>): Promise<void>;
    /**
     * 更新L2任务记忆
     */
    updateTaskContext(userId: string, taskId: string, updates: {
        taskPhase?: string;
        addStuckPoint?: {
            description: string;
            resolved: boolean;
        };
        addHint?: string;
        addEmotionEvent?: {
            emotion: string;
            intensity: number;
        };
        mentorAssessment?: any;
    }): Promise<void>;
    /**
     * 更新L3近期摘要
     */
    updateRecentSummary(userId: string, updates: {
        incrementTasksCompleted?: boolean;
        updateEmotionTrend?: string;
        updateEngagementScore?: number;
        addStuckType?: string;
    }): Promise<void>;
}
export declare const memoryService: MemoryService;
//# sourceMappingURL=memoryService.d.ts.map