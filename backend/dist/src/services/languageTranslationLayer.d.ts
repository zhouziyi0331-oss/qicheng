/**
 * 语言转化层服务
 * 在AI-06导师引擎的五个场景中，增加企业-学生语言的双向转化
 *
 * 五个转化场景：
 * 1. T-01: 任务开始时 - 把企业需求转化为学生能执行的第一步
 * 2. T-02: 学生卡住时 - 把学生的困难重新表述为可探索的方向
 * 3. T-03: 交付物被打回时 - 把企业的模糊反馈转化为具体修改方向
 * 4. T-04: 学生完成里程碑时 - 把学生的成长转化为企业能看懂的价值
 * 5. T-05: 需求方浏览学生时 - 把学生人格标签翻译为商业价值
 */
declare class LanguageTranslationLayer {
    /**
     * 场景一：任务开始时 - 把企业需求转化为学生能执行的第一步
     * 触发时机：学生接单后30秒
     */
    translateTaskToFirstSteps(taskId: string, studentId: string): Promise<string>;
    /**
     * 场景二：学生卡住时 - 把学生的困难重新表述为可探索的方向
     * 触发时机：学生主动求助
     */
    reframeStudentDifficulty(orderId: string, studentMessage: string): Promise<string>;
    /**
     * 场景三：交付物被打回时 - 把企业的模糊反馈转化为具体修改方向
     * 触发时机：AI审核或企业打回交付物
     */
    translateRejectionFeedback(orderId: string, companyFeedback: string): Promise<string>;
    /**
     * 场景四：学生完成里程碑时 - 把学生的成长转化为企业能看懂的价值
     * 触发时机：学生完成首单或升级
     */
    translateStudentGrowthToValue(studentId: string): Promise<string>;
    /**
     * 场景五：需求方浏览学生时 - 把学生人格标签翻译为商业价值
     * 触发时机：企业查看匹配推荐的学生列表
     */
    translatePersonalityToBusinessValue(studentId: string): Promise<string>;
}
declare const _default: LanguageTranslationLayer;
export default _default;
//# sourceMappingURL=languageTranslationLayer.d.ts.map