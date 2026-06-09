interface Memory {
    id: number;
    studentId: number;
    taskId?: number;
    sessionId?: number;
    memoryType: string;
    memoryCategory: string;
    memoryTitle: string;
    memoryContent: string;
    memoryContext: any;
    importanceScore: number;
    relevanceTags: string[];
    timesRecalled: number;
    lastRecalledAt?: Date;
    relatedMemories: number[];
    createdAt: Date;
    expiresAt?: Date;
}
interface MemoryCreationInput {
    studentId: number;
    taskId?: number;
    sessionId?: number;
    memoryType: 'struggle' | 'breakthrough' | 'pattern' | 'preference' | 'milestone';
    memoryCategory: 'technical' | 'emotional' | 'behavioral' | 'learning';
    memoryTitle: string;
    memoryContent: string;
    memoryContext?: any;
    importanceScore?: number;
    relevanceTags?: string[];
    expiresAt?: Date;
}
interface MemoryRecallResult {
    relevantMemories: Memory[];
    summary: string;
    insights: string[];
}
declare class MentorMemoryService {
    /**
     * 创建新记忆
     */
    createMemory(input: MemoryCreationInput): Promise<Memory>;
    /**
     * 计算记忆重要性分数
     */
    private calculateImportance;
    /**
     * 生成相关标签
     */
    private generateTags;
    /**
     * 关联相关记忆
     */
    private linkRelatedMemories;
    /**
     * 召回相关记忆
     */
    recallMemories(studentId: number, context: {
        currentTopic?: string;
        currentEmotion?: string;
        currentTask?: string;
        searchTags?: string[];
    }, limit?: number): Promise<MemoryRecallResult>;
    /**
     * 增加召回次数
     */
    private incrementRecallCount;
    /**
     * 生成记忆摘要
     */
    private generateMemorySummary;
    /**
     * 生成洞察
     */
    private generateInsights;
    /**
     * 自动从对话中提取记忆
     */
    extractMemoryFromConversation(studentId: number, taskId: number, sessionId: number, messages: Array<{
        role: string;
        content: string;
    }>, currentEmotion?: string): Promise<Memory[]>;
    /**
     * 获取学生的所有记忆
     */
    getAllMemories(studentId: number, options?: {
        memoryType?: string;
        memoryCategory?: string;
        minImportance?: number;
        limit?: number;
    }): Promise<Memory[]>;
    /**
     * 更新记忆重要性
     */
    updateImportance(memoryId: number, newScore: number): Promise<void>;
    /**
     * 删除过期记忆
     */
    cleanupExpiredMemories(): Promise<number>;
    /**
     * 获取记忆统计
     */
    getMemoryStats(studentId: number): Promise<{
        totalMemories: number;
        byType: {
            [key: string]: number;
        };
        byCategory: {
            [key: string]: number;
        };
        averageImportance: number;
        mostRecalled: Memory[];
    }>;
}
export declare const mentorMemoryService: MentorMemoryService;
export {};
//# sourceMappingURL=mentorMemoryService.old.d.ts.map