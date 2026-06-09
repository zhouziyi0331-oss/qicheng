/**
 * 跳级服务
 * 处理跳级申请、测试任务推送、审核
 */
interface JumpEligibility {
    eligible: boolean;
    currentLevel: number;
    targetLevel: number;
    reasons: string[];
    missingConditions: string[];
}
interface JumpTestTask {
    title: string;
    description: string;
    requirements: string;
    acceptanceCriteria: string;
    difficulty: number;
    estimatedHours: number;
}
declare class JumpTestService {
    /**
     * 检查学生是否满足跳级条件
     */
    checkJumpEligibility(studentId: string): Promise<JumpEligibility>;
    /**
     * 申请跳级
     */
    applyForJumpTest(studentId: string): Promise<{
        success: boolean;
        jumpRecordId: string;
        testTask: JumpTestTask;
    }>;
    /**
     * 获取跳级测试模板
     */
    private getJumpTestTemplate;
    /**
     * 使用AI生成跳级测试任务
     */
    private generateJumpTestTaskWithAI;
    /**
     * 推送跳级测试任务
     */
    pushJumpTestTask(studentId: string, jumpRecordId: string, testTask: JumpTestTask): Promise<string>;
    /**
     * 审核跳级测试（AI-03跳级模式）
     */
    reviewJumpTest(orderId: string, submissionContent: string, fileUrls: string[]): Promise<{
        passed: boolean;
        score: number;
        feedback: string;
    }>;
    /**
     * AI审核跳级测试（更严格的标准）
     */
    private aiReviewJumpTest;
    /**
     * 升级学生等级
     */
    private upgradeStudent;
    /**
     * 订单完成后减少冷却期计数
     */
    decreaseCoolingOrders(studentId: string): Promise<void>;
}
declare const _default: JumpTestService;
export default _default;
//# sourceMappingURL=jumpTestService.d.ts.map