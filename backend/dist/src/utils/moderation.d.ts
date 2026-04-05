/**
 * AI 内容审核 - 检测故事墙发帖是否包含敏感内容
 * 返回: { safe: boolean, reason?: string }
 */
export declare function moderateContent(content: string): Promise<{
    safe: boolean;
    reason?: string;
}>;
/**
 * 联系方式过滤 - 检测并过滤微信号、QQ号、手机号
 */
export declare function filterContactInfo(content: string): {
    filtered: string;
    wasFiltered: boolean;
};
//# sourceMappingURL=moderation.d.ts.map