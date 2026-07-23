import mongoose from 'mongoose';
/**
 * 等级服务
 * 管理用户等级、经验值、升级逻辑
 */
export declare class LevelService {
    /**
     * 获取用户等级信息
     */
    getUserLevel(userId: string): Promise<{
        totalExp: number;
        userName: string;
        userLevel: number;
        currentLevel: import("../config/level.config").LevelConfig;
        nextLevel: import("../config/level.config").LevelConfig | null;
        currentLevelExp: number;
        nextLevelExp: number;
        progress: number;
        expToNext: number;
    }>;
    /**
     * 增加经验值
     */
    addExp(userId: string, exp: number, reason: string, metadata?: any): Promise<{
        success: boolean;
        expAdded: number;
        totalExp: number;
        oldLevel: string;
        newLevel: string;
        leveledUp: boolean;
        levelInfo: {
            currentLevel: import("../config/level.config").LevelConfig;
            nextLevel: import("../config/level.config").LevelConfig | null;
            currentLevelExp: number;
            nextLevelExp: number;
            progress: number;
            expToNext: number;
        };
    }>;
    /**
     * 记录经验值历史
     */
    private recordExpHistory;
    /**
     * 处理升级事件
     */
    private handleLevelUp;
    /**
     * 记录等级里程碑
     */
    private recordLevelMilestone;
    /**
     * 项目完成时增加经验值
     */
    addExpForProjectCompletion(userId: string, projectId: string, difficulty: 'easy' | 'medium' | 'hard' | 'expert', rating?: number): Promise<{
        success: boolean;
        expAdded: number;
        totalExp: number;
        oldLevel: string;
        newLevel: string;
        leveledUp: boolean;
        levelInfo: {
            currentLevel: import("../config/level.config").LevelConfig;
            nextLevel: import("../config/level.config").LevelConfig | null;
            currentLevelExp: number;
            nextLevelExp: number;
            progress: number;
            expToNext: number;
        };
    }>;
    /**
     * OPC测评完成时增加经验值
     */
    addExpForOPCCompletion(userId: string): Promise<{
        success: boolean;
        expAdded: number;
        totalExp: number;
        oldLevel: string;
        newLevel: string;
        leveledUp: boolean;
        levelInfo: {
            currentLevel: import("../config/level.config").LevelConfig;
            nextLevel: import("../config/level.config").LevelConfig | null;
            currentLevelExp: number;
            nextLevelExp: number;
            progress: number;
            expToNext: number;
        };
    }>;
    /**
     * 热情火花捕捉时增加经验值
     */
    addExpForPassionSpark(userId: string, sparkId: string): Promise<{
        success: boolean;
        expAdded: number;
        totalExp: number;
        oldLevel: string;
        newLevel: string;
        leveledUp: boolean;
        levelInfo: {
            currentLevel: import("../config/level.config").LevelConfig;
            nextLevel: import("../config/level.config").LevelConfig | null;
            currentLevelExp: number;
            nextLevelExp: number;
            progress: number;
            expToNext: number;
        };
    }>;
    /**
     * 穿越感时刻时增加经验值
     */
    addExpForFlowMoment(userId: string, momentId: string): Promise<{
        success: boolean;
        expAdded: number;
        totalExp: number;
        oldLevel: string;
        newLevel: string;
        leveledUp: boolean;
        levelInfo: {
            currentLevel: import("../config/level.config").LevelConfig;
            nextLevel: import("../config/level.config").LevelConfig | null;
            currentLevelExp: number;
            nextLevelExp: number;
            progress: number;
            expToNext: number;
        };
    }>;
    /**
     * 深度对话时增加经验值（超过5轮）
     */
    addExpForDeepChat(userId: string, conversationId: string): Promise<{
        success: boolean;
        expAdded: number;
        totalExp: number;
        oldLevel: string;
        newLevel: string;
        leveledUp: boolean;
        levelInfo: {
            currentLevel: import("../config/level.config").LevelConfig;
            nextLevel: import("../config/level.config").LevelConfig | null;
            currentLevelExp: number;
            nextLevelExp: number;
            progress: number;
            expToNext: number;
        };
    }>;
    /**
     * 连接生命问题时增加经验值
     */
    addExpForLifeQuestionConnection(userId: string): Promise<{
        success: boolean;
        expAdded: number;
        totalExp: number;
        oldLevel: string;
        newLevel: string;
        leveledUp: boolean;
        levelInfo: {
            currentLevel: import("../config/level.config").LevelConfig;
            nextLevel: import("../config/level.config").LevelConfig | null;
            currentLevelExp: number;
            nextLevelExp: number;
            progress: number;
            expToNext: number;
        };
    }>;
    /**
     * 检查并解锁里程碑成就
     */
    checkMilestones(userId: string): Promise<void>;
    /**
     * 检查是否已达成里程碑
     */
    private hasMilestone;
    /**
     * 保存里程碑记录
     */
    private saveMilestone;
    /**
     * 获取等级榜单
     */
    getLevelLeaderboard(limit?: number): Promise<{
        rank: number;
        userId: mongoose.Types.ObjectId;
        nickname: string;
        avatar: string;
        level: number;
        levelName: string;
        exp: number;
        totalProjects: number;
        totalIncome: number;
    }[]>;
    /**
     * 获取所有等级配置
     */
    getAllLevels(): import("../config/level.config").LevelConfig[];
}
export declare const levelService: LevelService;
//# sourceMappingURL=level.service.d.ts.map