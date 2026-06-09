import { Request, Response, NextFunction } from 'express';
import { query, queryOne, withTransaction } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../utils/logger';

/**
 * 完整业务流程API
 *
 * 流程：
 * 1. 企业发布任务 → AI价格建议 → 企业定价 → 支付30%定金
 * 2. AI匹配10个学生 → 企业选5个 → 发送邀请
 * 3. 学生接单（看到85%价格）→ 第一个接受的学生获得任务
 * 4. 学生执行任务 → 更新进度 → 提交交付物
 * 5. AI审核 → 企业验收 → 支付70%尾款
 * 6. 7天内确认或自动确认 → 平台付款给学生
 * 7. 连续合作2次 → 交换微信
 */

// ============================================
// 1. 企业发布任务 - 获取AI价格建议
// ============================================
export async function getAIPriceSuggestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, description, taskType, estimatedMinutes } = req.body;

    if (!title || !description) {
      throw new AppError(400, '任务标题和描述为必填项', 'MISSING_FIELDS');
    }

    // TODO: 调用AI服务分析任务复杂度
    // 这里先用简单规则模拟
    let minPrice = 500;
    let maxPrice = 1000;

    // 根据任务类型调整价格区间
    if (taskType === '软件开发') {
      minPrice = 800;
      maxPrice = 2000;
    } else if (taskType === 'UI设计') {
      minPrice = 500;
      maxPrice = 1500;
    } else if (taskType === '文案撰写') {
      minPrice = 300;
      maxPrice = 800;
    }

    // 根据预计时长调整
    if (estimatedMinutes) {
      const hours = estimatedMinutes / 60;
      minPrice = Math.round(hours * 50);
      maxPrice = Math.round(hours * 100);
    }

    logger.info('AI price suggestion generated', { title, minPrice, maxPrice });

    res.json({
      success: true,
      data: {
        aiPriceMin: minPrice,
        aiPriceMax: maxPrice,
        suggestion: `根据任务复杂度分析，建议定价区间为 ¥${minPrice} - ¥${maxPrice}`,
        factors: [
          '任务类型：' + (taskType || '未指定'),
          '预计时长：' + (estimatedMinutes ? `${Math.round(estimatedMinutes / 60)}小时` : '未指定'),
          '市场行情：当前该类型任务平均价格'
        ]
      }
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// 2. 企业发布任务 - 支付定金
// ============================================
export async function publishTaskWithDeposit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.user!.userId;
    const {
      title,
      description,
      taskType,
      track,
      levelRequired,
      acceptanceCriteria,
      deadline,
      estimatedMinutes,
      aiPriceMin,
      aiPriceMax,
      companyPrice, // 企业在AI建议区间内定价
      paymentMethod,
      transactionId
    } = req.body;

    // 验证必填字段
    if (!title || !description || !companyPrice || !acceptanceCriteria) {
      throw new AppError(400, '标题、描述、定价和验收标准为必填项', 'MISSING_FIELDS');
    }

    // 验证企业定价是否在AI建议区间内
    const price = parseFloat(companyPrice);
    if (aiPriceMin && aiPriceMax) {
      if (price < aiPriceMin || price > aiPriceMax) {
        throw new AppError(400, `定价需在AI建议区间 ¥${aiPriceMin} - ¥${aiPriceMax} 内`, 'PRICE_OUT_OF_RANGE');
      }
    }

    // 计算价格分配
    const studentPrice = parseFloat((price * 0.85).toFixed(2)); // 学生看到85%
    const platformFee = parseFloat((price * 0.15).toFixed(2)); // 平台抽成15%
    const depositAmount = parseFloat((price * 0.30).toFixed(2)); // 定金30%
    const finalAmount = parseFloat((price * 0.70).toFixed(2)); // 尾款70%

    await withTransaction(async (client) => {
      // 1. 创建任务
      const taskResult = await client.query(
        `INSERT INTO tasks (
          company_id, title, description, task_type, track, level_required,
          budget_gross, budget_net, platform_fee_rate, acceptance_criteria,
          deadline, estimated_minutes,
          ai_price_min, ai_price_max, company_price, student_price, platform_fee,
          deposit_amount, final_amount, deposit_paid,
          status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
        RETURNING id`,
        [
          companyId, title, description, taskType, track || 'A', levelRequired || 0,
          price, studentPrice, 0.15, acceptanceCriteria,
          deadline, estimatedMinutes,
          aiPriceMin, aiPriceMax, price, studentPrice, platformFee,
          depositAmount, finalAmount, true,
          'pending_match' // 定金已支付，待匹配
        ]
      );

      const taskId = taskResult.rows[0].id;

      // 2. 记录定金支付
      await client.query(
        `INSERT INTO payments (
          task_id, payer_id, payer_type, receiver_id, receiver_type,
          amount, payment_type, payment_method, transaction_id, status, paid_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
        [
          taskId, companyId, 'company', 'platform', 'platform',
          depositAmount, 'deposit', paymentMethod, transactionId, 'success'
        ]
      );

      // 3. 更新企业统计
      await client.query(
        'UPDATE company_profiles SET total_tasks_posted = total_tasks_posted + 1 WHERE user_id = $1',
        [companyId]
      );

      // 4. 创建通知
      await client.query(
        `INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
         VALUES ($1, 'company', 'task_published', '任务发布成功', $2, $3)`,
        [
          companyId,
          `您的任务《${title}》已发布，定金¥${depositAmount}已支付，AI正在为您匹配最合适的学生...`,
          taskId
        ]
      );

      logger.info('Task published with deposit', {
        taskId,
        companyId,
        companyPrice: price,
        studentPrice,
        depositAmount
      });

      res.status(201).json({
        success: true,
        data: {
          taskId,
          companyPrice: price,
          studentPrice,
          platformFee,
          depositAmount,
          finalAmount,
          depositPaid: true,
          status: 'pending_match',
          message: '任务发布成功！定金已支付，AI正在为您匹配10位最合适的学生...'
        }
      });
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// 3. AI匹配10个学生（后台任务触发）
// ============================================
export async function triggerAIMatching(taskId: string): Promise<void> {
  try {
    // 获取任务信息
    const task = await queryOne<any>(
      `SELECT * FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (!task) {
      throw new Error('Task not found');
    }

    // TODO: 调用AI服务进行智能匹配
    // 这里先用简单规则模拟：随机选择10个符合条件的学生
    const students = await query<any>(
      `SELECT u.id, u.nickname, sp.level, sp.total_score
       FROM users u
       JOIN student_profiles sp ON u.id = sp.user_id
       WHERE u.role = 'student'
         AND u.is_active = true
         AND sp.level >= $1
       ORDER BY RANDOM()
       LIMIT 10`,
      [task.level_required || 0]
    );

    // 创建匹配记录
    for (const student of students) {
      const matchScore = Math.floor(Math.random() * 20) + 80; // 80-100分
      const matchReason = `该学生等级${student.level}，综合评分${student.total_score}，与任务需求高度匹配`;

      await query(
        `INSERT INTO ai_matches (
          task_id, student_id, match_score, match_reason, is_selected_by_company
        ) VALUES ($1,$2,$3,$4,false)`,
        [taskId, student.id, matchScore, matchReason]
      );
    }

    // 更新任务状态
    await query(
      `UPDATE tasks SET status = 'matching' WHERE id = $1`,
      [taskId]
    );

    // 通知企业
    await query(
      `INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
       VALUES ($1, 'company', 'matching_complete', 'AI匹配完成', $2, $3)`,
      [
        task.company_id,
        `AI已为您的任务《${task.title}》匹配了10位优秀学生，请查看并选择5位发送邀请`,
        taskId
      ]
    );

    logger.info('AI matching completed', { taskId, matchedCount: students.length });
  } catch (err) {
    logger.error('AI matching failed', { taskId, error: err });
    throw err;
  }
}

// ============================================
// 4. 企业查看匹配的10个学生
// ============================================
export async function getMatchedStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.user!.userId;
    const { taskId } = req.params;

    // 验证任务归属
    const task = await queryOne<any>(
      `SELECT * FROM tasks WHERE id = $1 AND company_id = $2`,
      [taskId, companyId]
    );

    if (!task) {
      throw new AppError(404, '任务不存在', 'TASK_NOT_FOUND');
    }

    // 获取匹配的学生
    const matches = await query<any>(
      `SELECT
        am.id as match_id,
        am.match_score,
        am.match_reason,
        am.is_selected_by_company,
        u.id as student_id,
        u.nickname,
        u.avatar_url,
        sa.current_level as level,
        sa.total_growth_points as total_score,
        sa.total_completed_tasks as completed_tasks,
        0 as average_rating
       FROM ai_matches am
       JOIN users u ON am.student_id = u.id
       JOIN student_abilities sa ON u.id = sa.user_id
       WHERE am.task_id = $1
       ORDER BY am.match_score DESC`,
      [taskId]
    );

    res.json({
      success: true,
      data: {
        taskId,
        taskTitle: task.title,
        totalMatched: matches.length,
        matches: matches.map((m: any) => ({
          matchId: m.match_id,
          studentId: m.student_id,
          nickname: m.nickname,
          avatarUrl: m.avatar_url,
          level: m.level,
          totalScore: m.total_score,
          completedTasks: m.completed_tasks,
          averageRating: m.average_rating,
          matchScore: m.match_score,
          matchReason: m.match_reason,
          isSelected: m.is_selected_by_company
        }))
      }
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// 5. 企业从10个中选择5个学生
// ============================================
export async function selectStudentsForInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.user!.userId;
    const { taskId } = req.params;
    const { selectedMatchIds } = req.body; // 选中的匹配记录ID数组

    if (!selectedMatchIds || selectedMatchIds.length !== 5) {
      throw new AppError(400, '请选择5位学生', 'INVALID_SELECTION');
    }

    // 验证任务归属
    const task = await queryOne<any>(
      `SELECT * FROM tasks WHERE id = $1 AND company_id = $2`,
      [taskId, companyId]
    );

    if (!task) {
      throw new AppError(404, '任务不存在', 'TASK_NOT_FOUND');
    }

    await withTransaction(async (client) => {
      // 1. 标记选中的学生
      await client.query(
        `UPDATE ai_matches
         SET is_selected_by_company = true, is_invited = true
         WHERE id = ANY($1) AND task_id = $2`,
        [selectedMatchIds, taskId]
      );

      // 2. 获取选中的学生ID
      const selectedStudents = await client.query(
        `SELECT student_id FROM ai_matches WHERE id = ANY($1)`,
        [selectedMatchIds]
      );

      // 3. 给每个学生发送邀请通知
      for (const row of selectedStudents.rows) {
        await client.query(
          `INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
           VALUES ($1, 'student', 'task_invitation', '收到任务邀请', $2, $3)`,
          [
            row.student_id,
            `您收到了任务《${task.title}》的邀请，报酬¥${task.student_price}，先到先得！`,
            taskId
          ]
        );
      }

      // 4. 更新任务状态
      await client.query(
        `UPDATE tasks SET status = 'pending_accept' WHERE id = $1`,
        [taskId]
      );

      logger.info('Students selected for invitation', {
        taskId,
        companyId,
        selectedCount: selectedMatchIds.length
      });

      res.json({
        success: true,
        data: {
          taskId,
          selectedCount: selectedMatchIds.length,
          status: 'pending_accept',
          message: '已向5位学生发送邀请，第一个接受的学生将获得任务'
        }
      });
    });
  } catch (err) {
    next(err);
  }
}

// 导出所有函数
export default {
  getAIPriceSuggestion,
  publishTaskWithDeposit,
  triggerAIMatching,
  getMatchedStudents,
  selectStudentsForInvitation
};
