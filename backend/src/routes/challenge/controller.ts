import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { query, queryOne, withTransaction } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../utils/logger';
import { AuthRequest } from '../../middleware/auth';

// ============================================================
// POST /challenge/start - 开始跳级挑战测试
// ============================================================
export async function startChallenge(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const userId = req.user!.userId;
    const { targetLevel } = req.body;

    // 1. 获取学生当前等级
    const profile = await queryOne<{ track: string; current_level: number; current_level: number }>(
      'SELECT track, current_level, level_b FROM users u LEFT JOIN student_capabilities sc ON u.id = sc.student_id WHERE u.id = $1',
      [userId]
    );

    if (!profile) {
      throw new AppError(404, '学生档案不存在', 'PROFILE_NOT_FOUND');
    }

    const currentLevel = profile.track === 'A' ? profile.current_level : profile.level_b;

    // 2. 验证目标等级
    if (targetLevel <= currentLevel) {
      throw new AppError(400, '目标等级必须高于当前等级', 'INVALID_TARGET_LEVEL');
    }

    if (targetLevel > 5) {
      throw new AppError(400, '目标等级不能超过5级', 'INVALID_TARGET_LEVEL');
    }

    // 3. 检查是否有未完成的挑战
    const pendingChallenge = await queryOne(
      `SELECT id FROM level_challenge_tests
       WHERE student_id = $1 AND is_passed IS NULL AND deleted_at IS NULL`,
      [userId]
    );

    if (pendingChallenge) {
      throw new AppError(400, '你有一个正在进行的挑战测试，请先完成', 'CHALLENGE_IN_PROGRESS');
    }

    // 4. 检查是否在冷却期（失败后7天内不能重试）
    const recentFailed = await queryOne<{ retry_allowed_at: Date }>(
      `SELECT retry_allowed_at FROM level_challenge_tests
       WHERE student_id = $1 AND is_passed = FALSE AND retry_allowed_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (recentFailed) {
      throw new AppError(400, `挑战失败后需要等待7天才能重试，请在 ${recentFailed.retry_allowed_at} 后再试`, 'CHALLENGE_COOLDOWN');
    }

    // 5. 生成测试题目（调用AI生成10道题）
    const questions = await generateChallengeQuestions(currentLevel, targetLevel, profile.track);

    // 6. 创建挑战记录
    const challengeId = await queryOne<{ id: string }>(
      `INSERT INTO level_challenge_tests
       (user_id, current_level, target_level, track, questions_json, answers_json)
       VALUES ($1, $2, $3, $4, $5, '{}')
       RETURNING id`,
      [userId, currentLevel, targetLevel, profile.track, JSON.stringify(questions)]
    );

    logger.info('Challenge test started', { userId, currentLevel, targetLevel });

    res.json({
      success: true,
      data: {
        challengeId: challengeId!.id,
        currentLevel,
        targetLevel,
        questions,
        timeLimit: 30, // 30分钟
      },
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// POST /challenge/submit - 提交跳级挑战答案
// ============================================================
export async function submitChallenge(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const userId = req.user!.userId;
    const { challengeId, answers } = req.body;

    // 1. 获取挑战记录
    const challenge = await queryOne<{
      id: string;
      user_id: string;
      current_level: number;
      target_level: number;
      track: string;
      questions_json: any;
      is_passed: boolean | null;
    }>(
      `SELECT * FROM level_challenge_tests
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [challengeId, userId]
    );

    if (!challenge) {
      throw new AppError(404, '挑战记录不存在', 'CHALLENGE_NOT_FOUND');
    }

    if (challenge.is_passed !== null) {
      throw new AppError(400, '该挑战已经完成', 'CHALLENGE_COMPLETED');
    }

    // 2. 调用AI评分
    const aiResult = await evaluateChallengeAnswers(
      challenge.questions_json,
      answers,
      challenge.current_level,
      challenge.target_level
    );

    const isPassed = aiResult.score >= 80; // 默认80分通过

    // 3. 更新挑战记录
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE level_challenge_tests
         SET answers_json = $1, ai_score = $2, ai_feedback = $3, is_passed = $4,
             new_level = $5, failed_reason = $6, retry_allowed_at = $7, completed_at = NOW()
         WHERE id = $8`,
        [
          JSON.stringify(answers),
          aiResult.score,
          aiResult.feedback,
          isPassed,
          isPassed ? challenge.target_level : null,
          isPassed ? null : aiResult.failedReason,
          isPassed ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
          challengeId,
        ]
      );

      // 4. 如果通过，更新学生等级
      if (isPassed) {
        const levelField = challenge.track === 'A' ? 'level_a' : 'level_b';
        await client.query(
          `UPDATE student_capabilities SET ${levelField} = $1, updated_at = NOW()
           WHERE student_id = $2`,
          [challenge.target_level, userId]
        );

        // 5. 记录成长时间线
        await client.query(
          `INSERT INTO growth_timeline
           (user_id, event_type, event_title, event_desc, level_before, level_after)
           VALUES ($1, 'level_up', '跳级成功', $2, $3, $4)`,
          [
            userId,
            `通过跳级挑战，从 Lv.${challenge.current_level} 跃升至 Lv.${challenge.target_level}`,
            challenge.current_level,
            challenge.target_level,
          ]
        );

        // 6. 记录六维能力变化（跳级会提升所有维度）
        const profile = await client.query(
          'SELECT six_dim_scores FROM users u LEFT JOIN student_capabilities sc ON u.id = sc.student_id WHERE u.id = $1',
          [userId]
        );
        const oldScores = profile.rows[0].six_dim_scores;
        const newScores = {
          d1: Math.min(100, oldScores.d1 + 10),
          d2: Math.min(100, oldScores.d2 + 10),
          d3: Math.min(100, oldScores.d3 + 10),
          d4: Math.min(100, oldScores.d4 + 10),
          d5: Math.min(100, oldScores.d5 + 10),
          d6: Math.min(100, oldScores.d6 + 10),
        };

        await client.query(
          `INSERT INTO six_dim_history
           (user_id, d1_before, d1_after, d2_before, d2_after, d3_before, d3_after,
            d4_before, d4_after, d5_before, d5_after, d6_before, d6_after,
            change_reason, change_detail)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'test_passed', $14)`,
          [
            userId,
            oldScores.d1, newScores.d1,
            oldScores.d2, newScores.d2,
            oldScores.d3, newScores.d3,
            oldScores.d4, newScores.d4,
            oldScores.d5, newScores.d5,
            oldScores.d6, newScores.d6,
            `跳级挑战通过，等级从 ${challenge.current_level} 提升至 ${challenge.target_level}`,
          ]
        );

        await client.query(
          'UPDATE student_capabilities SET six_dim_scores = $1 WHERE student_id = $2',
          [JSON.stringify(newScores), userId]
        );
      }
    });

    logger.info('Challenge test completed', { userId, challengeId, isPassed, score: aiResult.score });

    res.json({
      success: true,
      data: {
        isPassed,
        score: aiResult.score,
        feedback: aiResult.feedback,
        newLevel: isPassed ? challenge.target_level : challenge.current_level,
        retryAllowedAt: isPassed ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// GET /challenge/history - 获取挑战历史
// ============================================================
export async function getChallengeHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const challenges = await query(
      `SELECT id, current_level, target_level, track, ai_score, is_passed,
              created_at, completed_at, retry_allowed_at
       FROM level_challenge_tests
       WHERE student_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: challenges,
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// 辅助函数：生成挑战题目（调用AI）
// ============================================================
async function generateChallengeQuestions(
  currentLevel: number,
  targetLevel: number,
  track: string
): Promise<any[]> {
  // TODO: 调用AI服务生成10道题目
  // 这里先返回模拟数据
  const questions = [];
  for (let i = 1; i <= 10; i++) {
    questions.push({
      id: i,
      type: i <= 5 ? 'multiple_choice' : 'open_ended',
      question: `Level ${targetLevel} 挑战题 ${i}：请描述你如何完成一个复杂的AI任务...`,
      options: i <= 5 ? ['选项A', '选项B', '选项C', '选项D'] : null,
      points: 10,
    });
  }
  return questions;
}

// ============================================================
// 辅助函数：AI评分
// ============================================================
async function evaluateChallengeAnswers(
  questions: any[],
  answers: any[],
  currentLevel: number,
  targetLevel: number
): Promise<{ score: number; feedback: string; failedReason?: string }> {
  // TODO: 调用AI服务进行评分
  // 这里先返回模拟结果
  const score = Math.floor(Math.random() * 40) + 60; // 60-100分
  const isPassed = score >= 80;

  return {
    score,
    feedback: isPassed
      ? `恭喜你！你的表现非常出色，展现了 Level ${targetLevel} 应有的能力。你在多个维度都有显著提升。`
      : `你的表现还不错，但距离 Level ${targetLevel} 还有一定差距。建议你在以下方面加强练习：1) 任务拆解能力 2) 工具使用熟练度 3) 需求理解深度。`,
    failedReason: isPassed ? undefined : '部分题目回答不够深入，需要更多实践经验',
  };
}
