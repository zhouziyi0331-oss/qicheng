/**
 * 获取微信小程序 access_token
 * 自动处理缓存，避免频繁请求
 */
export declare function getWechatAccessToken(): Promise<string>;
/**
 * 图片内容安全检查
 * @param imageBuffer 图片Buffer数据
 * @returns 检查结果
 */
export declare function checkImageSecurity(imageBuffer: Buffer): Promise<{
    pass: boolean;
    reason: string;
}>;
/**
 * 文本内容安全检查
 * @param content 待检查文本
 * @param openid 用户的openid
 * @param scene 场景值 1=资料；2=评论；3=论坛；4=社交日志
 * @returns 检查结果
 */
export declare function checkTextSecurity(content: string, openid: string, scene?: 1 | 2 | 3 | 4): Promise<{
    pass: boolean;
    reason: string;
}>;
/**
 * 清除缓存的access_token（用于测试或强制刷新）
 */
export declare function clearWechatTokenCache(): void;
//# sourceMappingURL=wechatService.d.ts.map