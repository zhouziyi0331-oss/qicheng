/**
 * Phase 1.4: 升级通关仪式服务
 *
 * 功能：
 * 1. 检测学生升级事件
 * 2. 生成个性化庆祝文案
 * 3. 触发通关仪式通知
 * 4. 记录升级里程碑
 */
interface LevelUpData {
    studentId: string;
    oldLevel: number;
    newLevel: number;
    triggerReason: string;
}
interface CeremonyContent {
    title: string;
    mainMessage: string;
    achievements: string[];
    nextLevelPreview: string;
    celebrationEmoji: string;
    soundEffect: string;
}
declare class LevelUpCeremonyService {
    /**
     * 触发升级通关仪式
     */
    triggerLevelUpCeremony(data: LevelUpData): Promise<{
        success: boolean;
        ceremonyId: string;
        ceremonyContent: CeremonyContent;
    }>;
    /**
     * 获取学生成长上下文
     */
    private getStudentGrowthContext;
    /**
     * 使用AI生成个性化庆祝文案
     */
    private generateCeremonyContent;
    /**
     * 生成默认庆祝文案（AI失败时的降级方案）
     */
    private generateDefaultCeremony;
    /**
     * 选择音效类型
     */
    private selectSoundEffect;
    /**
     * 获取触发原因标签
     */
    private getTriggerReasonLabel;
    /**
     * 保存仪式记录
     */
    private saveCeremonyRecord;
    /**
     * 触发通关仪式通知（包含前端LevelUpModal事件）
     */
    private triggerCeremonyNotification;
    /**
     * 获取学生的历史升级仪式记录
     */
    getStudentCeremonies(studentId: string, limit?: number): Promise<any[]>;
    /**
     * 获取单个仪式详情
     */
    getCeremonyById(ceremonyId: string): Promise<any>;
}
export declare const levelUpCeremonyService: LevelUpCeremonyService;
export default levelUpCeremonyService;
//# sourceMappingURL=levelUpCeremonyService.d.ts.map