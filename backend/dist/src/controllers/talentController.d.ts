import { Request, Response } from 'express';
export declare class TalentController {
    static getStudentTalentProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getAllTalentTags(req: Request, res: Response): Promise<void>;
    static getAllBusinessScenarios(req: Request, res: Response): Promise<void>;
    static matchStudentsForTask(req: Request, res: Response): Promise<void>;
    static inferTalentsFromOPC(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static extractCapabilitiesFromTask(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static createRequirementBreakdown(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getRequirementBreakdown(req: Request, res: Response): Promise<void>;
    static matchStudentsForRequirement(req: Request, res: Response): Promise<void>;
    static getStudentGrowthStats(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=talentController.d.ts.map