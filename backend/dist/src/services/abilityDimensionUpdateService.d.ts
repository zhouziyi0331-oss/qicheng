/**
 * 六维能力动态更新服务
 * 模块二：六维能力测评表的动态更新与文字解读
 *
 * 功能：
 * 1. 每次订单完成后，根据任务表现更新六维分数
 * 2. 使用加权滑动平均算法：新分数 = (旧分数 × 0.7) + (本次表现分 × 0.3)
 * 3. 调用AI生成每个维度的文字解读
 * 4. 版本化存储，保留历史记录
 */
interface DimensionUpdate {
    dimension: string;
    old_score: number;
    new_score: number;
    change_reason: string;
    current_description: string;
}
interface AbilityUpdateResult {
    dimension_updates: DimensionUpdate[];
    overall_trend: string;
    personality_label_update: string;
}
declare class AbilityDimensionUpdateService {
    private anthropic;
    constructor();
    /**
     * 订单完成后更新六维能力
     */
    updateAbilityAfterOrder(orderId: string): Promise<AbilityUpdateResult>;
    /**
     * 获取任务表现数据
     */
    private getTaskPerformance;
    /**
     * 计算本次任务的六维表现分
     */
    private calculatePerformanceScores;
    /**
     * 获取学生当前的六维分数
     */
    private getCurrentScores;
    /**
     * 计算新的六维分数（加权滑动平均）
     * 新分数 = (旧分数 × 0.7) + (本次表现分 × 0.3)
     */
    private calculateNewScores;
    /**
     * 保存新版本的能力画像
     */
    private saveNewVersion;
    /**
     * 记录历史变化
     */
    private recordHistory;
    /**
     * 调用AI生成文字解读（严格按照技术规格）
     */
    private generateAIInterpretation;
    /**
     * 获取AI解读所需的数据
     */
    private getInterpretationData;
    /**
     * 构建AI解读的提示词
     */
    private buildInterpretationPrompt;
    /**
     * 更新维度描述
     */
    private updateDimensionDescriptions;
    /**
     * 获取学生的能力变化历史
     */
    getAbilityHistory(studentId: string): Promise<any[]>;
    /**
     * 获取学生的所有画像版本
     */
    getProfileVersions(studentId: string): Promise<any[]>;
}
declare const _default: AbilityDimensionUpdateService;
export default _default;
//# sourceMappingURL=abilityDimensionUpdateService.d.ts.map