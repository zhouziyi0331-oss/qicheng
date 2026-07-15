import { Request, Response, NextFunction } from 'express';
import { queryOne, query } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';

// ============================================================
// GET /ability/radar — 六维雷达图基础版 (免费, 完成首单后解锁)
// v7 要求: 雷达图是产品最精美的页面, 数据层面提供完整支撑
// ============================================================
export async function getRadar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    // 获取用户的OPC测评结果
    const opcResult = await queryOne<{
      personality_tag: string;
      information_processing_normalized: number;
      creation_drive_normalized: number;
      tool_learning_normalized: number;
      task_execution_normalized: number;
      collaboration_normalized: number;
      risk_attitude_normalized: number;
    }>(
      `SELECT personality_tag,
              information_processing_normalized,
              creation_drive_normalized,
              tool_learning_normalized,
              task_execution_normalized,
              collaboration_normalized,
              risk_attitude_normalized
       FROM user_opc_results
       WHERE user_id = $1
       ORDER BY completed_at DESC
       LIMIT 1`,
      [userId]
    );

    if (!opcResult) throw new AppError(404, '请先完成OPC测评', 'OPC_NOT_COMPLETED');

    // 获取用户基本信息
    const user = await queryOne<{
      current_level: number;
      task_count: number;
    }>(
      `SELECT current_level,
              COALESCE((SELECT COUNT(*) FROM task_assignments WHERE student_id = $1 AND status = 'completed'), 0) as task_count
       FROM users WHERE id = $1`,
      [userId]
    );

    // 获取进行中的任务数量
    const ongoingTasks = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM task_assignments
       WHERE student_id = $1 AND status IN ('in_progress', 'pending')`,
      [userId]
    );

    // 获取故事墙发布数量
    const stories = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM opc_stories
       WHERE author_student_id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    // 计算经验值（基于任务完成情况）
    const taskCount = user?.task_count || 0;
    const currentLevel = user?.current_level || 1;
    const baseExpPerLevel = 100;
    const expMultiplier = currentLevel;
    const maxExp = baseExpPerLevel * expMultiplier;
    const exp = (taskCount % 5) * (maxExp / 5); // 每5个任务升一级，exp为当前进度

    // 构建六维数据（使用中文字段名，匹配前端期望）
    const dimensions = {
      '信息处理': opcResult.information_processing_normalized,
      '创作驱动': opcResult.creation_drive_normalized,
      '工具学习': opcResult.tool_learning_normalized,
      '任务执行': opcResult.task_execution_normalized,
      '协作倾向': opcResult.collaboration_normalized,
      '风险态度': opcResult.risk_attitude_normalized,
    };

    // 计算身份类型ID (根据最强维度)
    const identityType = calculateIdentityType(dimensions);

    res.json({
      success: true,
      data: {
        identityType,  // 身份类型ID (0-6)
        identityName: opcResult.personality_tag,  // 身份类型名称
        dimensions,  // 六维数据（中文字段名）
        level: currentLevel,
        exp: Math.round(exp),
        max_exp: maxExp,
        completed_tasks: taskCount,
        ongoing_tasks: ongoingTasks?.count || 0,
        stories: stories?.count || 0,
      },
    });
  } catch (err: any) { next(err); }
}

// GET /ability/radar/detailed — 详细版 (付费)
export async function getDetailedRadar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    // 检查是否已付费
    const paid = await queryOne(
      `SELECT id FROM opc_reports
       WHERE user_id = $1 AND report_type = 'R1' AND status = 'done'`,
      [userId]
    );

    // 检查是否完成了3单 (解锁条件)
    const profile = await queryOne<{ task_count: number; six_dim_scores: Record<string, number> }>(
      'SELECT task_count, six_dim_scores FROM student_capabilities WHERE student_id = $1',
      [userId]
    );

    if (!profile || profile.task_count < 3) {
      throw new AppError(403, '完成3单后可解锁详细版', 'LOCKED');
    }

    if (!paid) {
      // 返回预览钩子 (v7)
      const scores = profile.six_dim_scores;
      res.json({
        success: false,
        code: 'PAYMENT_REQUIRED',
        data: {
          locked: true,
          price: 69,
          preview: {
            // 展示前两个维度的简要分析
            previewText: `你的专业技能评分 ${scores.d1}/100，执行力评分 ${scores.d2}/100...`,
            blurredText: '完整的六维分析将揭示你最独特的能力组合，解锁了解你为什么是「[模糊显示]」',
          },
        },
      });
      return;
    }

    // 已付费，返回详细分析
    const report = await queryOne<{ content_json: Record<string, unknown> }>(
      `SELECT content_json FROM opc_reports WHERE user_id = $1 AND report_type = 'R1' AND status = 'done'`,
      [userId]
    );

    res.json({ success: true, data: report?.content_json });
  } catch (err: any) { next(err); }
}

// ============================================================
// GET /ability/timeline — 能力成长时间线 (v7新增)
// ============================================================
export async function getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const events = await query(
      `SELECT id, event_type, event_title, event_desc, event_data,
              level_before, level_after, level_before_label, level_after_label,
              growth_comparison, is_milestone, share_card_generated, created_at
       FROM growth_timeline
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        events,
        // 前端渲染竖向时间轴
        totalEvents: events.length,
        milestones: events.filter((e) => (e as { is_milestone: boolean }).is_milestone),
      },
    });
  } catch (err: any) { next(err); }
}

