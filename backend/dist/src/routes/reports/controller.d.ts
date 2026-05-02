import { Request, Response, NextFunction } from 'express';
export declare function listReports(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function orderReport(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getReport(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function triggerReportGeneration(reportId: string, userId: string): Promise<void>;
export declare function downloadReportPDF(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=controller.d.ts.map