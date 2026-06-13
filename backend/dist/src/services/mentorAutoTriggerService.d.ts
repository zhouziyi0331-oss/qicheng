interface MentorMessage {
    role: 'assistant';
    content: string;
    context: string;
    triggeredBy: 'T-01' | 'T-03' | 'T-05';
}
/**
 * AI导师自动触发服务
 * 实现T-01（接单后引导）、T-03（打回后修改引导）、T-05（完成后见证）
 */
declare class MentorAutoTriggerService {
    /**
     * T-01: 接单后30秒自动触发引导
     * 分析任务需求和学生画像，生成个性化引导
     */
    triggerT01(orderId: string): Promise<MentorMessage>;
    /**
     * T-04: 学生24小时无响应，自动触发轻推消息
     * 引用学生的最后一条消息，给予温和提醒
     */
    triggerT04(taskId: string, studentId: string): Promise<MentorMessage>;
    /**
     * T-03: 打回后自动触发修改引导
     * 理解企业反馈，翻译成学生能懂的具体指导
     */
    triggerT03(orderId: string, rejectionReason: string): Promise<MentorMessage>;
    /**
     * T-05: 完成后自动触发见证
     * 回顾任务历程，引用历史卡点，见证成长
     */
    triggerT05(orderId: string): Promise<MentorMessage>;
    /**
     * 构建T-04提示词（轻推消息，引用真实对话）
     */
    private buildT04Prompt;
    /**
     * 构建T-01提示词
     */
    private buildT01Prompt;
    /**
     * 构建T-03提示词
     */
    private buildT03Prompt;
    /**
     * 构建T-05提示词（注入真实成长对比数据）
     */
    private buildT05Prompt;
    /**
     * 提取关键时刻
     */
    private extractKeyMoments;
    /**
     * 计算任务用时
     */
    private calculateDuration;
    /**
     * 保存导师消息到数据库
     */
    private saveMentorMessage;
}
declare const _default: MentorAutoTriggerService;
export default _default;
//# sourceMappingURL=mentorAutoTriggerService.d.ts.map