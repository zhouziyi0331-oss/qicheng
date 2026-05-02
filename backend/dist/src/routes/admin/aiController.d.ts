import { Request, Response } from 'express';
/**
 * 获取AI调用日志列表
 */
export declare function getAICallLogs(req: Request, res: Response): Promise<void>;
/**
 * 获取AI调用统计
 */
export declare function getAICallStats(req: Request, res: Response): Promise<void>;
/**
 * 获取Prompt模板列表
 */
export declare function getPromptTemplates(req: Request, res: Response): Promise<void>;
/**
 * 创建Prompt模板
 */
export declare function createPromptTemplate(req: Request, res: Response): Promise<void>;
/**
 * 更新Prompt模板
 */
export declare function updatePromptTemplate(req: Request, res: Response): Promise<void>;
/**
 * 删除Prompt模板
 */
export declare function deletePromptTemplate(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=aiController.d.ts.map