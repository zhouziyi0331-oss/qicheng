import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * 记录导师观察
 * POST /api/mentor/observe
 */
export const recordObservation = async (req: Request, res: Response) => {
  const { studentId, taskId, observationType, observationContent, observationData } = req.body;

  if (!studentId || !observationType || !observationContent) {
    return res.status(400).json({ error: '参数错误' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO mentor_observations (student_id, task_id, observation_type, observation_content, observation_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [studentId, taskId, observationType, observationContent, JSON.stringify(observationData || {})]
    );

    res.json({
      success: true,
      observationId: result.rows[0].id
    });
  } catch (error) {
    console.error('记录导师观察失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

/**
 * 检测学生卡点（定时任务调用）
 * POST /api/mentor/detect-stuck
 */
export const detectStuckPoints = async (req: Request, res: Response) => {
  try {
    // 查询所有进行中的任务，学生在某个步骤停留超过30分钟
    const result = await pool.query(
      `SELECT
        ta.id as application_id,
        ta.student_id,
        ta.task_id,
        ta.current_step,
        ta.updated_at,
        EXTRACT(EPOCH FROM (NOW() - ta.updated_at)) / 60 as minutes_stuck
       FROM task_applications ta
       WHERE ta.status = 'in_progress'
         AND EXTRACT(EPOCH FROM (NOW() - ta.updated_at)) / 60 > 30
         AND NOT EXISTS (
           SELECT 1 FROM mentor_observations mo
           WHERE mo.student_id = ta.student_id
             AND mo.task_id = ta.task_id
             AND mo.observation_type = 'stuck_point'
             AND mo.created_at > NOW() - INTERVAL '1 hour'
         )`
    );

    const stuckPoints = result.rows;

    // 为每个卡点创建观察记录
    for (const stuck of stuckPoints) {
      await pool.query(
        `INSERT INTO mentor_observations (student_id, task_id, observation_type, observation_content, observation_data)
         VALUES ($1, $2, 'stuck_point', $3, $4)`,
        [
          stuck.student_id,
          stuck.task_id,
          `学生在"${stuck.current_step}"步骤停留了${Math.round(stuck.minutes_stuck)}分钟`,
          JSON.stringify({ step: stuck.current_step, minutes: stuck.minutes_stuck })
        ]
      );
    }

    res.json({
      success: true,
      detected: stuckPoints.length
    });
  } catch (error) {
    console.error('检测卡点失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

/**
 * 生成AI导师消息（接单欢迎语）
 * POST /api/mentor/welcome-message
 */
export const generateWelcomeMessage = async (req: Request, res: Response) => {
  const { studentId, taskId } = req.body;

  try {
    // 1. 获取学生OPC测试结果
    const opcResult = await pool.query(
      `SELECT personality_tag, personality_description FROM user_opc_results
       WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 1`,
      [studentId]
    );

    // 2. 获取任务信息
    const taskResult = await pool.query(
      `SELECT title, description, required_personality_style FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const task = taskResult.rows[0];
    const opcData = opcResult.rows.length > 0 ? opcResult.rows[0] : null;

    // 3. 生成个性化欢迎消息
    let message = `这个项目有意思——`;

    if (opcData && task.required_personality_style === opcData.personality_tag) {
      const styleMessages: any = {
        'visual_storyteller': '它需要你用视觉语言讲故事',
        'system_builder': '它需要你设计一套完整的系统',
        'creative_executor': '它需要快速迭代和创意执行',
        'logic_analyzer': '它需要你把复杂问题拆解清楚',
        'stable_deliverer': '它需要稳定高质量的交付',
        'explorer_integrator': '它需要你整合多个工具',
        'balanced': '它需要灵活的工作方式'
      };

      message += styleMessages[opcData.personality_tag] || '它需要你的能力';
      message += `，你上次测试时说自己擅长这个方向，这次正好试试。`;
    } else {
      message += `「${task.title}」需要用到你的能力，这是个不错的实践机会。`;
    }

    res.json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('生成欢迎消息失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

/**
 * 生成里程碑夸奖消息
 * POST /api/mentor/milestone-message
 */
export const generateMilestoneMessage = async (req: Request, res: Response) => {
  const { studentId, taskId, milestoneType } = req.body;

  try {
    // 1. 查询学生的历史卡点记录
    const stuckHistory = await pool.query(
      `SELECT observation_content, observation_data, created_at
       FROM mentor_observations
       WHERE student_id = $1
         AND observation_type = 'stuck_point'
       ORDER BY created_at DESC
       LIMIT 5`,
      [studentId]
    );

    // 2. 查询当前任务的表现
    const currentTask = await pool.query(
      `SELECT * FROM task_applications WHERE student_id = $1 AND task_id = $2`,
      [studentId, taskId]
    );

    // 3. 生成对比式夸奖
    let message = '';

    if (stuckHistory.rows.length > 0) {
      const lastStuck = stuckHistory.rows[0];
      const stuckData = lastStuck.observation_data;

      if (stuckData && stuckData.step) {
        message = `上次你在"${stuckData.step}"这里卡了很久，这次你直接就处理好了——你自己有感觉到吗？`;
      } else {
        message = `这次完成得很顺利，比上次进步明显。你是怎么做到的？`;
      }
    } else {
      message = `完成得很好！你在这个项目中展现出了稳定的执行能力。`;
    }

    // 4. 记录为突破观察
    await pool.query(
      `INSERT INTO mentor_observations (student_id, task_id, observation_type, observation_content)
       VALUES ($1, $2, 'breakthrough', $3)`,
      [studentId, taskId, message]
    );

    res.json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('生成里程碑消息失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

/**
 * 生成打回修改消息
 * POST /api/mentor/rejection-message
 */
export const generateRejectionMessage = async (req: Request, res: Response) => {
  const { studentId, taskId, rejectionReason, goodPoints } = req.body;

  try {
    // 固定格式：先肯定 + 再说问题
    let message = '';

    if (goodPoints && goodPoints.length > 0) {
      message = `${goodPoints[0]}做得不错。`;
    } else {
      message = `整体方向是对的。`;
    }

    // 用提问的方式指出问题
    message += `${rejectionReason}这里，你觉得现在的处理方式够好吗？试试换个角度？`;

    res.json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('生成打回消息失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

/**
 * 检测习惯形成
 * POST /api/mentor/detect-habits
 */
export const detectHabits = async (req: Request, res: Response) => {
  try {
    // 查询学生连续3次任务在同一类问题上不再卡住
    const result = await pool.query(
      `WITH recent_tasks AS (
        SELECT
          ta.student_id,
          ta.task_id,
          ta.created_at,
          ROW_NUMBER() OVER (PARTITION BY ta.student_id ORDER BY ta.created_at DESC) as task_rank
        FROM task_applications ta
        WHERE ta.status = 'completed'
      ),
      stuck_analysis AS (
        SELECT
          rt.student_id,
          mo.observation_data->>'step' as stuck_step,
          COUNT(*) as stuck_count
        FROM recent_tasks rt
        LEFT JOIN mentor_observations mo ON mo.student_id = rt.student_id
          AND mo.task_id = rt.task_id
          AND mo.observation_type = 'stuck_point'
        WHERE rt.task_rank <= 3
        GROUP BY rt.student_id, mo.observation_data->>'step'
      )
      SELECT
        student_id,
        stuck_step,
        stuck_count
      FROM stuck_analysis
      WHERE stuck_count = 0 AND stuck_step IS NOT NULL`
    );

    const habits = result.rows;

    // 为每个习惯形成创建观察记录
    for (const habit of habits) {
      await pool.query(
        `INSERT INTO mentor_observations (student_id, observation_type, observation_content, observation_data)
         VALUES ($1, 'habit_formed', $2, $3)`,
        [
          habit.student_id,
          `学生在"${habit.stuck_step}"类型的任务中形成了稳定的工作模式`,
          JSON.stringify({ step: habit.stuck_step })
        ]
      );
    }

    res.json({
      success: true,
      detected: habits.length
    });
  } catch (error) {
    console.error('检测习惯形成失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};
