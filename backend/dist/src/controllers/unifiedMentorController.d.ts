import { Request, Response } from 'express';
export declare class UnifiedMentorController {
    chat(req: Request, res: Response): Promise<void>;
    switchMode(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getHistory(req: Request, res: Response): Promise<void>;
    linkEmotionToProject(req: Request, res: Response): Promise<void>;
    getGrowthJourney(req: Request, res: Response): Promise<void>;
}
export declare const unifiedMentorController: UnifiedMentorController;
//# sourceMappingURL=unifiedMentorController.d.ts.map