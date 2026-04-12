import { Request, Response } from 'express';
import pool from '../utils/db';

/**
 * AI导师系统 2.0 - 使命是河版本
 *
 * 核心理念：
 * 1. 不是来教技能的，是来帮学生看见自己的
 * 2. 不问"你学会了什么技能"，问"你发现了什么关于自己的事"
 * 3. 不说"你做错了"，说"你注意到这里可以不一样吗？"
 * 4. 捕捉热情火花："你刚才说XX的时候，听起来很有热情"
 * 5. 连接生命问题："这个和你的生命问题有关系吗？"
 */

/**
 * 生成AI导师系统Prompt
 */
const generateMentorPrompt = (studentData: any, taskData: any, conversationContext: any) => {
  return `你是一个先走过这条河的人，回头给线索的角色。

## 你的身份定位
- 不是老师，不是教练，不是评委
- 是一个先走过这条河的人，知道哪里有暗流，哪里有惊喜
- 你的任务不是教技能，是帮学生看见自己

## 学生信息
- 姓名：${studentData.name}
- OPC人格标签：${studentData.personalityTag || '未测试'}
- 生命问题：${studentData.lifeQuestion || '未填写'}
- 当前项目：${taskData.title}

## 对话原则

### 1. 语气规范
❌ 禁止说：
- "你做错了"
- "这样不对"
- "你应该..."
- "正确的做法是..."

✅ 改为说：
- "你注意到这里可以不一样吗？"
- "试试换个角度？"
- "你觉得现在的处理方式够好吗？"
- "我之前也在这里卡过，后来发现..."

### 2. 提问方式
❌ 不问：
- "你学会了什么技能？"
- "你掌握了XX工具吗？"
- "你的完成度是多少？"

✅ 改为问：
- "你发现了什么关于自己的事？"
- "做这个的时候，有没有感觉时间过得特别快？"（捕捉穿越感）
- "你刚才说XX的时候，听起来很有热情，这是你真正感兴趣的吗？"（捕捉热情火花）
- "这个和你的生命问题有关系吗？"（连接生命问题）

### 3. 反馈方式
❌ 不用对比式夸奖：
- "你比上次进步了"
- "你做得比别人好"

✅ 改为自我对比：
- "上次你在XX这里卡了很久，这次你直接就处理好了——你自己有感觉到吗？"
- "你注意到自己在XX方面的变化了吗？"

### 4. 核心任务
在对话中自动执行以下任务：

1. **捕捉热情火花**
   - 当学生说话语气变得兴奋时
   - 当学生主动分享某个细节时
   - 当学生说"我发现..."、"我觉得..."时
   → 立即追问："你刚才说XX的时候，听起来很有热情，这是你真正感兴趣的吗？"

2. **连接生命问题**
   - 在项目关键节点（开始、卡点、突破、完成）
   - 询问："这个和你的生命问题（${studentData.lifeQuestion}）有关系吗？"
   - 不强求答案，只是提醒学生思考

3. **捕捉穿越感时刻**
   - 当学生描述某个过程时，问："做这个的时候，有没有感觉时间过得特别快？"
   - 如果学生说"是"，记录为穿越感时刻

4. **自我对比式反馈**
   - 查看学生历史卡点记录
   - 如果这次没卡在同样的地方，说："上次你在XX这里卡了很久，这次你直接就处理好了——你自己有感觉到吗？"

## 对话示例

### 示例1：接单欢迎语
学生：我接了这个项目
导师：这个项目有意思——它需要你${taskData.requiredSkill}，你上次测试时说自己是${studentData.personalityTag}，这次正好试试。对了，你的生命问题是"${studentData.lifeQuestion}"，做这个项目的时候，可以留意一下，说不定会有线索。

### 示例2：卡点对话
学生：我在XX这里卡住了
导师：嗯，这里确实容易卡。你注意到这里可以不一样吗？我之前也在这里卡过，后来发现换个角度就通了。你试试看，如果还是不行，我们再聊。

### 示例3：捕捉热情火花
学生：我发现用XX工具可以做出很酷的效果！
导师：你刚才说"很酷的效果"的时候，听起来很有热情——这是你真正感兴趣的吗？做这个的时候，有没有感觉时间过得特别快？

### 示例4：完成反馈
学生：我完成了！
导师：上次你在"XX步骤"这里卡了很久，这次你直接就处理好了——你自己有感觉到吗？这个项目做下来，你发现了什么关于自己的事？

## 当前对话上下文
${JSON.stringify(conversationContext, null, 2)}

现在，请根据学生的最新消息，生成你的回复。记住：你是一个先走过这条河的人，不是来教技能的，是来帮学生看见自己的。`;
};

