/**
 * 支付托管和提现控制器（新版）
 *
 * 基于063_escrow_withdrawal_system.sql的完整实现
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
         * 获取托管账户信息
         * GET /api/v1/escrow/account
         */
        function getAccount(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 获取或创建托管账户
         * POST /api/v1/escrow/account/init
         */
        function initAccount(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 托管资金（企业支付任务款项）
         * POST /api/v1/escrow/deposit
         */
        function depositFunds(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 释放资金（任务完成后支付给学生）
         * POST /api/v1/escrow/release
         */
        function releaseFunds(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 申请提现
         * POST /api/v1/escrow/withdrawal/request
         */
        function requestWithdrawal(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 获取提现记录
         * GET /api/v1/escrow/withdrawal/history
         */
        function getWithdrawalHistory(req: AuthRequest, res: Response): Promise<any>;
        /**
         * 获取账户流水
         * GET /api/v1/escrow/transactions
         */
        function getTransactions(req: AuthRequest, res: Response): Promise<any>;
    }
}
export {};
//# sourceMappingURL=escrowController.d.ts.map