import { IAchievement } from '../models/Achievement';
/**
 * 成就系统服务
 *
 * 核心功能：根据用户的真实行为自动解锁成就
 * 每个用户的成就列表完全不同，基于其实际活动
 */
export declare class AchievementService {
    /**
     * 初始化用户的成就系统（注册时调用）
     */
    initializeUserAchievements(userId: string): Promise<void>;
    /**
     * 检查并更新项目相关成就
     */
    checkProjectAchievements(userId: string): Promise<IAchievement[]>;
    /**
     * 检查并更新收入相关成就
     */
    checkIncomeAchievements(userId: string): Promise<IAchievement[]>;
    /**
     * 检查并更新能力成长相关成就
     */
    checkAbilityAchievements(userId: string): Promise<IAchievement[]>;
    /**
     * 检查所有成就（综合检查）
     */
    checkAllAchievements(userId: string): Promise<IAchievement[]>;
    /**
     * 获取用户的成就列表
     */
    getUserAchievements(userId: string, filter?: {
        isUnlocked?: boolean;
        type?: string;
    }): Promise<IAchievement[]>;
    /**
     * 获取成就统计
     */
    getAchievementStats(userId: string): Promise<{
        total: number;
        unlocked: number;
        unlockRate: number;
        byType: {
            type: string;
            total: number;
            unlocked: number;
        }[];
        recentUnlocked: IAchievement[];
    }>;
    /**
     * 切换成就展示状态
     */
    toggleAchievementDisplay(userId: string, achievementId: string): Promise<IAchievement | null>;
    /**
     * 授予经验值奖励（辅助方法）
     */
    private grantExpReward;
}
export declare const achievementService: AchievementService;
//# sourceMappingURL=achievement.service.d.ts.map