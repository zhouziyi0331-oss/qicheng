/**
 * 任务草稿控制器
 *
 * 处理任务草稿相关的HTTP请求
 */
import { Request, Response } from 'express';
/**
 * 创建新草稿
 * POST /api/v1/task-drafts
 */
export declare function createDraft(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取草稿列表
 * GET /api/v1/task-drafts
 */
export declare function getDrafts(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取草稿详情
 * GET /api/v1/task-drafts/:id
 */
export declare function getDraft(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 更新草稿
 * PUT /api/v1/task-drafts/:id
 */
export declare function updateDraft(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 删除草稿
 * DELETE /api/v1/task-drafts/:id
 */
export declare function deleteDraft(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 复制草稿
 * POST /api/v1/task-drafts/:id/duplicate
 */
export declare function duplicateDraft(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * AI审核草稿
 * POST /api/v1/task-drafts/:id/review
 */
export declare function reviewDraft(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取AI定价建议
 * POST /api/v1/task-drafts/:id/pricing-suggestion
 */
export declare function getPricingSuggestion(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 发布草稿为正式任务
 * POST /api/v1/task-drafts/:id/publish
 */
export declare function publishDraft(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取草稿历史版本
 * GET /api/v1/task-drafts/:id/history
 */
export declare function getDraftHistory(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 恢复到历史版本
 * POST /api/v1/task-drafts/:id/restore/:historyId
 */
export declare function restoreDraftVersion(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=taskDraftController.d.ts.map