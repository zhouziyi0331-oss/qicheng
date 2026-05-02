import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, withTransaction } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';
import { config } from '../../../config';
import logger from '../../utils/logger';

// ============================================================
// GET /tasks/recommended
// 指令4: AI-02 定向推送 2-3 个任务
// ============================================================
export async function getRecommendedTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    // 获取学生当前能力档案和情绪状态
    const profile = await queryOne<{
      level_a: number; level_b: number; track: string; opc_label: string;
    }>(
      `SELECT sp.level_a, sp.level_b, sp.track, sp.opc_label
       FROM student_profiles sp WHERE sp.user_id = $1`,
      [userId]
    );
    if (!profile) throw new AppError(404, '请先完成初始测试', 'PROFILE_NOT_FOUND');

    // 获取最新情绪状态
    const emotion = await queryOne<{ signal_type: string }>(
      `SELECT signal_type FROM emotion_signals
       WHERE user_id = $1 AND resolved_at IS NULL
       ORDER BY detected_at DESC LIMIT 1`,
      [userId]
    );

    // 根据情绪状态调整推荐难度
    const emotionState = emotion?.signal_type || 'calm';
    const levelModifier = emotionState === 'frustrated' ? -1 : emotionState === 'excited' ? 1 : 0;
    const targetLevel = Math.max(0, Math.min(5, profile.level_a + levelModifier));

    // 获取已分配过的任务 (避免重复推送)
    const assignedTaskIds = await query<{ task_id: string }>(
      `SELECT task_id FROM task_assignments WHERE student_id = $1`,
      [userId]
    );
    const excludeIds = assignedTaskIds.map(r => r.task_id);

    // 获取候选任务
    logger.info(`Getting candidates: targetLevel=${targetLevel}, excludeIds.length=${excludeIds.length}`);
    let candidates;
    if (excludeIds.length > 0) {
      logger.info('Using query with excludeIds', { targetLevel, excludeIdsCount: excludeIds.length });
      candidates = await query(
        `SELECT t.id, t.title, t.description, t.track, t.level_required,
                t.budget_net, t.estimated_minutes, t.deadline
         FROM tasks t
         WHERE t.status = 'active'
           AND t.level_required <= $1
           AND t.deleted_at IS NULL
           AND t.id != ALL($2::uuid[])
         ORDER BY t.created_at DESC LIMIT 20`,
        [targetLevel, excludeIds]
      );
    } else {
      logger.info('Using query without excludeIds', { targetLevel });
      candidates = await query(
        `SELECT t.id, t.title, t.description, t.track, t.level_required,
                t.budget_net, t.estimated_minutes, t.deadline
         FROM tasks t
         WHERE t.status = 'active'
           AND t.level_required <= $1
           AND t.deleted_at IS NULL
         ORDER BY t.created_at DESC LIMIT 20`,
        [targetLevel]
      );
    }
    logger.info(`Got ${candidates.length} candidates`);

    if (candidates.length === 0) {
      res.json({ success: true, data: [], message: '暂无匹配任务，请稍后查看' });
      return;
    }

    // 调用 AI-02 匹配服务
    let recommended;
    try {
      const aiResponse = await axios.post(
        `${config.ai.serviceUrl}/ai/match-task`,
        {
          student_id: userId,
          student_profile: profile,
          emotion_state: emotionState,
          candidate_tasks: candidates,
          max_results: config.platform.maxAssignees,
        },
        { timeout: config.ai.timeout }
      );
      recommended = aiResponse.data.recommended_tasks;
    } catch {
      // 降级: 取前3个
      recommended = candidates.slice(0, config.platform.maxAssignees).map(t => ({
        ...t, match_reason: '根据你的能力等级推荐'
      }));
    }

    res.json({ success: true, data: recommended });
  } catch (err) { next(err); }
}

