/**
 * 任务追加需求控制器
 *
 * 处理任务追加需求相关的HTTP请求
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
         * 创建追加需求（企业）
         * POST /api/v1/task-amendments
         */
        function createAmendment(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 学生响应追加需求
         * POST /api/v1/task-amendments/:id/respond
         */
        function studentRespond(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 企业最终决定（协商后）
         * POST /api/v1/task-amendments/:id/decide
         */
        function companyDecide(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 取消追加需求（企业主动取消）
         * POST /api/v1/task-amendments/:id/cancel
         */
        function cancelAmendment(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 获取任务的所有追加需求
         * GET /api/v1/task-amendments/task/:taskId
         */
        function getTaskAmendments(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 获取追加需求详情
         * GET /api/v1/task-amendments/:id
         */
        function getAmendment(req: AuthRequest, res: Response): Promise<any>;
        /**
         * AI评估追加需求的合理性
         * POST /api/v1/task-amendments/:id/analyze
         */
        function analyzeAmendment(req: AuthRequest, res: Response): Promise<any>;
    }
}
export {};
//# sourceMappingURL=taskAmendmentController.d.ts.map