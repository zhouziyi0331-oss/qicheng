/**
 * 任务草稿控制器
 *
 * 处理任务草稿相关的HTTP请求
 */
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: string;
            };
        }
        /**
         * 创建新草稿
         * POST /api/v1/task-drafts
         */
        function createDraft(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 获取草稿列表
         * GET /api/v1/task-drafts
         */
        function getDrafts(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 获取草稿详情
         * GET /api/v1/task-drafts/:id
         */
        function getDraft(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 更新草稿
         * PUT /api/v1/task-drafts/:id
         */
        function updateDraft(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 删除草稿
         * DELETE /api/v1/task-drafts/:id
         */
        function deleteDraft(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 复制草稿
         * POST /api/v1/task-drafts/:id/duplicate
         */
        function duplicateDraft(req: AuthRequest, res: Response): Promise<any>;
        /**
         * AI审核草稿
         * POST /api/v1/task-drafts/:id/review
         */
        function reviewDraft(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 获取AI定价建议
         * POST /api/v1/task-drafts/:id/pricing-suggestion
         */
        function getPricingSuggestion(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 发布草稿为正式任务
         * POST /api/v1/task-drafts/:id/publish
         */
        function publishDraft(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 获取草稿历史版本
         * GET /api/v1/task-drafts/:id/history
         */
        function getDraftHistory(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 恢复到历史版本
         * POST /api/v1/task-drafts/:id/restore/:historyId
         */
        function restoreDraftVersion(req: AuthRequest, res: Response): Promise<any>;
    }
}
export {};
//# sourceMappingURL=taskDraftController.d.ts.map