// ============================================================
// POST /tasks/:id/accept
// 指令4: 接单成功后 <3秒 推送第一步指令
// ============================================================
export async function acceptTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id: taskId } = req.params;

    // 验证任务存在且状态为 active
    const task = await queryOne<{
      id: string; level_required: number; title: string;
      description: string; acceptance_criteria: string; is_first_task: boolean;
    }>(
      `SELECT id, level_required, title, description, acceptance_criteria, is_first_task
       FROM tasks WHERE id = $1 AND status = 'active' AND deleted_at IS NULL`,
      [taskId]
    );
    if (!task) throw new AppError(404, '任务不存在或已关闭', 'TASK_NOT_FOUND');

    // 检查等级匹配 (硬性规则，不允许超纲接单)
    const profile = await queryOne<{ level_a: number }>(
      'SELECT level_a FROM student_profiles WHERE user_id = $1',
      [userId]
    );
    if (!profile || profile.level_a < task.level_required) {
      throw new AppError(403, `此任务需要 Lv.${task.level_required} 及以上`, 'LEVEL_TOO_LOW');
    }

    // 检查是否已接单
    const existing = await queryOne(
      `SELECT id FROM task_assignments WHERE task_id = $1 AND student_id = $2`,
      [taskId, userId]
    );
    if (existing) throw new AppError(409, '你已接受了此任务', 'ALREADY_ASSIGNED');

    // 检查同时进行中的任务数 (最多3个)
    const activeCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*) FROM task_assignments
       WHERE student_id = $1 AND status IN ('accepted', 'pending')`,
      [userId]
    );
    if (parseInt(activeCount?.count || '0') >= 3) {
      throw new AppError(400, '你最多同时进行3个任务', 'TOO_MANY_ACTIVE_TASKS');
    }

    // 调用 AI-03: 任务拆解 (接单后 <3s 触发)
    let steps: Array<{ title: string; desc: string; tool: string; est_minutes: number }> = [];
    try {
      const aiResponse = await axios.post(
        `${config.ai.serviceUrl}/ai/breakdown-task`,
        {
          task_id: taskId,
          task_description: task.description,
          acceptance_criteria: task.acceptance_criteria,
          student_level: profile.level_a,
        },
        { timeout: 5000 } // 严格5秒超时
      );
      steps = aiResponse.data.steps;
    } catch {
      // 降级步骤
      steps = [
        { title: '理解任务要求', desc: `仔细阅读任务描述：${task.title}`, tool: '无', est_minutes: 5 },
        { title: '开始执行', desc: '使用AI工具完成核心交付内容', tool: 'ChatGPT/Claude', est_minutes: 20 },
        { title: '检查并提交', desc: '检查是否满足验收标准后提交', tool: '无', est_minutes: 5 },
      ];
    }

    await withTransaction(async (client) => {
      // 创建接单记录
      await client.query(
        `INSERT INTO task_assignments (task_id, student_id, status, accepted_at, expires_at)
         VALUES ($1, $2, 'accepted', NOW(), NOW() + interval '7 days')`,
        [taskId, userId]
      );

      // 更新任务状态
      await client.query(
        `UPDATE tasks SET status = 'assigned', assigned_count = assigned_count + 1 WHERE id = $1`,
        [taskId]
      );

      // 创建任务步骤
      for (let i = 0; i < steps.length; i++) {
        await client.query(
          `INSERT INTO task_steps (task_id, student_id, step_num, step_title, step_desc, tool_hint, est_minutes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [taskId, userId, i + 1, steps[i].title, steps[i].desc, steps[i].tool, steps[i].est_minutes]
        );
      }

      // 更新 Onboarding J5
      await client.query(
        `UPDATE onboarding_status
         SET j5_completed_at = NOW(), current_step = 'J6_ai_first_step_shown', updated_at = NOW()
         WHERE user_id = $1 AND j5_completed_at IS NULL`,
        [userId]
      );
    });

    // 发送第一步推送通知
    setImmediate(async () => {
      try {
        await sendFirstStepNotification(userId, taskId, steps[0]);
      } catch (e) {
        logger.error('Failed to send first step notification', { userId, taskId, error: (e as Error).message });
      }
    });

    res.json({
      success: true,
      message: '接单成功！',
      data: {
        taskId,
        firstStep: {
          // v7 核心: 接单瞬间立刻推送第一步，格式: "现在做: [操作]，用[工具]，预计[时间]"
          instruction: `现在做：${steps[0].desc}，用 ${steps[0].tool}，预计 ${steps[0].est_minutes} 分钟。完成后点击「下一步」。`,
          stepNum: 1,
          totalSteps: steps.length,
        },
        allSteps: steps.map((s, i) => ({ stepNum: i + 1, ...s })),
      },
    });
  } catch (err) { next(err); }
}

// ============================================================
// GET /tasks/:id/steps
// 正计时进度: "已完成 X/Y 步"
// ============================================================
export async function getTaskSteps(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id: taskId } = req.params;

    const steps = await query(
      `SELECT step_num, step_title, step_desc, tool_hint, est_minutes, status, completed_at
       FROM task_steps WHERE task_id = $1 AND student_id = $2 ORDER BY step_num ASC`,
      [taskId, userId]
    );

    const completed = steps.filter(s => s.status === 'done').length;
    const total = steps.length;

    res.json({
      success: true,
      data: {
        steps,
        progress: {
          // v7 正计时: "已完成 X/Y 步，还差 Z 步就能收款了"
          completed,
          total,
          message: completed === total
            ? '恭喜！你已完成所有步骤，请提交交付物！'
            : `你已完成 ${completed}/${total} 步，还差 ${total - completed} 步就能收款了`,
        },
      },
    });
  } catch (err) { next(err); }
}

