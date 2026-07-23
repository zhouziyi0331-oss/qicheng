import { ISecretSpace } from '../models/SecretSpace';
/**
 * 小猫的秘密空间服务
 *
 * 核心功能：每个用户的私密成长空间
 * 完全个性化，记录天数、心情、笔记等私密数据
 */
export declare class SecretSpaceService {
    /**
     * 初始化用户的秘密空间（注册时调用）
     */
    initializeSecretSpace(userId: string): Promise<ISecretSpace>;
    /**
     * 获取用户的秘密空间
     */
    getSecretSpace(userId: string): Promise<ISecretSpace | null>;
    /**
     * 签到（更新天数）
     * 使用UTC+8（中国标准时间）统一处理，避免跨时区问题
     */
    checkIn(userId: string): Promise<{
        secretSpace: ISecretSpace;
        isConsecutive: boolean;
        reward?: {
            exp: number;
            message: string;
        };
    }>;
    /**
     * 记录心情
     */
    recordMood(userId: string, mood: 'excited' | 'happy' | 'normal' | 'tired' | 'frustrated', note: string, tags?: string[]): Promise<ISecretSpace | null>;
    /**
     * 获取心情记录（支持日期范围查询）
     */
    getMoodRecords(userId: string, startDate?: Date, endDate?: Date): Promise<any[]>;
    /**
     * 添加私密笔记
     */
    addPrivateNote(userId: string, title: string, content: string, tags?: string[]): Promise<ISecretSpace | null>;
    /**
     * 更新私密笔记
     */
    updatePrivateNote(userId: string, noteId: string, updates: {
        title?: string;
        content?: string;
        tags?: string[];
    }): Promise<ISecretSpace | null>;
    /**
     * 删除私密笔记
     */
    deletePrivateNote(userId: string, noteId: string): Promise<ISecretSpace | null>;
    /**
     * 添加个人里程碑
     */
    addPersonalMilestone(userId: string, title: string, description: string, targetDate?: Date): Promise<ISecretSpace | null>;
    /**
     * 完成个人里程碑
     */
    completeMilestone(userId: string, milestoneId: string): Promise<ISecretSpace | null>;
    /**
     * 添加名言收藏
     */
    addFavoriteQuote(userId: string, text: string, author?: string): Promise<ISecretSpace | null>;
    /**
     * 更新空间设置
     */
    updateSettings(userId: string, settings: {
        theme?: 'cat' | 'star' | 'forest' | 'ocean';
        backgroundColor?: string;
        isPublic?: boolean;
    }): Promise<ISecretSpace | null>;
    /**
     * 获取空间统计
     */
    getSpaceStats(userId: string): Promise<{
        daysSinceJoined: number;
        consecutiveDays: number;
        totalMoodRecords: number;
        totalNotes: number;
        totalMilestones: number;
        completedMilestones: number;
        totalQuotes: number;
        moodDistribution: {
            mood: string;
            count: number;
        }[];
    }>;
}
export declare const secretSpaceService: SecretSpaceService;
//# sourceMappingURL=secretSpace.service.d.ts.map