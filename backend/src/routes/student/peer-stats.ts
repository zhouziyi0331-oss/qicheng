import { Request, Response, NextFunction } from 'express';
import pool from '../../config/database';

export async function getPeerStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;

    const profileResult = await pool.query(
      'SELECT personality_label FROM student_profiles WHERE student_id = $1',
      [studentId]
    );

    if (profileResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Profile not found' });
      return;
    }

    const personalityLabel = profileResult.rows[0].personality_label || '创作者';

    const peerStatsResult = await pool.query(
      `SELECT
        COUNT(DISTINCT sp.student_id) as total_peers,
        COUNT(DISTINCT CASE WHEN ta.id IS NOT NULL THEN sp.student_id END) * 100.0 / COUNT(DISTINCT sp.student_id) as first_order_rate,
        COALESCE(AVG(t.budget_net), 0) as avg_order_price,
        COALESCE(AVG(monthly_income.amount), 0) as avg_monthly_income
       FROM student_profiles sp
       LEFT JOIN task_assignments ta ON sp.student_id = ta.student_id AND ta.status = 'completed'
       LEFT JOIN tasks t ON ta.task_id = t.id
       LEFT JOIN (
         SELECT ta2.student_id, SUM(t2.budget_net) as amount
         FROM task_assignments ta2
         JOIN tasks t2 ON ta2.task_id = t2.id
         WHERE ta2.status = 'completed'
         AND ta2.completed_at >= NOW() - INTERVAL '30 days'
         GROUP BY ta2.student_id
       ) monthly_income ON sp.student_id = monthly_income.student_id
       WHERE sp.personality_label = $1`,
      [personalityLabel]
    );

    const peerStats = peerStatsResult.rows[0];
    const totalPeers = parseInt(peerStats.total_peers);
    const firstOrderCompletionRate = Math.floor(parseFloat(peerStats.first_order_rate || '0'));
    const avgOrderPrice = Math.floor(parseFloat(peerStats.avg_order_price));
    const avgMonthlyIncome = Math.floor(parseFloat(peerStats.avg_monthly_income));

    const myStatsResult = await pool.query(
      `SELECT
        COALESCE(AVG(client_rating), 0) as avg_quality,
        COALESCE(AVG(EXTRACT(DAY FROM (completed_at - started_at))), 0) as avg_days
       FROM task_assignments
       WHERE student_id = $1 AND status = 'completed'`,
      [studentId]
    );

    const myStats = myStatsResult.rows[0];
    const myQuality = parseFloat(myStats.avg_quality);
    const mySpeed = parseFloat(myStats.avg_days);

    const qualityPercentileResult = await pool.query(
      `WITH peer_quality AS (
        SELECT student_id, AVG(client_rating) as quality
        FROM task_assignments ta
        JOIN student_profiles sp ON ta.student_id = sp.student_id
        WHERE sp.personality_label = $1 AND ta.status = 'completed'
        GROUP BY student_id
      )
      SELECT
        COUNT(CASE WHEN quality < $2 THEN 1 END) * 100.0 / COUNT(*) as percentile
      FROM peer_quality`,
      [personalityLabel, myQuality]
    );

    const speedPercentileResult = await pool.query(
      `WITH peer_speed AS (
        SELECT student_id, AVG(EXTRACT(DAY FROM (completed_at - started_at))) as speed
        FROM task_assignments ta
        JOIN student_profiles sp ON ta.student_id = sp.student_id
        WHERE sp.personality_label = $1 AND ta.status = 'completed'
        GROUP BY student_id
      )
      SELECT
        COUNT(CASE WHEN speed > $2 THEN 1 END) * 100.0 / COUNT(*) as percentile
      FROM peer_speed`,
      [personalityLabel, mySpeed]
    );

    const qualityPercentile = Math.floor(parseFloat(qualityPercentileResult.rows[0]?.percentile || '50'));
    const speedPercentile = Math.floor(parseFloat(speedPercentileResult.rows[0]?.percentile || '50'));
    const ratingPercentile = qualityPercentile;

    res.json({
      success: true,
      data: {
        personalityLabel,
        peerStats: {
          totalPeers,
          firstOrderCompletionRate,
          avgOrderPrice,
          avgMonthlyIncome
        },
        myRanking: {
          qualityPercentile,
          speedPercentile,
          ratingPercentile
        }
      }
    });
  } catch (err) {
    next(err);
  }
}