// ============================================================
// POST /tasks/:id/steps/:num/done
// ============================================================
export async function completeStep(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id: taskId, num } = req.params;

    await query(
      `UPDATE task_steps SET status = 'done', completed_at = NOW()
       WHERE task_id = $1 AND student_id = $2 AND step_num = $3 AND status = 'pending'`,
      [taskId, userId, parseInt(num)]
    );

    // 检查下一步
    const nextStep = await queryOne(
      `SELECT step_num, step_title, step_desc, tool_hint, est_minutes
       FROM task_steps
       WHERE task_id = $1 AND student_id = $2 AND status = 'pending'
       ORDER BY step_num ASC LIMIT 1`,
      [taskId, userId]
    );

    res.json({
      success: true,
      data: {
        completedStep: parseInt(num),
        nextStep: nextStep
          ? {
              instruction: `现在做：${nextStep.step_desc}，用 ${nextStep.tool_hint || 'AI工具'}，预计 ${nextStep.est_minutes} 分钟。`,
              stepNum: nextStep.step_num,
            }
          : null,
        isAllDone: !nextStep,
      },
    });
  } catch (err) { next(err); }
}

// ============================================================
// POST /tasks/:id/submit
// AI-04 预审核: 打回使用「成长信号」格式
// ============================================================
export async function submitTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id: taskId } = req.params;
    const { fileUrls, submissionNote } = req.body;

    if (!fileUrls || !Array.isArray(fileUrls) || fileUrls.length === 0) {
      throw new AppError(400, '请上传至少一个交付文件', 'NO_FILES');
    }

    const task = await queryOne<{ acceptance_criteria: string; is_first_task: boolean }>(
      'SELECT acceptance_criteria, is_first_task FROM tasks WHERE id = $1',
      [taskId]
    );
    if (!task) throw new AppError(404, '任务不存在', 'TASK_NOT_FOUND');

    // 获取修改次数
    const prevSubmission = await queryOne<{ ai_review_count: number }>(
      `SELECT ai_review_count FROM task_submissions
       WHERE task_id = $1 AND student_id = $2 ORDER BY submitted_at DESC LIMIT 1`,
      [taskId, userId]
    );
    const reviewCount = (prevSubmission?.ai_review_count || 0);

    if (reviewCount >= 2) {
      // 超过2次修改机会，触发挫败恢复机制
      await triggerFrustrationRecovery(userId, taskId);
      throw new AppError(400, '已超过修改次数限制，系统已为你推荐更简单的任务', 'MAX_REVISIONS_EXCEEDED');
    }

    // 调用 AI-04 预审核
    let aiReview: { passed: boolean; score: number; feedback: string } | null = null;
    try {
      const aiResponse = await axios.post(
        `${config.ai.serviceUrl}/ai/review-delivery`,
        {
          task_id: taskId,
          file_urls: fileUrls,
          acceptance_criteria: task.acceptance_criteria,
          review_count: reviewCount,
        },
        { timeout: config.ai.timeout }
      );
      aiReview = aiResponse.data;
    } catch {
      // AI 不可用时直接转企业
      aiReview = { passed: true, score: 75, feedback: '' };
    }

    const submissionId = uuidv4();
    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO task_submissions
          (id, task_id, student_id, file_urls, submission_note, ai_score, ai_feedback,
           ai_review_count, status, submitted_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
        [
          submissionId, taskId, userId,
          JSON.stringify(fileUrls), submissionNote,
          aiReview!.score, aiReview!.feedback,
          reviewCount + 1,
          aiReview!.passed ? 'pending' : 'rejected',
        ]
      );

      if (!aiReview!.passed) {
        // 记录情绪信号
        if (reviewCount >= 1) {
          // 第2次打回 → frustrated
          await client.query(
            `INSERT INTO emotion_signals (user_id, signal_type, signal_value, trigger_event)
             VALUES ($1, 'frustrated', $2, 'submission_rejected_twice')`,
            [userId, 5 + reviewCount]
          );
        }
      } else {
        // 通过AI审核，更新任务状态
        await client.query(
          `UPDATE task_assignments SET status = 'completed', completed_at = NOW()
           WHERE task_id = $1 AND student_id = $2`,
          [taskId, userId]
        );

        // Onboarding J7
        await client.query(
          `UPDATE onboarding_status
           SET j7_completed_at = NOW(), current_step = 'J8_earnings_received', updated_at = NOW()
           WHERE user_id = $1 AND j7_completed_at IS NULL`,
          [userId]
        );
      }
    });

    if (!aiReview!.passed) {
      // 第2次打回 → 推送替代任务 (异步)
      if (reviewCount >= 1) {
        setImmediate(() => triggerFrustrationRecovery(userId, taskId).catch(logger.error));
      }
      res.json({
        success: false,
        code: 'AI_REVIEW_FAILED',
        // v7 「成长信号」格式，绝不说「不合格」
        data: {
          passed: false,
          score: aiReview!.score,
          feedback: aiReview!.feedback, // AI-04 已按格式生成
          canRevise: reviewCount < 1,
          revisionsUsed: reviewCount + 1,
          maxRevisions: 2,
        },
      });
      return;
    }

    res.json({
      success: true,
      message: '提交成功！等待企业验收',
      data: { submissionId, score: aiReview!.score },
    });
  } catch (err) { next(err); }
}

