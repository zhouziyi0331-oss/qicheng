import { Request, Response, NextFunction } from 'express';
export declare function getProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getTestQuestions(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function submitTest(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getOnboardingStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function completeOnboardingStep(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getEmotionSignals(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getBalance(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getLevel(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function checkLevelUpgrade(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getNextLevel(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getTestResult(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=controller.d.ts.map