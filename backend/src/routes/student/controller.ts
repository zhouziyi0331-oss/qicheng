import { Request, Response, NextFunction } from 'express';
import pool from '../../config/database';

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;
    const result = await pool.query(
      'SELECT * FROM student_profiles WHERE student_id = $1',
      [studentId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Profile not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;
    const updates = req.body;

    const result = await pool.query(
      `UPDATE student_profiles
       SET bio = COALESCE($1, bio),
           avatar_url = COALESCE($2, avatar_url),
           updated_at = NOW()
       WHERE student_id = $3
       RETURNING *`,
      [updates.bio, updates.avatarUrl, studentId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function getTestQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const questions = [
      { id: 1, question: 'Sample question 1?', options: ['A', 'B', 'C', 'D'] },
      { id: 2, question: 'Sample question 2?', options: ['A', 'B', 'C', 'D'] }
    ];

    res.json({ success: true, data: questions });
  } catch (err) {
    next(err);
  }
}

export async function submitTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;
    const { answers } = req.body;

    const score = 85;

    await pool.query(
      'UPDATE student_profiles SET test_completed = TRUE, test_score = $1 WHERE student_id = $2',
      [score, studentId]
    );

    res.json({ success: true, data: { score } });
  } catch (err) {
    next(err);
  }
}

export async function getTestResult(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;
    const result = await pool.query(
      'SELECT test_score FROM student_profiles WHERE student_id = $1',
      [studentId]
    );

    res.json({ success: true, data: { score: result.rows[0]?.test_score || 0 } });
  } catch (err) {
    next(err);
  }
}

