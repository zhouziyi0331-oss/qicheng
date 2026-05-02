/**
 * 联系方式过滤服务
 */
export declare class ContactFilterService {
    private static filterRules;
    /**
     * 加载过滤规则
     */
    static loadRules(): Promise<void>;
    /**
     * 过滤消息中的联系方式
     */
    static filterContent(content: string): {
        filtered: string;
        keywords: string[];
    };
}
/**
 * 任务沟通服务
 */
export declare class CommunicationService {
    /**
     * 企业添加任务补充说明
     */
    static addClarification(taskId: number, companyId: number, content: string, attachments?: any[]): Promise<any>;
    /**
     * 获取任务的所有补充说明
     */
    static getClarifications(taskId: number): Promise<any[]>;
    /**
     * 学生提问（先问AI）
     */
    static askQuestion(taskId: number, studentId: number, question: string): Promise<any>;
    /**
     * AI回答问题（基于知识库匹配）
     */
    private static getAIAnswer;
    /**
     * 转发问题给企业
     */
    static forwardToCompany(questionId: number, studentId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * 企业回答学生问题
     */
    static answerQuestion(questionId: number, companyId: number, answer: string): Promise<any>;
    /**
     * 获取任务的所有问答
     */
    static getQuestions(taskId: number, userId: number, userRole: string): Promise<any[]>;
    /**
     * 发送中转消息（自动过滤联系方式）
     */
    static sendRelayMessage(taskId: number, senderId: number, receiverId: number, content: string, attachments?: any[]): Promise<any>;
    /**
     * 获取中转消息列表
     */
    static getRelayMessages(taskId: number, userId: number): Promise<any[]>;
    /**
     * 获取未读消息数
     */
    static getUnreadCount(userId: number): Promise<number>;
    /**
     * 标记AI回答是否有帮助
     */
    static markAIAnswerHelpful(questionId: number, isHelpful: boolean): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=communicationService.d.ts.map