/**
 * 等级体系配置
 * "使命是河" - 从涉水到河成的成长旅程
 */
export interface LevelConfig {
    level: number;
    name: string;
    title: string;
    description: string;
    requiredExp: number;
    icon: string;
    color: string;
    unlocks: string[];
    milestones: string[];
}
/**
 * 等级体系：6个等级
 *
 * 理念："使命是河"
 * - 每个人都在河流中找到自己的节奏
 * - 不是竞争，是探索和成长
 * - 从试探到掌握，从跟随到创造
 */
export declare const LEVEL_SYSTEM: LevelConfig[];
/**
 * 获取等级配置
 */
export declare function getLevelConfig(level: number): LevelConfig | undefined;
/**
 * 根据经验值获取等级
 */
export declare function getLevelByExp(exp: number): LevelConfig;
/**
 * 计算升级进度
 */
export declare function calculateLevelProgress(exp: number): {
    currentLevel: LevelConfig;
    nextLevel: LevelConfig | null;
    currentLevelExp: number;
    nextLevelExp: number;
    progress: number;
    expToNext: number;
};
/**
 * 经验值获取规则
 */
export declare const EXP_RULES: {
    completeProject: {
        easy: number;
        medium: number;
        hard: number;
        expert: number;
    };
    clientRating: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
    firstTime: {
        completeOPC: number;
        firstProject: number;
        firstPassionSpark: number;
        firstFlowMoment: number;
        connectLifeQuestion: number;
    };
    milestones: {
        projects5: number;
        projects10: number;
        projects20: number;
        projects50: number;
        income10k: number;
        income30k: number;
        income60k: number;
        rating5count5: number;
        helpNewbie: number;
    };
    growth: {
        aiChatDeep: number;
        passionSpark: number;
        flowMoment: number;
        selfReflection: number;
        shareStory: number;
    };
    community: {
        helpOthers: number;
        shareExperience: number;
        mentoringSession: number;
    };
};
/**
 * 计算项目完成经验值
 */
export declare function calculateProjectExp(difficulty: 'easy' | 'medium' | 'hard' | 'expert', rating?: number, isFirstProject?: boolean): number;
//# sourceMappingURL=level.config.d.ts.map