import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { query, queryOne, withTransaction } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';
import { config } from '../../../config';
import logger from '../../utils/logger';

// GET /student/profile
export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const profile = await queryOne(
      `SELECT u.id, u.phone, u.nickname, u.avatar_url, u.university, u.city, u.major, u.grade,
              u.track, u.current_level, u.level_b, sp.opc_label, sp.opc_label_secondary,
              sp.six_dim_scores, sp.total_earnings, sp.tasks_completed, sp.graduated_at,
              sb.balance
       FROM users u
       LEFT JOIN users u ON u.id = u.id
       LEFT JOIN student_balances sb ON sb.user_id = u.id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [userId]
    );
    if (!profile) throw new AppError(404, '用户不存在', 'USER_NOT_FOUND');
    res.json({ success: true, data: profile });
  } catch (err: any) { next(err); }
}

// POST /student/profile
export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { nickname, avatarUrl, university, city, major, grade } = req.body;
    await query(
      `UPDATE users SET
        nickname = COALESCE($1, nickname),
        avatar_url = COALESCE($2, avatar_url),
        university = COALESCE($3, university),
        city = COALESCE($4, city),
        major = COALESCE($5, major),
        grade = COALESCE($6, grade)
       WHERE id = $7`,
      [nickname, avatarUrl, university, city, major, grade, userId]
    );
    res.json({ success: true, message: '信息已更新' });
  } catch (err: any) { next(err); }
}

// GET /student/test/questions
export async function getTestQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const questions = await query(
      `SELECT question_num, dimension, question_text, input_type, options, max_select
       FROM test_questions WHERE is_active = TRUE ORDER BY question_num ASC`
    );
    res.json({ success: true, data: questions });
  } catch (err: any) { next(err); }
}

// POST /student/test/submit
export async function submitTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      throw new AppError(400, '答案数据格式不正确', 'INVALID_ANSWERS');
    }

    // 检查测试间隔 (30天限制)
    const lastTest = await queryOne<{ created_at: Date }>(
      `SELECT created_at FROM test_results
       WHERE student_id = $1 AND is_current = TRUE ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    if (lastTest) {
      const daysSince = (Date.now() - new Date(lastTest.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) {
        throw new AppError(400, `距上次测试不足30天，还需等待 ${Math.ceil(30 - daysSince)} 天`, 'TEST_COOLDOWN');
      }
    }

    // 调用 Python AI 服务 AI-01
    let aiResult;
    try {
      const aiResponse = await axios.post(
        `${config.ai.serviceUrl}/ai/analyze-test`,
        { user_id: userId, answers },
        { timeout: config.ai.timeout }
      );
      aiResult = aiResponse.data;
    } catch (aiErr) {
      logger.error('AI-01 test analysis failed', { userId, error: (aiErr as Error).message });
      // 降级: 使用基础评分逻辑
      aiResult = buildFallbackAnalysis(answers);
    }

    const attemptCount = lastTest ? 2 : 1;

    await withTransaction(async (client) => {
      // 旧记录标记为非当前
      await client.query(
        'UPDATE test_results SET is_current = FALSE WHERE student_id = $1',
        [userId]
      );

      // 插入新测试结果
      await client.query(
        `INSERT INTO test_results
          (user_id, attempt_number, answers_json, d1_score, d2_score, d3_score, d4_score, d5_score,
           opc_label, opc_label_secondary, recommended_track, recommended_level,
           share_card_caption, share_card_data, ai_raw_response)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          userId, attemptCount, JSON.stringify(answers),
          aiResult.d1_score, aiResult.d2_score, aiResult.d3_score,
          aiResult.d4_score, aiResult.d5_score,
          aiResult.opc_label, aiResult.opc_label_secondary,
          aiResult.recommended_track, aiResult.recommended_level,
          aiResult.share_card_caption, JSON.stringify(aiResult.share_card_data),
          aiResult.raw_response,
        ]
      );

      // 更新学生档案的 OPC 标签
      await client.query(
        `UPDATE student_capabilities SET
          opc_label = $1, opc_label_secondary = $2,
          track = COALESCE($3::track_type, track),
          updated_at = NOW()
         WHERE student_id = $4`,
        [aiResult.opc_label, aiResult.opc_label_secondary, aiResult.recommended_track, userId]
      );

      // 更新 Onboarding 状态: J2 完成
      await client.query(
        `UPDATE onboarding_status
         SET j2_completed_at = NOW(), completed_steps = completed_steps || '["J2_test_done"]'::jsonb,
             current_step = 'J3_opc_label_shared', updated_at = NOW()
         WHERE student_id = $1 AND j2_completed_at IS NULL`,
        [userId]
      );

      // 记录成长时间线
      await client.query(
        `INSERT INTO growth_timeline (user_id, event_type, event_title, event_desc, event_data)
         VALUES ($1, 'task_completed', '完成OPC测试', $2, $3::jsonb)`,
        [userId,
         `你的OPC人格标签是「${aiResult.opc_label}」`,
         JSON.stringify({ opc_label: aiResult.opc_label, track: aiResult.recommended_track })]
      );
    });

    res.json({
      success: true,
      data: {
        opcLabel: aiResult.opc_label,
        opcLabelSecondary: aiResult.opc_label_secondary,
        scores: {
          d1: aiResult.d1_score, d2: aiResult.d2_score, d3: aiResult.d3_score,
          d4: aiResult.d4_score, d5: aiResult.d5_score,
        },
        recommendedTrack: aiResult.recommended_track,
        recommendedLevel: aiResult.recommended_level,
        shareCard: aiResult.share_card_data,
        nextStep: 'first_task', // 引导到首单
      },
    });
  } catch (err: any) { next(err); }
}

// GET /student/onboarding
export async function getOnboardingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const status = await queryOne(
      'SELECT * FROM onboarding_status WHERE student_id = $1',
      [userId]
    );
    res.json({ success: true, data: status });
  } catch (err: any) { next(err); }
}

// POST /student/onboarding/:step/complete
export async function completeOnboardingStep(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { step } = req.params;

    const validSteps = ['J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7', 'J8'];
    if (!validSteps.includes(step)) {
      throw new AppError(400, '无效的步骤', 'INVALID_STEP');
    }

    const col = `${step.toLowerCase()}_completed_at`;
    await query(
      `UPDATE onboarding_status
       SET ${col} = NOW(), updated_at = NOW()
       WHERE student_id = $1 AND ${col} IS NULL`,
      [userId]
    );

    res.json({ success: true, message: `${step} 已完成` });
  } catch (err: any) { next(err); }
}

// GET /student/emotion-signals
export async function getEmotionSignals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const signals = await query(
      `SELECT id, signal_type as "signalType", signal_value as "signalValue",
              trigger_event as "triggerEvent", detected_at as "detectedAt"
       FROM emotion_signals
       WHERE student_id = $1
       ORDER BY detected_at DESC
       LIMIT 5`,
      [userId]
    );
    res.json({ success: true, data: signals });
  } catch (err: any) { next(err); }
}

// 降级分析逻辑 (AI服务不可用时)
function buildFallbackAnalysis(answers: Record<string, unknown>) {
  return {
    d1_score: 60, d2_score: 60, d3_score: 50, d4_score: 60, d5_score: 55,
    opc_label: '探索中的AI实践者',
    opc_label_secondary: null,
    recommended_track: 'A',
    recommended_level: 0,
    share_card_caption: '我正在开启AI变现之旅',
    share_card_data: { label: '探索中的AI实践者', abilities: ['好奇心', '执行力', '学习力'] },
    raw_response: null,
  };
}

// ============================================================
// GET /student/balance
// 获取学生余额信息
// ============================================================
export async function getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const balance = await queryOne<{
      balance: number;
      frozen_balance: number;
      total_earnings: number;
      total_withdrawals: number;
    }>(
      `SELECT balance, frozen_balance, total_earnings, total_withdrawals
       FROM student_balances
       WHERE student_id = $1`,
      [userId]
    );

    if (!balance) {
      // 如果余额记录不存在，创建一个
      await query(
        `INSERT INTO student_balances (user_id, balance, frozen_balance, total_earnings, total_withdrawals)
         VALUES ($1, 0, 0, 0, 0)`,
        [userId]
      );

      res.json({
        success: true,
        data: {
          balance: 0,
          frozenBalance: 0,
          totalEarnings: 0,
          totalWithdrawals: 0,
          availableBalance: 0,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        balance: balance.balance,
        frozenBalance: balance.frozen_balance,
        totalEarnings: balance.total_earnings,
        totalWithdrawals: balance.total_withdrawals,
        availableBalance: balance.balance - balance.frozen_balance,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

// ============================================================
// GET /student/level
// 获取学生等级信息
// ============================================================
export async function getLevel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const profile = await queryOne<{
      current_level: number;
      level_b: number;
      track: string;
      tasks_completed: number;
      six_dim_scores: Record<string, number>;
      opc_label: string;
    }>(
      `SELECT current_level, level_b, track, tasks_completed, six_dim_scores, opc_label
       FROM student_capabilities
       WHERE student_id = $1`,
      [userId]
    );

    if (!profile) {
      throw new AppError(404, '学生画像不存在', 'PROFILE_NOT_FOUND');
    }

    // 计算升级进度
    const nextLevelRequirements = calculateNextLevelRequirements(profile.current_level, profile.level_b);

    res.json({
      success: true,
      data: {
        currentLevel: {
          a: profile.current_level,
          b: profile.level_b,
          label: `${profile.track}${profile.current_level}.${profile.level_b}`,
        },
        track: profile.track,
        taskCount: profile.tasks_completed,
        opcLabel: profile.opc_label,
        nextLevelRequirements,
        canUpgrade: profile.tasks_completed >= nextLevelRequirements.requiredTasks,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

// ============================================================
// GET /student/level/check
// 检查是否可以升级
// ============================================================
export async function checkLevelUpgrade(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const profile = await queryOne<{
      current_level: number;
      current_level: number;
      tasks_completed: number;
      six_dim_scores: Record<string, number>;
    }>(
      'SELECT current_level, level_b, tasks_completed, six_dim_scores FROM student_capabilities WHERE student_id = $1',
      [userId]
    );

    if (!profile) {
      throw new AppError(404, '学生画像不存在', 'PROFILE_NOT_FOUND');
    }

    const requirements = calculateNextLevelRequirements(profile.current_level, profile.level_b);
    const canUpgrade = profile.tasks_completed >= requirements.requiredTasks;

    res.json({
      success: true,
      data: {
        canUpgrade,
        currentTaskCount: profile.tasks_completed,
        requiredTasks: requirements.requiredTasks,
        nextLevel: requirements.nextLevel,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

// ============================================================
// GET /student/level/next
// 获取下一等级信息
// ============================================================
export async function getNextLevel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const profile = await queryOne<{
      current_level: number;
      current_level: number;
      track: string;
      tasks_completed: number;
    }>(
      'SELECT current_level, level_b, track, tasks_completed FROM student_capabilities WHERE student_id = $1',
      [userId]
    );

    if (!profile) {
      throw new AppError(404, '学生画像不存在', 'PROFILE_NOT_FOUND');
    }

    const requirements = calculateNextLevelRequirements(profile.current_level, profile.level_b);

    res.json({
      success: true,
      data: {
        currentLevel: { a: profile.current_level, b: profile.level_b },
        nextLevel: requirements.nextLevel,
        requirements: {
          tasks: requirements.requiredTasks,
          currentProgress: profile.tasks_completed,
          progressPercentage: Math.min(100, (profile.tasks_completed / requirements.requiredTasks) * 100),
        },
        benefits: requirements.benefits,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

// ============================================================
// GET /student/test/result
// 获取学生测试结果（兼容旧版OPC测试）
// ============================================================
export async function getTestResult(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    // 查询学生画像中的测试结果
    const profile = await queryOne<{
      six_dim_scores: Record<string, number>;
      opc_label: string;
      opc_label_secondary: string;
      track: string;
      current_level: number;
      current_level: number;
    }>(
      `SELECT six_dim_scores, opc_label, opc_label_secondary, track, current_level, level_b
       FROM student_capabilities
       WHERE student_id = $1`,
      [userId]
    );

    if (!profile) {
      throw new AppError(404, '未找到测试结果', 'TEST_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        sixDimScores: profile.six_dim_scores,
        opcLabel: profile.opc_label,
        opcLabelSecondary: profile.opc_label_secondary,
        recommendedTrack: profile.track,
        currentLevel: { a: profile.current_level, b: profile.level_b },
      },
    });
  } catch (err: any) {
    next(err);
  }
}

// ============================================================
// 辅助函数：计算下一等级要求
// ============================================================
function calculateNextLevelRequirements(levelA: number, levelB: number): {
  nextLevel: { a: number; b: number };
  requiredTasks: number;
  benefits: string[];
} {
  // 简化版升级逻辑
  let nextA = levelA;
  let nextB = levelB + 1;

  if (nextB > 3) {
    nextA += 1;
    nextB = 0;
  }

  const requiredTasks = levelA * 5 + levelB * 2 + 3;

  const benefits = [
    '解锁更高难度任务',
    '提升任务匹配优先级',
    '获得更高的任务报酬',
  ];

  return {
    nextLevel: { a: nextA, b: nextB },
    requiredTasks,
    benefits,
  };
}
