import { Request, Response } from 'express';
export declare class PBLAgentController {
    initializeProject(req: Request, res: Response): Promise<void>;
    chat(req: Request, res: Response): Promise<void>;
    guideTaskDecomposition(req: Request, res: Response): Promise<void>;
    evaluateDecomposition(req: Request, res: Response): Promise<void>;
    suggestMVP(req: Request, res: Response): Promise<void>;
    executeCode(req: Request, res: Response): Promise<void>;
    guideReflection(req: Request, res: Response): Promise<void>;
    saveReflection(req: Request, res: Response): Promise<void>;
}
export declare const pblAgentController: PBLAgentController;
//# sourceMappingURL=pblAgentController.d.ts.map