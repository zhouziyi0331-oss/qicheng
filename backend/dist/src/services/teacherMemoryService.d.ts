/**
 * 启程老师记忆系统
 * 负责记忆巩固、长期理解更新
 */
declare class TeacherMemoryService {
    /**
     * 巩固记忆 - 将短期记忆转化为长期理解
     * 应该定期运行（例如每天一次）
     */
    consolidateMemory(studentId: string): Promise<void>;
    /**
     * 分析并更新长期理解
     */
    private analyzeAndUpdateUnderstanding;
    /**
     * 默认理解（当AI调用失败时）
     */
    private getDefaultUnderstanding;
    /**
     * 获取学生的长期记忆
     */
    getLongTermMemory(studentId: string): Promise<any>;
    /**
     * 批量巩固记忆（定时任务）
     */
    consolidateAllMemories(): Promise<void>;
    /**
     * 清理旧的短期记忆（已巩固且超过30天）
     */
    cleanupOldMemories(): Promise<void>;
}
declare const _default: TeacherMemoryService;
export default _default;
//# sourceMappingURL=teacherMemoryService.d.ts.map