// ============================================================
// 内部: 六维能力描述语生成
// d1:专业技能, d2:执行力, d3:新工具上手, d4:需求理解, d5:时间管理, d6:交付水平
// ============================================================
function buildDimensionDescriptions(scores: Record<string, number>) {
  const desc: Record<string, { name: string; score: number; description: string; color: string }> = {
    d1: {
      name: '专业技能',
      score: scores.d1 || 0,
      description: getScoreDesc(scores.d1, ['你正在积累专业技能', '你有扎实的专业基础', '你是那种说到做到的专家']),
      color: '#6ee7f7',
    },
    d2: {
      name: '执行力',
      score: scores.d2 || 0,
      description: getScoreDesc(scores.d2, ['你正在建立执行习惯', '你的执行力已相当稳定', '你是那种说到做到的人']),
      color: '#a78bfa',
    },
    d3: {
      name: '新工具上手',
      score: scores.d3 || 0,
      description: getScoreDesc(scores.d3, ['你愿意尝试新工具', '你上手新工具很快', '你是工具达人，新工具是你的武器']),
      color: '#34d399',
    },
    d4: {
      name: '需求理解',
      score: scores.d4 || 0,
      description: getScoreDesc(scores.d4, ['你在学习理解需求', '你能准确把握需求', '你能精准理解甲方真正想要什么']),
      color: '#fbbf24',
    },
    d5: {
      name: '时间管理',
      score: scores.d5 || 0,
      description: getScoreDesc(scores.d5, ['你正在建立时间管理习惯', '你的时间管理相当不错', '你是时间的主人，从不拖延']),
      color: '#f87171',
    },
    d6: {
      name: '交付水平',
      score: scores.d6 || 0,
      description: getScoreDesc(scores.d6, ['你正在提升交付质量', '你的交付质量稳定可靠', '你的交付让人惊喜，超出预期']),
      color: '#60a5fa',
    },
  };
  return desc;
}

// ============================================================
// 辅助函数: 根据六维数据计算身份类型ID
// 7种身份类型映射 (与前端IDENTITY_TYPES保持一致)
// ============================================================
function calculateIdentityType(dimensions: Record<string, number>): number {
  // 获取六维分数
  const scores = [
    dimensions['信息处理'] || 0,
    dimensions['创作驱动'] || 0,
    dimensions['工具学习'] || 0,
    dimensions['任务执行'] || 0,
    dimensions['协作倾向'] || 0,
    dimensions['风险态度'] || 0,
  ];

  // 找出最高分的维度索引
  const maxScore = Math.max(...scores);
  const maxIndex = scores.indexOf(maxScore);

  // 根据最强维度映射到身份类型ID
  // 0:信息处理 -> 视觉叙事者(0)
  // 1:创作驱动 -> 创意执行者(2)
  // 2:工具学习 -> 系统构建者(1)
  // 3:任务执行 -> 稳健交付者(4)
  // 4:协作倾向 -> 探索整合者(5)
  // 5:风险态度 -> 冒险驱动者(6)
  const identityMap = [0, 2, 1, 4, 5, 6];

  return identityMap[maxIndex] || 0;
}

function getScoreDesc(score: number, levels: string[]): string {
  if (score < 40) return levels[0];
  if (score < 75) return levels[1];
  return levels[2];
}

