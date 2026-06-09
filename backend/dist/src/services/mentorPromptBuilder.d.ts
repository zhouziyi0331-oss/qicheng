import { MentorStage } from './mentorStageService';
/**
 * AI导师Prompt构建服务
 * 负责根据不同阶段和上下文构建高质量的Prompt
 */
export interface PromptTemplate {
    id: string;
    stage: MentorStage;
    templateName: string;
    systemPrompt: string;
    userPromptTemplate: string;
    variables: string[];
    modelRecommendation: 'opus' | 'sonnet' | 'haiku';
    maxTokens: number;
    temperature: number;
    isActive: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface PromptContext {
    taskTitle: string;
    taskDescription: string;
    taskRequirements?: string;
    taskDeadline?: Date;
    studentName: string;
    studentLevel?: string;
    studentMajor?: string;
    companyName: string;
    companyIndustry?: string;
    conversationHistory?: Array<{
        role: string;
        content: string;
    }>;
    stageSpecificData?: any;
}
export declare class MentorPromptBuilder {
    /**
     * 获取模板
     */
    getTemplate(stage: MentorStage, templateName?: string): Promise<PromptTemplate | null>;
    /**
     * 构建完整的Prompt
     */
    buildPrompt(stage: MentorStage, context: PromptContext, templateName?: string): Promise<{
        systemPrompt: string;
        userPrompt: string;
        modelRecommendation: 'opus' | 'sonnet' | 'haiku';
        maxTokens: number;
        temperature: number;
    }>;
    /**
     * 替换模板变量
     */
    private replaceVariables;
    /**
     * 构建默认Prompt（当数据库中没有模板时使用）
     */
    private buildDefaultPrompt;
    /**
     * 获取默认系统Prompt
     */
    private getDefaultSystemPrompt;
    /**
     * 构建会话历史上下文
     */
    buildConversationContext(messages: Array<{
        role: string;
        content: string;
    }>, maxMessages?: number): string;
    /**
     * 创建或更新模板
     */
    saveTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
}
export declare const mentorPromptBuilder: MentorPromptBuilder;
//# sourceMappingURL=mentorPromptBuilder.d.ts.map