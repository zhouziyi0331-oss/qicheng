/**
 * 匹配任务调度器
 * 负责自动更新任务-学生匹配结果
 */
declare class MatchingScheduler {
    private dailyMatchJob;
    /**
     * 启动调度器
     */
    start(): void;
    /**
     * 停止调度器
     */
    stop(): void;
    /**
     * 重新匹配所有开放任务
     */
    rematchAllOpenTasks(): Promise<void>;
    /**
     * 重新匹配单个任务
     */
    rematchTask(taskId: string, companyId: string): Promise<void>;
    /**
     * 新学生完成OPC测评后，触发增量匹配
     */
    matchNewStudentToOpenTasks(studentId: string): Promise<void>;
    /**
     * 手动触发重新匹配（供API调用）
     */
    triggerRematch(taskId: string, companyId: string): Promise<void>;
    /**
     * 新任务发布后，立即匹配到所有学生
     */
    matchTaskToAllStudents(taskId: string): Promise<void>;
}
declare const _default: MatchingScheduler;
export default _default;
//# sourceMappingURL=matchingScheduler.d.ts.map