/**
 * AI内容审核服务
 * 用于检测社区帖子和评论中的违规内容
 */
interface ContentAuditResult {
    passed: boolean;
    confidence: number;
    flags: string[];
    reason: string;
}
interface ContentAuditRequest {
    contentType: 'post' | 'comment';
    contentText: string;
    userId: string;
    title?: string;
}
declare class ContentAuditService {
    private client;
    constructor();
    /**
     * 审核内容
     */
    auditContent(request: ContentAuditRequest): Promise<ContentAuditResult>;
    /**
     * 构建审核提示词
     */
    private buildAuditPrompt;
    /**
     * 解析AI审核响应
     */
    private parseAuditResponse;
    /**
     * 批量审核（用于管理端复核）
     */
    batchAudit(contents: Array<{
        id: string;
        type: 'post' | 'comment';
        text: string;
        title?: string;
    }>): Promise<Map<string, ContentAuditResult>>;
    /**
     * 检查用户是否被限制
     */
    checkUserRestriction(userId: string, restrictionType: 'comment_ban' | 'post_ban' | 'full_ban'): Promise<{
        restricted: boolean;
        reason?: string;
        expiresAt?: Date;
    }>;
    /**
     * 添加用户限制
     */
    addUserRestriction(userId: string, restrictionType: 'comment_ban' | 'post_ban' | 'full_ban', reason: string, durationHours: number, createdBy?: string): Promise<void>;
}
declare const _default: ContentAuditService;
export default _default;
//# sourceMappingURL=contentAuditService.d.ts.map