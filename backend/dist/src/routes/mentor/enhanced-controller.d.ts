import { Request, Response, NextFunction } from 'express';
/**
 * 任务匹配后，AI导师主动发起需求确认对话
 */
export declare function initiateRequirementConfirmation(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 分析学生对需求的理解是否准确
 */
export declare function analyzeStudentUnderstanding(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 学生求助时的启发式引导
 */
export declare function provideInspirationalGuidance(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 学生完成一个步骤后的鼓励和下一步引导
 */
export declare function celebrateProgressAndGuideNext(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 学生提交作品后，AI先审核
 */
export declare function reviewSubmission(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 企业提出修改意见，AI翻译给学生
 */
export declare function translateCompanyFeedback(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 学生有疑问，AI翻译给企业
 */
export declare function translateStudentQuestion(req: Request, res: Response, next: NextFunction): Promise<void>;
declare const _default: {
    initiateRequirementConfirmation: typeof initiateRequirementConfirmation;
    analyzeStudentUnderstanding: typeof analyzeStudentUnderstanding;
    provideInspirationalGuidance: typeof provideInspirationalGuidance;
    celebrateProgressAndGuideNext: typeof celebrateProgressAndGuideNext;
    reviewSubmission: typeof reviewSubmission;
    translateCompanyFeedback: typeof translateCompanyFeedback;
    translateStudentQuestion: typeof translateStudentQuestion;
};
export default _default;
//# sourceMappingURL=enhanced-controller.d.ts.map