// ============================================================
// GET /ability/emotion-state
// 获取学生当前情绪状态
// ============================================================
export async function getEmotionState(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    // 查询最近的情绪信号
    const emotionSignal = await queryOne<{
      signal_type: string;
      signal_value: number;
      trigger_event: string;
      detected_at: Date;
    }>(
      `SELECT signal_type, signal_value, trigger_event, detected_at
       FROM emotion_signals
       WHERE user_id = $1 AND resolved_at IS NULL
       ORDER BY detected_at DESC
       LIMIT 1`,
      [userId]
    );

    if (!emotionSignal) {
      // 没有未解决的情绪信号，返回平静状态
      res.json({
        success: true,
        data: {
          emotionType: 'calm',
          value: 5,
          description: '状态平稳',
          detectedAt: new Date(),
        },
      });
      return;
    }

    // 映射情绪类型到描述
    const emotionDescriptions: Record<string, string> = {
      excited: '兴奋状态，适合挑战新任务',
      frustrated: '遇到困难，需要支持',
      cooling: '活跃度下降，需要激励',
      calm: '状态平稳',
    };

    res.json({
      success: true,
      data: {
        emotionType: emotionSignal.signal_type,
        value: emotionSignal.signal_value,
        description: emotionDescriptions[emotionSignal.signal_type] || '未知状态',
        triggerEvent: emotionSignal.trigger_event,
        detectedAt: emotionSignal.detected_at,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

// ============================================================
// GET /ability/growth-comparison
// 获取成长对比数据（入驻时 vs 当前）
// ============================================================
export async function getGrowthComparison(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    // 获取最早的OPC测评结果（入驻时）
    const initialResult = await queryOne<{
      information_processing_normalized: number;
      creation_drive_normalized: number;
      tool_learning_normalized: number;
      task_execution_normalized: number;
      collaboration_normalized: number;
      risk_attitude_normalized: number;
      completed_at: Date;
    }>(
      `SELECT information_processing_normalized,
              creation_drive_normalized,
              tool_learning_normalized,
              task_execution_normalized,
              collaboration_normalized,
              risk_attitude_normalized,
              completed_at
       FROM user_opc_results
       WHERE user_id = $1
       ORDER BY completed_at ASC
       LIMIT 1`,
      [userId]
    );

    // 获取最新的OPC测评结果（当前）
    const currentResult = await queryOne<{
      information_processing_normalized: number;
      creation_drive_normalized: number;
      tool_learning_normalized: number;
      task_execution_normalized: number;
      collaboration_normalized: number;
      risk_attitude_normalized: number;
      completed_at: Date;
    }>(
      `SELECT information_processing_normalized,
              creation_drive_normalized,
              tool_learning_normalized,
              task_execution_normalized,
              collaboration_normalized,
              risk_attitude_normalized,
              completed_at
       FROM user_opc_results
       WHERE user_id = $1
       ORDER BY completed_at DESC
       LIMIT 1`,
      [userId]
    );

    if (!initialResult || !currentResult) {
      throw new AppError(404, '请先完成OPC测评', 'OPC_NOT_COMPLETED');
    }

    res.json({
      success: true,
      data: {
        past: {
          date: initialResult.completed_at,
          dimensions: {
            '信息处理': initialResult.information_processing_normalized,
            '创作驱动': initialResult.creation_drive_normalized,
            '工具学习': initialResult.tool_learning_normalized,
            '任务执行': initialResult.task_execution_normalized,
            '协作倾向': initialResult.collaboration_normalized,
            '风险态度': initialResult.risk_attitude_normalized,
          },
        },
        current: {
          date: currentResult.completed_at,
          dimensions: {
            '信息处理': currentResult.information_processing_normalized,
            '创作驱动': currentResult.creation_drive_normalized,
            '工具学习': currentResult.tool_learning_normalized,
            '任务执行': currentResult.task_execution_normalized,
            '协作倾向': currentResult.collaboration_normalized,
            '风险态度': currentResult.risk_attitude_normalized,
          },
        },
      },
    });
  } catch (err: any) {
    next(err);
  }
}

// ============================================================
// GET /ability/growth-dashboard
// 获取成长仪表盘数据
// ============================================================
export async function getGrowthDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    // 获取用户加入天数
    const user = await queryOne<{ created_at: Date }>(
      'SELECT created_at FROM users WHERE id = $1',
      [userId]
    );

    const checkInDays = user
      ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // 获取完成的任务数
    const completedTasks = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM task_assignments
       WHERE student_id = $1 AND status = 'completed'`,
      [userId]
    );

    // 计算成长趋势（基于OPC测评历史数据）
    let growthTrend = 0;
    const opcHistory = await query<{
      information_processing_normalized: number;
      creation_drive_normalized: number;
      tool_learning_normalized: number;
      task_execution_normalized: number;
      collaboration_normalized: number;
      risk_attitude_normalized: number;
      completed_at: Date;
    }>(
      `SELECT information_processing_normalized,
              creation_drive_normalized,
              tool_learning_normalized,
              task_execution_normalized,
              collaboration_normalized,
              risk_attitude_normalized,
              completed_at
       FROM user_opc_results
       WHERE user_id = $1
       ORDER BY completed_at ASC`,
      [userId]
    );

    if (opcHistory.length >= 2) {
      // 计算首次和最近一次的平均分
      const firstResult = opcHistory[0];
      const latestResult = opcHistory[opcHistory.length - 1];

      const firstAvg = (
        firstResult.information_processing_normalized +
        firstResult.creation_drive_normalized +
        firstResult.tool_learning_normalized +
        firstResult.task_execution_normalized +
        firstResult.collaboration_normalized +
        firstResult.risk_attitude_normalized
      ) / 6;

      const latestAvg = (
        latestResult.information_processing_normalized +
        latestResult.creation_drive_normalized +
        latestResult.tool_learning_normalized +
        latestResult.task_execution_normalized +
        latestResult.collaboration_normalized +
        latestResult.risk_attitude_normalized
      ) / 6;

      growthTrend = latestAvg - firstAvg;
    } else {
      // 如果只有一次测评，默认趋势为0
      growthTrend = 0;
    }

    // 获取最近活动
    const recentActivities = await query(
      `SELECT event_title as activity,
              event_desc as description,
              created_at as date
       FROM growth_timeline
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );

    // 获取里程碑
    const milestones = await query(
      `SELECT milestone_title as name,
              achieved_at as date,
              milestone_type as icon
       FROM growth_milestones
       WHERE student_id = $1
       ORDER BY achieved_at DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        checkInDays,
        achievements: completedTasks?.count || 0,
        growthTrend,
        recentActivities,
        milestones,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

// ============================================================
// POST /ability/update-after-task
// 任务完成后更新学生能力画像
// ============================================================
export async function updateAfterTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { taskId, performance } = req.body;

    if (!taskId) {
      throw new AppError(400, '缺少任务ID', 'MISSING_TASK_ID');
    }

    // 获取任务信息
    const task = await queryOne<{
      id: string;
      title: string;
      difficulty_level: number;
    }>(
      'SELECT id, title, difficulty_level FROM tasks WHERE id = $1',
      [taskId]
    );

    if (!task) {
      throw new AppError(404, '任务不存在', 'TASK_NOT_FOUND');
    }

    // 获取当前能力画像
    const profile = await queryOne<{
      six_dim_scores: Record<string, number>;
      current_level: number;
      level_b: number;
      task_count: number;
    }>(
      'SELECT six_dim_scores, current_level, level_b, task_count FROM student_capabilities WHERE student_id = $1',
      [userId]
    );

    if (!profile) {
      throw new AppError(404, '学生画像不存在', 'PROFILE_NOT_FOUND');
    }

    // 根据任务表现计算能力增长
    const performanceScore = performance?.score || 80; // 默认80分
    const growthFactor = performanceScore / 100;
    const baseGrowth = 2; // 基础增长2分

    // 更新六维能力（简化版：均匀增长）
    const currentScores = profile.six_dim_scores || { d1: 50, d2: 50, d3: 50, d4: 50, d5: 50, d6: 50 };
    const updatedScores: Record<string, number> = {};

    Object.keys(currentScores).forEach((dim) => {
      const currentValue = currentScores[dim];
      updatedScores[dim] = Math.min(100, currentValue + baseGrowth * growthFactor);
    });

    // 更新数据库
    await query(
      `UPDATE student_capabilities
       SET six_dim_scores = $1,
           task_count = task_count + 1,
           updated_at = NOW()
       WHERE user_id = $2`,
      [JSON.stringify(updatedScores), userId]
    );

    // 记录成长时间线事件
    await query(
      `INSERT INTO growth_timeline
       (user_id, event_type, event_title, event_desc, level_before, level_after, created_at)
       VALUES ($1, 'task_completed', $2, $3, $4, $5, NOW())`,
      [
        userId,
        `完成任务：${task.title}`,
        `任务难度 ${task.difficulty_level}，表现评分 ${performanceScore}`,
        profile.current_level,
        profile.current_level, // 简化版：暂不改变等级
      ]
    );

    res.json({
      success: true,
      data: {
        message: '能力画像已更新',
        updatedScores,
        taskCount: profile.task_count + 1,
      },
    });
  } catch (err: any) {
    next(err);
  }
}