export async function getOnboardingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;
    const result = await pool.query(
      'SELECT onboarding_step FROM student_profiles WHERE student_id = $1',
      [studentId]
    );

    res.json({
      success: true,
      data: {
        currentStep: result.rows[0]?.onboarding_step || 0,
        completed: result.rows[0]?.onboarding_step >= 5
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function completeOnboardingStep(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;
    const { step } = req.params;

    await pool.query(
      'UPDATE student_profiles SET onboarding_step = $1 WHERE student_id = $2',
      [parseInt(step), studentId]
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getEmotionSignals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;

    const result = await pool.query(
      `SELECT emotion_type, intensity, detected_at, context
       FROM emotion_signals
       WHERE student_id = $1
       ORDER BY detected_at DESC
       LIMIT 10`,
      [studentId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;

    const result = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as available,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total
       FROM task_payments
       WHERE student_id = $1`,
      [studentId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function getLevel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;

    const result = await pool.query(
      'SELECT level, experience_points FROM student_profiles WHERE student_id = $1',
      [studentId]
    );

    const level = result.rows[0]?.level || 1;
    const experiencePoints = result.rows[0]?.experience_points || 0;
    const nextLevelXp = level * 1000;

    res.json({
      success: true,
      data: {
        level,
        experiencePoints,
        nextLevelXp,
        progress: Math.floor((experiencePoints / nextLevelXp) * 100)
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function checkLevelUpgrade(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;

    const result = await pool.query(
      'SELECT level, experience_points FROM student_profiles WHERE student_id = $1',
      [studentId]
    );

    const level = result.rows[0]?.level || 1;
    const experiencePoints = result.rows[0]?.experience_points || 0;
    const nextLevelXp = level * 1000;

    const canUpgrade = experiencePoints >= nextLevelXp;

    if (canUpgrade) {
      await pool.query(
        'UPDATE student_profiles SET level = level + 1, experience_points = $1 WHERE student_id = $2',
        [experiencePoints - nextLevelXp, studentId]
      );
    }

    res.json({ success: true, data: { canUpgrade, newLevel: canUpgrade ? level + 1 : level } });
  } catch (err) {
    next(err);
  }
}

export async function getNextLevel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;

    const result = await pool.query(
      'SELECT level FROM student_profiles WHERE student_id = $1',
      [studentId]
    );

    const currentLevel = result.rows[0]?.level || 1;
    const nextLevel = currentLevel + 1;

    res.json({
      success: true,
      data: {
        currentLevel,
        nextLevel,
        benefits: [`解锁更高薪项目`, `提升接单优先级`, `获得专属徽章`]
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function isFirstOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;

    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM task_assignments
       WHERE student_id = $1 AND status IN ('in_progress', 'completed')`,
      [studentId]
    );

    const isFirstOrder = parseInt(result.rows[0]?.count || '0') === 0;

    res.json({ success: true, data: { isFirstOrder } });
  } catch (err) {
    next(err);
  }
}

export async function getPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;
    const { orderId } = req.params;

    const orderResult = await pool.query(
      `SELECT total_amount, status
       FROM task_assignments
       WHERE id = $1 AND student_id = $2`,
      [orderId, studentId]
    );

    if (orderResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const totalAmount = parseFloat(orderResult.rows[0].total_amount);

    const milestonesResult = await pool.query(
      `SELECT stage, percentage, status, completed_at
       FROM task_milestones
       WHERE task_assignment_id = $1
       ORDER BY stage`,
      [orderId]
    );

    let milestones;
    if (milestonesResult.rows.length === 0) {
      milestones = [
        { stage: 'draft', amount: totalAmount * 0.2, status: 'pending', unlockedAt: null },
        { stage: 'mid', amount: totalAmount * 0.3, status: 'pending', unlockedAt: null },
        { stage: 'final', amount: totalAmount * 0.5, status: 'pending', unlockedAt: null }
      ];
    } else {
      milestones = milestonesResult.rows.map(row => ({
        stage: row.stage,
        amount: totalAmount * (row.percentage / 100),
        status: row.status === 'completed' ? 'unlocked' : 'pending',
        unlockedAt: row.completed_at
      }));
    }

    const unlocked = milestones
      .filter(m => m.status === 'unlocked')
      .reduce((sum, m) => sum + m.amount, 0);

    const pending = totalAmount - unlocked;

    res.json({
      success: true,
      data: {
        totalAmount,
        unlocked,
        pending,
        milestones
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getAvailableSkipTests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;

    const profileResult = await pool.query(
      'SELECT level FROM student_profiles WHERE student_id = $1',
      [studentId]
    );

    const currentLevel = profileResult.rows[0]?.level || 1;

    const attemptsResult = await pool.query(
      `SELECT target_level, attempt_count, tasks_completed_since_failure, can_retry_after
       FROM level_skip_attempts
       WHERE student_id = $1`,
      [studentId]
    );

    const attempts = new Map(attemptsResult.rows.map(row => [row.target_level, row]));

    const availableTests = [];
    for (let targetLevel = currentLevel + 1; targetLevel <= Math.min(currentLevel + 2, 5); targetLevel++) {
      const attempt = attempts.get(targetLevel);
      const canApply = !attempt || attempt.tasks_completed_since_failure >= attempt.can_retry_after;

      availableTests.push({
        targetLevel,
        canApply,
        reason: canApply ? null : `需完成 ${attempt.can_retry_after - attempt.tasks_completed_since_failure} 个任务后重试`
      });
    }

    res.json({
      success: true,
      data: {
        currentLevel,
        availableTests
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function applySkipTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;
    const { targetLevel } = req.body;

    const questions = generateSkipTestQuestions(targetLevel);

    const result = await pool.query(
      `INSERT INTO level_skip_tests (student_id, target_level, test_type, questions, taken_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [studentId, targetLevel, 'skip', JSON.stringify(questions)]
    );

    const testId = result.rows[0].id;

    res.json({
      success: true,
      data: {
        testId,
        questions: questions.map(q => ({ id: q.id, question: q.question, options: q.options }))
      }
    });
  } catch (err) {
    next(err);
  }
}

function generateSkipTestQuestions(targetLevel: number) {
  if (targetLevel === 2) {
    return [
      { id: 1, question: '客户要求"科技感"，以下哪个不是合适的设计元素？', options: ['渐变色', '扁平化图标', '卡通贴纸', '极简排版'], answer: 2 },
      { id: 2, question: '设计稿交付前，最重要的检查项是？', options: ['颜色好看', '字体统一', '图层命名规范', '添加更多装饰'], answer: 2 },
      { id: 3, question: '客户说"再改改"，你应该？', options: ['按自己想法改', '问具体哪里不满意', '全部重做', '不理会'], answer: 1 },
      { id: 4, question: 'Figma中，哪个功能可以快速复用设计元素？', options: ['组件(Component)', '图层锁定', '颜色吸管', '导出设置'], answer: 0 },
      { id: 5, question: '客户要求"高端大气"，你会优先考虑？', options: ['增加动画', '使用大面积留白', '添加更多图片', '使用鲜艳颜色'], answer: 1 }
    ];
  } else if (targetLevel === 3) {
    return [
      { id: 1, question: '设计系统(Design System)的核心价值是？', options: ['好看', '统一性和可复用性', '文件更大', '颜色更多'], answer: 1 },
      { id: 2, question: '响应式设计中，移动端优先(Mobile First)的优势是？', options: ['开发更快', '强制聚焦核心功能', '不需要适配', '文件更小'], answer: 1 },
      { id: 3, question: '客户反馈"用户找不到按钮"，你应该优先检查？', options: ['按钮颜色', '视觉层级和对比度', '按钮大小', '按钮位置'], answer: 1 },
      { id: 4, question: '以下哪个不是用户体验(UX)设计的核心原则？', options: ['易用性', '一致性', '美观性', '可访问性'], answer: 2 },
      { id: 5, question: '设计交付时，开发最需要的文档是？', options: ['设计理念说明', '标注尺寸和颜色值', '设计过程稿', '竞品分析'], answer: 1 }
    ];
  }

  return [];
}

export async function submitSkipTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;
    const { testId, answers } = req.body;

    const testResult = await pool.query(
      'SELECT target_level, questions FROM level_skip_tests WHERE id = $1 AND student_id = $2',
      [testId, studentId]
    );

    if (testResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }

    const targetLevel = testResult.rows[0].target_level;
    const questions = testResult.rows[0].questions;

    let correctCount = 0;
    questions.forEach((q: any, index: number) => {
      if (answers[index] === q.answer) {
        correctCount++;
      }
    });

    const score = Math.floor((correctCount / questions.length) * 100);
    const passed = score >= 80;

    await pool.query(
      `UPDATE level_skip_tests
       SET answers = $1, score = $2, passed = $3, result_at = NOW()
       WHERE id = $4`,
      [JSON.stringify(answers), score, passed, testId]
    );

    if (passed) {
      await pool.query(
        'UPDATE student_profiles SET level = $1 WHERE student_id = $2',
        [targetLevel, studentId]
      );
    } else {
      await pool.query(
        `INSERT INTO level_skip_attempts (student_id, target_level, attempt_count, last_failed_at, tasks_completed_since_failure)
         VALUES ($1, $2, 1, NOW(), 0)
         ON CONFLICT (student_id, target_level)
         DO UPDATE SET
           attempt_count = level_skip_attempts.attempt_count + 1,
           last_failed_at = NOW(),
           tasks_completed_since_failure = 0`,
        [studentId, targetLevel]
      );
    }

    res.json({
      success: true,
      data: {
        testId,
        score,
        passed,
        levelUpTo: passed ? targetLevel : null,
        nextAttemptAfter: passed ? null : 2
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getSkipTestResult(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;
    const { testId } = req.params;

    const result = await pool.query(
      `SELECT target_level, score, passed, result_at
       FROM level_skip_tests
       WHERE id = $1 AND student_id = $2`,
      [testId, studentId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Test result not found' });
      return;
    }

    const row = result.rows[0];

    res.json({
      success: true,
      data: {
        targetLevel: row.target_level,
        score: row.score,
        passed: row.passed,
        levelUpTo: row.passed ? row.target_level : null,
        nextAttemptAfter: row.passed ? null : 2,
        completedAt: row.result_at
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getGrowthComparison(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;

    const countResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM task_assignments
       WHERE student_id = $1 AND status = 'completed'`,
      [studentId]
    );

    const completedCount = parseInt(countResult.rows[0].count);

    const shouldShow = completedCount === 5 || completedCount === 10;

    if (!shouldShow) {
      res.json({
        success: true,
        data: { shouldShow: false }
      });
      return;
    }

    const firstOrderResult = await pool.query(
      `SELECT
        EXTRACT(DAY FROM (completed_at - started_at)) as days,
        stuck_count,
        ai_help_count,
        client_rating
       FROM task_assignments
       WHERE student_id = $1 AND status = 'completed'
       ORDER BY started_at ASC
       LIMIT 1`,
      [studentId]
    );

    const currentOrderResult = await pool.query(
      `SELECT
        EXTRACT(DAY FROM (completed_at - started_at)) as days,
        stuck_count,
        ai_help_count,
        client_rating
       FROM task_assignments
       WHERE student_id = $1 AND status = 'completed'
       ORDER BY completed_at DESC
       LIMIT 1`,
      [studentId]
    );

    const firstOrder = firstOrderResult.rows[0] || { days: 7, stuck_count: 3, ai_help_count: 9, client_rating: 72 };
    const currentOrder = currentOrderResult.rows[0] || { days: 2, stuck_count: 0, ai_help_count: 2, client_rating: 92 };

    const speedImprovement = Math.floor(((firstOrder.days - currentOrder.days) / firstOrder.days) * 100);
    const independenceImprovement = firstOrder.stuck_count > 0
      ? Math.floor(((firstOrder.stuck_count - currentOrder.stuck_count) / firstOrder.stuck_count) * 100)
      : 0;
    const autonomyImprovement = Math.floor(((firstOrder.ai_help_count - currentOrder.ai_help_count) / firstOrder.ai_help_count) * 100);
    const qualityImprovement = Math.floor(((currentOrder.client_rating - firstOrder.client_rating) / firstOrder.client_rating) * 100);

    res.json({
      success: true,
      data: {
        shouldShow: true,
        milestone: completedCount,
        comparison: {
          firstOrder: {
            days: firstOrder.days,
            stuckCount: firstOrder.stuck_count,
            aiHelpCount: firstOrder.ai_help_count,
            rating: firstOrder.client_rating
          },
          currentOrder: {
            days: currentOrder.days,
            stuckCount: currentOrder.stuck_count,
            aiHelpCount: currentOrder.ai_help_count,
            rating: currentOrder.client_rating
          },
          improvements: {
            speed: speedImprovement,
            independence: independenceImprovement,
            autonomy: autonomyImprovement,
            quality: qualityImprovement
          }
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getAssetDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;

    const skillsResult = await pool.query(
      `SELECT skill_name, skill_level, hourly_rate
       FROM student_skills
       WHERE student_id = $1
       ORDER BY skill_level DESC`,
      [studentId]
    );

    const skills = skillsResult.rows.map(row => ({
      name: row.skill_name,
      level: row.skill_level,
      hourlyRate: parseFloat(row.hourly_rate)
    }));

    const avgHourlyRate = skills.length > 0
      ? skills.reduce((sum, s) => sum + s.hourlyRate, 0) / skills.length
      : 0;
    const marketValue = Math.floor(avgHourlyRate * 40);

    const experiencesResult = await pool.query(
      `SELECT domain, case_count, avg_rating
       FROM student_experiences
       WHERE student_id = $1
       ORDER BY case_count DESC`,
      [studentId]
    );

    const experiences = experiencesResult.rows.map(row => ({
      domain: row.domain,
      caseCount: row.case_count,
      rating: parseFloat(row.avg_rating)
    }));

    const incomeResult = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM completed_at) = EXTRACT(MONTH FROM NOW()) THEN amount ELSE 0 END), 0) as this_month,
        COALESCE(SUM(amount), 0) as total,
        COALESCE(AVG(amount), 0) as avg_order_price
       FROM task_payments
       WHERE student_id = $1 AND status = 'completed'`,
      [studentId]
    );

    const income = {
      thisMonth: parseFloat(incomeResult.rows[0].this_month),
      total: parseFloat(incomeResult.rows[0].total),
      avgOrderPrice: Math.floor(parseFloat(incomeResult.rows[0].avg_order_price))
    };

    const percentileResult = await pool.query(
      `WITH student_value AS (
        SELECT student_id, AVG(hourly_rate) * 40 as value
        FROM student_skills
        GROUP BY student_id
      )
      SELECT
        COUNT(CASE WHEN value < $1 THEN 1 END) * 100.0 / COUNT(*) as percentile
      FROM student_value`,
      [marketValue]
    );

    const marketPercentile = Math.floor(parseFloat(percentileResult.rows[0]?.percentile || 50));

    res.json({
      success: true,
      data: {
        marketValue,
        valueChange: 0,
        skills,
        experiences,
        income,
        marketPercentile
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function generateIdentityCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;

    const profileResult = await pool.query(
      `SELECT u.name, sp.level, sp.personality_label
       FROM users u
       JOIN student_profiles sp ON u.id = sp.student_id
       WHERE u.id = $1`,
      [studentId]
    );

    if (profileResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Profile not found' });
      return;
    }

    const profile = profileResult.rows[0];

    const statsResult = await pool.query(
      `SELECT
        COUNT(*) as completed_projects,
        COALESCE(SUM(amount), 0) as total_income,
        COALESCE(AVG(client_rating), 0) as avg_rating
       FROM task_assignments ta
       LEFT JOIN task_payments tp ON ta.id = tp.task_assignment_id
       WHERE ta.student_id = $1 AND ta.status = 'completed'`,
      [studentId]
    );

    const stats = statsResult.rows[0];
    const completedProjects = parseInt(stats.completed_projects);
    const totalIncome = Math.floor(parseFloat(stats.total_income));
    const satisfactionRate = Math.floor(parseFloat(stats.avg_rating) / 5 * 100);

    const cardData = {
      name: profile.name,
      level: profile.level,
      personalityLabel: profile.personality_label || '创作者',
      completedProjects,
      totalIncome,
      satisfactionRate
    };

    const cardImageUrl = `https://oss.qicheng.ai/cards/${studentId}_${Date.now()}.png`;
    const shareUrl = `https://qicheng.ai/u/${studentId}`;
    const shareText = `我在启程完成了${completedProjects}个项目，成为了认证的「${cardData.personalityLabel}」Lv.${cardData.level}`;

    res.json({
      success: true,
      data: {
        cardImageUrl,
        shareUrl,
        shareText,
        cardData
      }
    });
  } catch (err) {
    next(err);
  }
}
