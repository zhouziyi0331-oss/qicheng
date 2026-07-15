/**
 * Phase 2.1: OPC身份卡片服务
 *
 * 功能：
 * 1. 生成可分享的身份卡片数据
 * 2. 保存卡片生成记录
 * 3. 支持卡片访问统计
 */
interface IdentityCardData {
    cardId: string;
    studentId: string;
    personalityType: string;
    personalityTypeLabel: string;
    declaration: string;
    strengths: string[];
    level: number;
    completedTasksCount: number;
    daysOnPlatform: number;
    avgScore: number;
    visualTheme: string;
    shareUrl: string;
    createdAt: Date;
}
interface CardGenerationOptions {
    includeStats?: boolean;
    theme?: 'default' | 'minimal' | 'vibrant' | 'elegant';
}
declare class OPCIdentityCardService {
    /**
     * 生成身份卡片
     */
    generateCard(studentId: string, options?: CardGenerationOptions): Promise<IdentityCardData>;
    /**
     * 获取卡片详情（用于分享链接访问）
     */
    getCardById(cardId: string, incrementView?: boolean): Promise<IdentityCardData | null>;
    /**
     * 获取学生的所有身份卡片
     */
    getStudentCards(studentId: string, limit?: number): Promise<IdentityCardData[]>;
    /**
     * 删除卡片
     */
    deleteCard(cardId: string, studentId: string): Promise<boolean>;
    /**
     * 根据人格类型选择视觉主题
     */
    private selectThemeByPersonality;
    /**
     * 获取人格类型中文标签
     */
    private getPersonalityLabel;
}
declare const _default: OPCIdentityCardService;
export default _default;
//# sourceMappingURL=opcIdentityCardService.d.ts.map