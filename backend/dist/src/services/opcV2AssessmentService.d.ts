export declare class OPCV2AssessmentService {
    /**
     * 开始新测试
     */
    static startAssessment(studentId: string): Promise<{
        assessment: any;
        answeredQuestionIds: any[];
    } | {
        assessment: any;
        questions: any[];
    }>;
    /**
     * 提交答案
     */
    static submitAnswer(assessmentId: string, questionId: string, answer: {
        answerText?: string;
        selectedOption?: string;
        selfDefinedIdentity?: string[];
        selfDefinedAwesome?: string;
    }): Promise<{
        success: boolean;
    }>;
    /**
     * 完成测试并生成结果
     */
    static completeAssessment(assessmentId: string): Promise<any>;
    /**
     * 判定人格标签
     */
    private static determinePersonalityLabel;
    /**
     * 生成维度描述
     */
    private static generateDimensionDescriptions;
    /**
     * 获取测试进度
     */
    static getAssessmentProgress(assessmentId: string): Promise<{
        assessment: any;
        answeredQuestionIds: any[];
    }>;
    /**
     * 获取测试结果
     */
    static getAssessmentResult(assessmentId: string): Promise<any>;
    /**
     * 获取学生的最新测试结果
     */
    static getLatestResult(studentId: string): Promise<any>;
}
//# sourceMappingURL=opcV2AssessmentService.d.ts.map