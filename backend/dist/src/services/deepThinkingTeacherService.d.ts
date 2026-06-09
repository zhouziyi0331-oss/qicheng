/**
 * 深度思考启程老师 - 统一服务
 * 整合观察、思考、记忆、表达四大能力
 */
declare class DeepThinkingTeacherService {
    /**
     * 场景1：任务开始时 - 把企业需求转化为学生能执行的第一步
     */
    onTaskStart(studentId: string, taskId: string, taskDescription: string): Promise<string>;
    /**
     * 场景2：学生卡住时 - 把学生的困难重新表述为可探索的方向
     */
    onStudentStuck(studentId: string, taskId: string, studentMessage: string, timeElapsed: number): Promise<string>;
    /**
     * 场景3：交付物被打回时 - 把企业的模糊反馈转化为具体修改方向
     */
    onWorkRejected(studentId: string, taskId: string, companyFeedback: string, attemptNumber: number): Promise<string>;
    /**
     * 场景4：学生完成里程碑时 - 把学生的成长转化为企业能看懂的价值
     */
    onMilestoneComplete(studentId: string, milestone: string, tasksCompleted: number): Promise<string>;
    /**
     * 场景5：企业浏览学生时 - 把学生人格标签翻译为商业价值
     */
    getStudentValueDescription(studentId: string): Promise<string>;
    /**
     * 主动洞察 - 定期检查学生状态，主动发现问题
     */
    proactiveInsight(studentId: string): Promise<string | null>;
    /**
     * 获取学生的深度理解（用于调试和展示）
     */
    getStudentUnderstanding(studentId: string): Promise<any>;
}
declare const _default: DeepThinkingTeacherService;
export default _default;
//# sourceMappingURL=deepThinkingTeacherService.d.ts.map