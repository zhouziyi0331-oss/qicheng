/**
 * AI导师长期记忆服务
 *
 * 功能：
 * 1. 生成和更新学生长期画像摘要（200字内）
 * 2. 提取高频卡点、最近突破、能力快照
 * 3. 生成风格自适应引导指令
 * 4. 为AI-06提供跨订单上下文
 */
interface StudentProfileCache {
    student_id: string;
    profile_summary: string;
    top_stuck_points: Array<{
        category: string;
        count: number;
        last_occurred: string;
        resolved: boolean;
    }>;
    recent_breakthroughs: Array<{
        description: string;
        order_id: string;
        achieved_at: string;
    }>;
    ability_snapshot: {
        level: number;
        six_dimensions: any;
        personality_tag: string;
        core_strengths: string[];
    };
    work_patterns: {
        avg_delivery_days_before_deadline: number;
        avg_revision_rounds: number;
        recent_5_orders_avg_score: number;
    };
    guidance_style: GuidanceStyle;
    last_updated: Date;
    update_trigger: string;
}
interface GuidanceStyle {
    style_type: 'visual' | 'logical' | 'independent' | 'collaborative' | 'adventurous' | 'steady';
    analogy_preference: 'image_based' | 'step_based' | 'concept_based';
    step_detail_level: 'high' | 'moderate' | 'low';
    tone: 'warm' | 'precise' | 'encouraging' | 'direct';
    system_prompt_injection: string;
}
declare class MentorMemoryService {
    /**
     * 订单完成后更新学生长期画像
     */
    updateStudentProfile(studentId: string, orderId: string): Promise<void>;
    /**
     * 收集学生基础数据
     */
    private collectStudentData;
    /**
     * 分析高频卡点（Top 3）
     */
    private analyzeTopStuckPoints;
    /**
     * 提取最近突破（Top 3）
     */
    private extractRecentBreakthroughs;
    /**
     * 获取能力快照
     */
    private getAbilitySnapshot;
    /**
     * 计算工作模式
     */
    private calculateWorkPatterns;
    /**
     * 生成引导风格（基于六维画像）
     */
    private generateGuidanceStyle;
    /**
     * 生成长期画像摘要（调用AI）
     */
    private generateProfileSummary;
    /**
     * 保存画像缓存
     */
    private saveProfileCache;
    /**
     * 获取学生长期画像（供AI-06调用）
     */
    getStudentProfile(studentId: string): Promise<StudentProfileCache | null>;
    /**
     * 构建AI-06的System Prompt（包含长期记忆和风格指令）
     */
    buildSystemPromptForAI06(studentId: string, basePrompt: string): Promise<string>;
    /**
     * 记录成长观察（供其他服务调用）
     */
    recordGrowthObservation(studentId: string, orderId: string, observationType: 'stuck_point' | 'skill_improvement' | 'tool_mastery' | 'milestone', content: string, category?: string, isSignificant?: boolean, tags?: string[]): Promise<void>;
    /**
     * 批量初始化学生画像（用于迁移现有学生）
     */
    batchInitializeProfiles(studentIds?: string[]): Promise<void>;
}
declare const _default: MentorMemoryService;
export default _default;
//# sourceMappingURL=mentorMemoryService.d.ts.map