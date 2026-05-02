import { Request, Response, NextFunction } from 'express';
import { query, queryOne, withTransaction, updateBalanceOptimistic } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';
import { config } from '../../../config';
import logger from '../../utils/logger';
import { verifyWechatSignature, verifyAlipaySignature } from '../../utils/payment';

// GET /payments/balance
export async function getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const balance = await queryOne(
      'SELECT balance, total_earned, total_withdrawn FROM student_balances WHERE user_id = $1',
      [userId]
    );
    res.json({ success: true, data: balance });
  } catch (err) { next(err); }
}

// GET /payments/history
export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const payments = await query(
      `SELECT p.id, p.net_amount, p.status, p.is_first_task, p.settled_at,
              p.created_at, t.title as task_title
       FROM payments p
       LEFT JOIN tasks t ON t.id = p.task_id
       WHERE p.student_id = $1 AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC LIMIT 50`,
      [userId]
    );
    res.json({ success: true, data: payments });
  } catch (err) { next(err); }
}

// POST /payments/withdraw — 申请提现
export async function requestWithdrawal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { amount, method, accountInfo } = req.body;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < config.platform.minWithdrawalAmount) {
      throw new AppError(400, `最低提现金额 ¥${config.platform.minWithdrawalAmount}`, 'AMOUNT_TOO_LOW');
    }

    if (!['wechat', 'alipay'].includes(method)) {
      throw new AppError(400, '提现方式仅支持微信和支付宝', 'INVALID_METHOD');
    }

    const balance = await queryOne<{ balance: number }>(
      'SELECT balance FROM student_balances WHERE user_id = $1',
      [userId]
    );
    if (!balance || balance.balance < withdrawAmount) {
      throw new AppError(400, '余额不足', 'INSUFFICIENT_BALANCE');
    }

    await withTransaction(async (client) => {
      // 乐观锁扣减余额
      await updateBalanceOptimistic(client, userId, -withdrawAmount);

      // 创建提现记录
      const autoProcessed = withdrawAmount <= config.platform.autoWithdrawalLimit;
      await client.query(
        `INSERT INTO withdrawals (user_id, amount, method, account_info, status, auto_processed)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [userId, withdrawAmount, method, accountInfo, 'pending', autoProcessed]
      );

      // 更新 total_withdrawn
      await client.query(
        `UPDATE student_balances
         SET total_withdrawn = total_withdrawn + $1
         WHERE user_id = $2`,
        [withdrawAmount, userId]
      );
    });

    const isAuto = withdrawAmount <= config.platform.autoWithdrawalLimit;
    res.json({
      success: true,
      message: isAuto
        ? '提现申请已提交，T+1工作日到账'
        : '提现申请已提交，需财务审核，T+3工作日到账',
      data: { amount: withdrawAmount, autoProcessed: isAuto },
    });
  } catch (err) { next(err); }
}

// ============================================================
// 支付回调 (微信/支付宝)
// 幂等性: 使用 payment_id 防止重复处理
// ============================================================
export async function wechatNotify(req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    // 验证微信签名
    const timestamp = req.headers['wechatpay-timestamp'] as string;
    const nonce = req.headers['wechatpay-nonce'] as string;
    const signature = req.headers['wechatpay-signature'] as string;
    const body = JSON.stringify(req.body);

    if (!verifyWechatSignature(timestamp, nonce, body, signature)) {
      logger.warn('WeChat signature verification failed');
      res.status(401).send('<xml><return_code>FAIL</return_code></xml>');
      return;
    }

    const { out_trade_no: paymentId, trade_state: state } = req.body;

    if (state !== 'SUCCESS') {
      res.send('<xml><return_code>SUCCESS</return_code></xml>');
      return;
    }

    await processPaymentSuccess(paymentId);
    res.send('<xml><return_code>SUCCESS</return_code></xml>');
  } catch (err) {
    logger.error('WeChat notify error', { error: (err as Error).message });
    res.status(500).send('<xml><return_code>FAIL</return_code></xml>');
  }
}

export async function alipayNotify(req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    // 验证支付宝签名
    const signature = req.body.sign;
    if (!verifyAlipaySignature(req.body, signature)) {
      logger.warn('Alipay signature verification failed');
      res.send('fail');
      return;
    }

    const { out_trade_no: paymentId, trade_status: state } = req.body;

    if (!['TRADE_SUCCESS', 'TRADE_FINISHED'].includes(state)) {
      res.send('success');
      return;
    }

    await processPaymentSuccess(paymentId);
    res.send('success');
  } catch (err) {
    logger.error('Alipay notify error', { error: (err as Error).message });
    res.send('fail');
  }
}

// ============================================================
// 内部: 处理支付成功 (幂等)
// ============================================================
async function processPaymentSuccess(paymentId: string): Promise<void> {
  const payment = await queryOne<{
    id: string; student_id: string; status: string; net_amount: number; is_first_task: boolean;
  }>(
    `SELECT id, student_id, status, net_amount, is_first_task
     FROM payments WHERE payment_id = $1`,
    [paymentId]
  );

  if (!payment) {
    logger.warn('Payment not found for notify', { paymentId });
    return;
  }

  if (payment.status !== 'pending') {
    // 幂等: 已处理，忽略
    logger.info('Duplicate payment notify ignored', { paymentId, status: payment.status });
    return;
  }

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE payments SET status = 'escrowed' WHERE payment_id = $1`,
      [paymentId]
    );

    // 首单: 立即加入余额 (24h到账由 cron job 发通知)
    if (payment.is_first_task) {
      await updateBalanceOptimistic(client, payment.student_id, payment.net_amount);
      await client.query(
        `UPDATE payments SET status = 'settled', settled_at = NOW() WHERE payment_id = $1`,
        [paymentId]
      );
    }
  });

  // 检查是否是报告支付
  const report = await queryOne<{ id: string; report_type: string; user_id: string }>(
    `SELECT id, report_type, user_id FROM opc_reports WHERE payment_id = $1`,
    [payment.id]
  );

  if (report) {
    // 更新报告支付状态
    await query(
      `UPDATE opc_reports SET paid_at = NOW(), paid_amount = $1 WHERE id = $2`,
      [payment.net_amount, report.id]
    );

    // R6 创业综合报告：支付后立即生成
    if (report.report_type === 'R6') {
      logger.info('Triggering R6 report generation immediately', { reportId: report.id, userId: report.user_id });
      const { triggerReportGeneration } = await import('../reports/controller');
      // 异步触发，不阻塞支付回调
      triggerReportGeneration(report.id, report.user_id).catch(err => {
        logger.error('Failed to trigger R6 report generation', { reportId: report.id, error: err.message });
      });
    } else {
      // 其他报告：24小时内异步生成（由定时任务处理）
      logger.info('Report payment confirmed, will generate within 24h', { reportId: report.id, reportType: report.report_type });
    }
  }

  logger.info('Payment processed', { paymentId, studentId: payment.student_id });
}
