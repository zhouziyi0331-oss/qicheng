/**
 * 首单24小时结算 Cron Job
 * 每5分钟扫描: 验收通过 + 首单 + 未结算 + 超过24小时
 * 触发平台垫付 → 余额到账 → 发送庆祝通知 → 更新 Onboarding J8
 */
import cron from 'node-cron';
import { query, withTransaction, updateBalanceOptimistic } from '../utils/db';
import logger from '../utils/logger';

// 每5分钟运行
cron.schedule('*/5 * * * *', async () => {
  try {
    // 扫描: 首单已通过 + 已托管 + 未结算 + 超过24小时
    const pendingSettlements = await query<{
      id: string; payment_id: string; student_id: string; net_amount: number;
    }>(
      `SELECT p.id, p.payment_id, p.student_id, p.net_amount
       FROM payments p
       WHERE p.is_first_task = TRUE
         AND p.status = 'escrowed'
         AND p.settled_at IS NULL
         AND p.payer = 'platform'
         AND p.updated_at < NOW() - interval '24 hours'
       LIMIT 50`
    );

    for (const payment of pendingSettlements) {
      try {
        await withTransaction(async (client) => {
          // 幂等检查
          const current = await client.query(
            'SELECT status FROM payments WHERE id = $1 FOR UPDATE',
            [payment.id]
          );
          if (current.rows[0]?.status !== 'escrowed') return;

          // 结算到余额
          await updateBalanceOptimistic(client, payment.student_id, payment.net_amount);

          // 标记已结算
          await client.query(
            `UPDATE payments SET status = 'settled', settled_at = NOW() WHERE id = $1`,
            [payment.id]
          );

          // 更新 Onboarding J8 (首单到账 = 完成整个 Journey)
          await client.query(
            `UPDATE onboarding_status
             SET j8_completed_at = NOW(), is_completed = TRUE, updated_at = NOW()
             WHERE user_id = $1 AND j8_completed_at IS NULL`,
            [payment.student_id]
          );

          // 记录成长时间线
          await client.query(
            `INSERT INTO growth_timeline (user_id, event_type, event_title, event_desc, is_milestone, event_data)
             VALUES ($1, 'first_earnings', '🎉 第一笔收入到账了！', $2, TRUE, $3::jsonb)`,
            [
              payment.student_id,
              `¥${payment.net_amount} 已到账，这是你作为OPC的第一个证明`,
              JSON.stringify({ amount: payment.net_amount }),
            ]
          );

          // 发送具有仪式感的庆祝通知 (v7 核心体验)
          await client.query(
            `INSERT INTO notifications (user_id, type, title, content, action_url)
             VALUES ($1, 'first_earnings', '🎉 你完成了人生第一单！', $2, '/home')`,
            [
              payment.student_id,
              `¥${payment.net_amount} 已到账！你刚刚证明了——「你的AI能力现在就值钱」。查看你的成长时间线，看看这是你故事的开始。`,
            ]
          );
        });

        logger.info('First task settled', { paymentId: payment.payment_id, studentId: payment.student_id });
      } catch (err: unknown) {
        logger.error('First task settlement error', { paymentId: payment.id, error: (err as Error).message });
      }
    }

    if (pendingSettlements.length > 0) {
      logger.info(`First task settlement batch done: ${pendingSettlements.length} processed`);
    }
  } catch (err: unknown) {
    logger.error('First task settlement cron failed', { error: (err as Error).message });
  }
});

logger.info('First task settlement cron started (every 5 minutes)');
