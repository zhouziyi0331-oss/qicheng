interface DetectedIssue {
    issue: string;
    quote: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
interface ScopeAlert {
    id: string;
    task_id: string;
    sender_id: string;
    sender_role: string;
    message_content: string;
    alert_type: string;
    severity: string;
    ai_analysis: string;
    confidence_score: number;
    detected_issues: DetectedIssue[];
    suggested_response: string;
    prevention_tips: string[];
}
/**
 * E-22: 聊天超范围监测服务
 * 实时监测聊天内容，识别超范围请求
 */
declare class ChatScopeMonitoringService {
    /**
     * 监测聊天消息
     */
    monitorMessage(data: {
        taskId: string;
        senderId: string;
        senderRole: 'company' | 'student';
        messageContent: string;
        taskContext?: {
            title: string;
            description: string;
            requirements: string[];
        };
    }): Promise<ScopeAlert | null>;
    /**
     * 基于规则的检测（快速）
     */
    private detectWithRules;
    /**
     * AI深度分析
     */
    private detectWithAI;
    /**
     * 合并规则和AI的检测结果
     */
    private mergeResults;
    /**
     * 创建警报记录
     */
    private createAlert;
    /**
     * 获取任务的警报列表
     */
    getTaskAlerts(taskId: string, status?: string): Promise<ScopeAlert[]>;
    /**
     * 用户确认警报
     */
    acknowledgeAlert(alertId: string, userId: string, action: 'accepted' | 'ignored' | 'reported'): Promise<void>;
    /**
     * 获取任务的监测统计
     */
    getMonitoringStats(taskId: string): Promise<any>;
    /**
     * 获取监测规则
     */
    getMonitoringRules(): Promise<any[]>;
    /**
     * 解析AI响应
     */
    private parseAIResponse;
    /**
     * 提取引用片段
     */
    private extractQuote;
}
declare const _default: ChatScopeMonitoringService;
export default _default;
//# sourceMappingURL=chatScopeMonitoringService.d.ts.map