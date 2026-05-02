import { Request, Response } from 'express';
export declare class OPCGrowthController {
    static startAssessment(req: Request, res: Response): Promise<void>;
    static submitAnswer(req: Request, res: Response): Promise<void>;
    static completeAssessment(req: Request, res: Response): Promise<void>;
    static getAssessmentResult(req: Request, res: Response): Promise<void>;
    static generateGrowthReport(req: Request, res: Response): Promise<void>;
    static createAbilitySnapshot(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=opcGrowthController.d.ts.map