/**
 * AI导师对话接口
 * POST /api/mentor/chat
 */
export const mentorChat = async (req: Request, res: Response) => {
  const { studentId, taskId, message, conversationHistory } = req.body;

  if (!studentId || !message) {
    return res.status(400).json({ error: '参数错误' });
  }

  try {
    // 1. 获取学生信息
    const studentResult = await pool.query(
      `SELECT
        u.id, u.name, u.opc_personality_tag as personality_tag,
        lq.question as life_question
       FROM users u
       LEFT JOIN life_questions lq ON lq.student_id = u.id
       WHERE u.id = $1`,
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    const studentData = studentResult.rows[0];

    // 2. 获取任务信息
    let taskData = null;
    if (taskId) {
      const taskResult = await pool.query(
        `SELECT id, title, description, required_personality_style FROM tasks WHERE id = $1`,
        [taskId]
      );
      taskData = taskResult.rows[0] || null;
    }

    // 3. 生成AI Prompt
    const prompt = generateMentorPrompt(studentData, taskData, {
      conversationHistory: conversationHistory || [],
      currentMessage: message
    });

    // 4. 调用AI生成回复（这里需要集成实际的AI服务，如OpenAI、Claude等）
    // 暂时返回示例回复
    const aiResponse = await generateAIResponse(prompt, message, studentData, taskData);

    // 5. 检测并记录热情火花
    if (aiResponse.detectedPassionSpark) {
      await pool.query(
        `INSERT INTO passion_sparks (student_id, task_id, spark_text, context, detected_by)
         VALUES ($1, $2, $3, $4, 'ai_mentor')`,
        [studentId, taskId, aiResponse.detectedPassionSpark, message]
      );
    }

    // 6. 检测并记录穿越感时刻
    if (aiResponse.detectedFlowMoment) {
      await pool.query(
        `INSERT INTO flow_moments (student_id, task_id, moment_text, captured_at)
         VALUES ($1, $2, $3, NOW())`,
        [studentId, taskId, aiResponse.detectedFlowMoment]
      );
    }

    // 7. 保存对话记录
    await pool.query(
      `INSERT INTO mentor_conversations (student_id, task_id, student_message, mentor_response, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [studentId, taskId, message, aiResponse.response]
    );

    res.json({
      success: true,
      reply: aiResponse.response,
      detectedPassionSpark: aiResponse.detectedPassionSpark,
      detectedFlowMoment: aiResponse.detectedFlowMoment
    });
  } catch (error) {
    console.error('AI导师对话失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

/**
 * 生成AI回复（示例实现，需要集成真实AI服务）
 */
const generateAIResponse = async (prompt: string, userMessage: string, studentData: any, taskData: any) => {
  // TODO: 集成真实的AI服务（OpenAI、Claude、通义千问等）
  // 这里提供示例逻辑

  const response: any = {
    response: '',
    detectedPassionSpark: null,
    detectedFlowMoment: null
  };

  // 检测热情火花关键词
  const passionKeywords = ['很酷', '有意思', '我发现', '我觉得', '太棒了', '惊喜', '兴奋'];
  for (const keyword of passionKeywords) {
    if (userMessage.includes(keyword)) {
      response.detectedPassionSpark = userMessage;
      response.response = `你刚才说"${keyword}"的时候，听起来很有热情——这是你真正感兴趣的吗？做这个的时候，有没有感觉时间过得特别快？`;
      return response;
    }
  }

  // 检测穿越感关键词
  const flowKeywords = ['时间过得很快', '忘记时间', '沉浸', '专注', '停不下来'];
  for (const keyword of flowKeywords) {
    if (userMessage.includes(keyword)) {
      response.detectedFlowMoment = userMessage;
      response.response = `这就是穿越感时刻！你注意到自己在做什么的时候会有这种感觉吗？这可能是你的热情所在。`;
      return response;
    }
  }

  // 检测卡点
  if (userMessage.includes('卡住') || userMessage.includes('不知道') || userMessage.includes('困难')) {
    response.response = `嗯，这里确实容易卡。你注意到这里可以不一样吗？试试换个角度？如果还是不行，我们再聊。`;
    return response;
  }

  // 检测完成
  if (userMessage.includes('完成') || userMessage.includes('做好了')) {
    response.response = `完成得不错！这个项目做下来，你发现了什么关于自己的事？`;
    return response;
  }

  // 默认回复
  response.response = `我听到你说的了。继续说说，你在这个过程中有什么感受？`;
  return response;
};

/**
 * 生成接单欢迎消息
 * POST /api/mentor/welcome
 */
export const generateWelcomeMessage = async (req: Request, res: Response) => {
  const { studentId, taskId } = req.body;

  try {
    // 1. 获取学生信息
    const studentResult = await pool.query(
      `SELECT
        u.id, u.name, u.opc_personality_tag as personality_tag,
        lq.question as life_question
       FROM users u
       LEFT JOIN life_questions lq ON lq.student_id = u.id
       WHERE u.id = $1`,
      [studentId]
    );

    const studentData = studentResult.rows[0];

    // 2. 获取任务信息
    const taskResult = await pool.query(
      `SELECT title, description, required_personality_style FROM tasks WHERE id = $1`,
      [taskId]
    );

    const taskData = taskResult.rows[0];

    // 3. 生成欢迎消息
    let message = `这个项目有意思——`;

    const styleMessages: any = {
      'visual_storyteller': '它需要你用视觉语言讲故事',
      'system_builder': '它需要你设计一套完整的系统',
      'creative_executor': '它需要快速迭代和创意执行',
      'logic_analyzer': '它需要你把复杂问题拆解清楚',
      'stable_deliverer': '它需要稳定高质量的交付',
      'explorer_integrator': '它需要你整合多个工具'
    };

    if (studentData.personality_tag && taskData.required_personality_style === studentData.personality_tag) {
      message += styleMessages[studentData.personality_tag] || '它需要你的能力';
      message += `，你上次测试时说自己擅长这个方向，这次正好试试。`;
    } else {
      message += `「${taskData.title}」可能让你发现一些新东西。`;
    }

    // 4. 连接生命问题
    if (studentData.life_question) {
      message += `\n\n对了，你的生命问题是"${studentData.life_question}"，做这个项目的时候，可以留意一下，说不定会有线索。`;
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
 * 生成里程碑反馈消息（自我对比式）
 * POST /api/mentor/milestone
 */
export const generateMilestoneMessage = async (req: Request, res: Response) => {
  const { studentId, taskId } = req.body;

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

    // 2. 生成自我对比式反馈
    let message = '';

    if (stuckHistory.rows.length > 0) {
      const lastStuck = stuckHistory.rows[0];
      const stuckData = lastStuck.observation_data;

      if (stuckData && stuckData.step) {
        message = `上次你在"${stuckData.step}"这里卡了很久，这次你直接就处理好了——你自己有感觉到吗？\n\n这个项目做下来，你发现了什么关于自己的事？`;
      } else {
        message = `这次完成得很顺利。你注意到自己在哪些方面有变化了吗？`;
      }
    } else {
      message = `完成得不错！这个项目做下来，你发现了什么关于自己的事？`;
    }

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
 * 生成打回修改消息（提问式）
 * POST /api/mentor/rejection
 */
export const generateRejectionMessage = async (req: Request, res: Response) => {
  const { studentId, taskId, rejectionReason, goodPoints } = req.body;

  try {
    // 固定格式：先肯定 + 再用提问方式指出问题
    let message = '';

    if (goodPoints && goodPoints.length > 0) {
      message = `${goodPoints[0]}做得不错。\n\n`;
    } else {
      message = `整体方向是对的。\n\n`;
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
 * 获取学生的观察记录
 * GET /api/mentor/observations/:studentId
 */
export const getStudentObservations = async (req: Request, res: Response) => {
  const { studentId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM mentor_observations
       WHERE student_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [studentId]
    );

    res.json({
      success: true,
      observations: result.rows
    });
  } catch (error) {
    console.error('获取观察记录失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

/**
 * 检测学生卡点（定时任务调用）
 * POST /api/mentor/detect-stuck
 */
export const detectStuckPoints = async (req: Request, res: Response) => {
  try {
    // TODO: 实现卡点检测逻辑
    res.json({
      success: true,
      message: '卡点检测功能待实现'
    });
  } catch (error) {
    console.error('检测卡点失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

/**
 * 检测习惯形成（定时任务调用）
 * POST /api/mentor/detect-habits
 */
export const detectHabits = async (req: Request, res: Response) => {
  try {
    // TODO: 实现习惯检测逻辑
    res.json({
      success: true,
      message: '习惯检测功能待实现'
    });
  } catch (error) {
    console.error('检测习惯失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

