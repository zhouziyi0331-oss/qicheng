/**
 * Claude API 服务
 * 提供统一的Claude API调用接口
 */
interface ClaudeMessage {
    role: 'user' | 'assistant';
    content: string;
}
interface ClaudeResponse {
    content: string;
    usage?: {
        input_tokens: number;
        output_tokens: number;
    };
}
declare class ClaudeService {
    /**
     * 调用Claude API生成文本
     */
    generateText(messages: ClaudeMessage[], options?: {
        model?: string;
        maxTokens?: number;
        temperature?: number;
        system?: string;
    }): Promise<ClaudeResponse>;
    /**
     * 简化的单次对话接口
     */
    chat(prompt: string | Array<{
        role: string;
        content: string;
    }>, options?: {
        model?: string;
        maxTokens?: number;
        temperature?: number;
        system?: string;
    }): Promise<string>;
}
export declare const claudeService: ClaudeService;
export {};
//# sourceMappingURL=claudeService.d.ts.map