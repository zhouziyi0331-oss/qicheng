/**
 * OPC集成服务
 * 连接OPC v2测试系统和语义匹配系统
 *
 * 职责：
 * 1. OPC v2测试完成后，同步数据到student_capabilities
 * 2. 触发工作条件画像生成
 * 3. 触发向量生成
 * 4. 触发语义匹配
 */
declare class OPCIntegrationService {
    /**
     * OPC v2测试完成后的集成处理
     * 这个方法应该在opcV2AssessmentService.completeAssessment()之后调用
     */
    handleOPCCompletion(assessmentId: string, studentId: string): Promise<void>;
    /**
     * 获取OPC v2测试结果
     */
    private getOPCResult;
    /**
     * 同步OPC v2结果到student_capabilities表
     *
     * 映射关系：
     * - info_processing_score → 影响学习能力和任务拆解能力
     * - creation_drive_score → 影响创造力和设计能力
     * - tool_learning_score → 影响技能学习速度
     * - task_execution_score → 影响任务执行质量
     * - collaboration_score → 影响团队协作能力
     * - risk_attitude_score → 影响接受挑战的意愿
     */
    private syncToStudentCapabilities;
    /**
     * 生成画像摘要文本
     */
    private generateProfileSummary;
    /**
     * 生成工作条件画像
     */
    private generateWorkConditionProfile;
    /**
     * 触发向量生成
     */
    private triggerVectorGeneration;
    /**
     * 触发增量匹配
     * 将新学生匹配到所有开放任务
     */
    private triggerIncrementalMatching;
    /**
     * 批量同步所有已完成OPC测试的学生
     * 用于修复历史数据
     */
    syncAllCompletedOPC(): Promise<void>;
    /**
     * 验证OPC集成是否正常工作
     */
    verifyIntegration(studentId: string): Promise<{
        opcResult: boolean;
        abilityProfile: boolean;
        studentCapability: boolean;
        workConditionProfile: boolean;
        vector: boolean;
    }>;
}
declare const _default: OPCIntegrationService;
export default _default;
//# sourceMappingURL=opcIntegrationService.d.ts.map