// ============================================================
// 内部: 挫败恢复机制 (Ch.26)
// ============================================================
async function triggerFrustrationRecovery(userId: string, _taskId: string): Promise<void> {
  // 推送更简单的替代任务
  const simpleTask = await queryOne<{ id: string; title: string }>(
    `SELECT id, title FROM tasks
     WHERE status = 'active' AND is_first_task = TRUE AND deleted_at IS NULL
     ORDER BY RANDOM() LIMIT 1`
  );

  if (simpleTask) {
    await query(
      `INSERT INTO notifications (user_id, type, title, content, action_url)
       VALUES ($1, 'frustration_recovery', '换一个更简单的任务试试', $2, $3)`,
      [
        userId,
        '很多人第一次都需要修改，这很正常。我们为你找到了一个更适合现在的任务，先完成它建立信心，再回来挑战原来那个！',
        `/tasks/${simpleTask.id}`,
      ]
    );
  }
}

// ============================================================
// GET /tasks/market — 任务大厅 (所有 active 任务)
// ============================================================
export async function getMarketTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await query(
      `SELECT t.id, t.title, t.description, t.track, t.level_required,
              t.budget_gross, t.budget_net, t.estimated_minutes,
              t.max_assignees, t.assigned_count, t.created_at
       FROM tasks t
       WHERE t.status = 'active' AND t.deleted_at IS NULL
       ORDER BY t.created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    res.json({ success: true, data: tasks });
  } catch (err) { next(err); }
}

// ============================================================
// GET /tasks/my — 学生自己的任务列表
// ============================================================
export async function getMyTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { status } = req.query as { status?: string };

    const statusFilter = status ? `AND ta.status = $2` : '';
    const params: unknown[] = status ? [userId, status] : [userId];

    const tasks = await query(
      `SELECT t.id AS task_id, t.title, t.description, t.budget_net,
              ta.id, ta.status, ta.accepted_at, ta.completed_at,
              ta.submission_count,
              COALESCE(
                (SELECT json_agg(
                  json_build_object(
                    'id', ts.id, 'step_number', ts.step_number,
                    'title', ts.title, 'description', ts.description,
                    'tool', ts.tool_name, 'estimated_minutes', ts.estimated_minutes,
                    'status', ts.status
                  ) ORDER BY ts.step_number
                )
                FROM task_steps ts WHERE ts.task_id = t.id AND ts.student_id = $1
                ), '[]'::json
              ) AS steps
       FROM task_assignments ta
       JOIN tasks t ON t.id = ta.task_id
       WHERE ta.student_id = $1 ${statusFilter}
         AND t.deleted_at IS NULL
       ORDER BY ta.accepted_at DESC`,
      params
    );

    res.json({ success: true, data: tasks });
  } catch (err) { next(err); }
}

// ============================================================
// GET /tasks/:id — 任务详情
// ============================================================
export async function getTaskDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const task = await queryOne(
      `SELECT t.*,
              (SELECT ta.status FROM task_assignments ta
               WHERE ta.task_id = t.id AND ta.student_id = $2
               LIMIT 1) AS my_status
       FROM tasks t
       WHERE t.id = $1 AND t.deleted_at IS NULL`,
      [id, userId || null]
    );
    if (!task) throw new AppError(404, '任务不存在', 'NOT_FOUND');

    res.json({ success: true, data: task });
  } catch (err) { next(err); }
}

// ============================================================
// GET /tasks/:id/supplements — 查询追加需求历史
// ============================================================
export async function getTaskSupplements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id: taskId } = req.params;

    // 验证学生是否接了这个任务
    const assignment = await queryOne(
      `SELECT id FROM task_assignments WHERE task_id = $1 AND student_id = $2`,
      [taskId, userId]
    );
    if (!assignment) {
      throw new AppError(403, '你没有权限查看此任务的追加需求', 'FORBIDDEN');
    }

    // 查询追加需求历史
    const supplements = await query(
      `SELECT id, content, estimated_days, additional_budget,
              old_deadline, new_deadline, student_response,
              status, created_at, responded_at
       FROM requirement_supplements
       WHERE task_id = $1
       ORDER BY created_at ASC`,
      [taskId]
    );

    res.json({ success: true, data: supplements });
  } catch (err) { next(err); }
}

// ============================================================
// POST /tasks/:id/supplements/:supplementId/respond — 接受/拒绝追加需求
// ============================================================
export async function respondToSupplement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id: taskId, supplementId } = req.params;
    const { accept, response } = req.body;

    if (typeof accept !== 'boolean') {
      throw new AppError(400, '请指定是否接受追加需求', 'INVALID_PARAMS');
    }

    // 验证学生是否接了这个任务
    const assignment = await queryOne(
      `SELECT id FROM task_assignments WHERE task_id = $1 AND student_id = $2`,
      [taskId, userId]
    );
    if (!assignment) {
      throw new AppError(403, '你没有权限操作此任务的追加需求', 'FORBIDDEN');
    }

    // 验证追加需求存在且状态为pending
    const supplement = await queryOne<{
      id: string;
      status: string;
      new_deadline: string;
      additional_budget: number;
    }>(
      `SELECT id, status, new_deadline, additional_budget
       FROM requirement_supplements
       WHERE id = $1 AND task_id = $2`,
      [supplementId, taskId]
    );

    if (!supplement) {
      throw new AppError(404, '追加需求不存在', 'NOT_FOUND');
    }

    if (supplement.status !== 'pending') {
      throw new AppError(400, '此追加需求已被处理', 'ALREADY_RESPONDED');
    }

    await withTransaction(async (client) => {
      // 更新追加需求状态
      await client.query(
        `UPDATE requirement_supplements
         SET status = $1, student_response = $2, responded_at = NOW()
         WHERE id = $3`,
        [accept ? 'accepted' : 'rejected', response || null, supplementId]
      );

      if (accept) {
        // 接受：更新任务截止日期和预算
        await client.query(
          `UPDATE tasks
           SET deadline = $1,
               budget_gross = budget_gross + $2,
               budget_net = budget_net + $2
           WHERE id = $3`,
          [supplement.new_deadline, supplement.additional_budget, taskId]
        );

        // 通知企业
        const task = await queryOne<{ company_id: string; title: string }>(
          `SELECT company_id, title FROM tasks WHERE id = $1`,
          [taskId]
        );
        if (task) {
          await client.query(
            `INSERT INTO notifications (user_id, type, title, content, action_url)
             VALUES ($1, 'supplement_accepted', '学生已接受追加需求', $2, $3)`,
            [
              task.company_id,
              `学生已接受任务「${task.title}」的追加需求，新截止日期已生效。`,
              `/tasks/${taskId}`,
            ]
          );
        }
      } else {
        // 拒绝：通知企业
        const task = await queryOne<{ company_id: string; title: string }>(
          `SELECT company_id, title FROM tasks WHERE id = $1`,
          [taskId]
        );
        if (task) {
          await client.query(
            `INSERT INTO notifications (user_id, type, title, content, action_url)
             VALUES ($1, 'supplement_rejected', '学生拒绝了追加需求', $2, $3)`,
            [
              task.company_id,
              `学生拒绝了任务「${task.title}」的追加需求${response ? `，原因：${response}` : ''}`,
              `/tasks/${taskId}`,
            ]
          );
        }
      }
    });

    res.json({
      success: true,
      message: accept ? '已接受追加需求，截止日期已更新' : '已拒绝追加需求',
    });
  } catch (err) { next(err); }
}

async function sendFirstStepNotification(
  userId: string,
  taskId: string,
  step: { title: string; desc: string; tool: string; est_minutes: number }
): Promise<void> {
  await query(
    `INSERT INTO notifications (user_id, type, title, content, action_url)
     VALUES ($1, 'first_step', '你的第一步来了！', $2, $3)`,
    [
      userId,
      `现在做：${step.desc}，用 ${step.tool}，预计 ${step.est_minutes} 分钟。完成后点击「下一步」。`,
      `/tasks/${taskId}/steps`,
    ]
  );
}
