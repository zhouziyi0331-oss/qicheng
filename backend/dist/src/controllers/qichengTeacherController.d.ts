import { Request, Response } from 'express';
/**
 * 启程老师控制器
 * 提供任务翻译API
 */
/**
 * 获取任务的启程老师翻译
 * GET /api/v1/tasks/:taskId/translation
 */
export declare const getTaskTranslation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 为任务生成需求摘要（用于向量生成）
 * POST /api/v1/tasks/:taskId/generate-summary
 */
export declare const generateRequirementSummary: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=qichengTeacherController.d.ts.map