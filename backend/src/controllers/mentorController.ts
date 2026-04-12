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
- 当前项目：${taskData ? taskData.title : '自由探索'}

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
导师：${taskData ? `这个项目有意思——它需要你${taskData.requiredSkill}，你上次测试时说自己是${studentData.personalityTag}，这次正好试试。对了，你的生命问题是"${studentData.lifeQuestion}"，做这个项目的时候，可以留意一下，说不定会有线索。` : `很高兴和你聊天！你上次测试时说自己是${studentData.personalityTag}。你现在在探索什么呢？`}

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
      `SELECT u.id, COALESCE(u.nickname, '同学') as name FROM users u WHERE u.id = $1`,
      [studentId]
    );

    // pool.query 直接返回数组，不是 { rows: [...] } 格式
    if (!studentResult || studentResult.length === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    const studentData = studentResult[0];

    // 尝试获取OPC测试结果
    try {
      const opcResult = await pool.query(
        `SELECT personality_tag FROM opc_test_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [studentId]
      );
      if (opcResult.length > 0) {
        studentData.personality_tag = opcResult[0].personality_tag;
      }
    } catch (err) {
      // OPC表可能不存在，忽略错误
    }

    // 2. 尝试获取生命问题（如果表存在）
    try {
      const lifeQuestionResult = await pool.query(
        `SELECT question FROM life_questions WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [studentId]
      );
      if (lifeQuestionResult.length > 0) {
        studentData.life_question = lifeQuestionResult[0].question;
      }
    } catch (error) {
      // 表不存在时忽略错误
      console.log('life_questions表不存在，跳过');
    }

    // 3. 获取任务信息
    let taskData = null;
    if (taskId) {
      const taskResult = await pool.query(
        `SELECT id, title, description, required_personality_style FROM tasks WHERE id = $1`,
        [taskId]
      );
      taskData = taskResult[0] || null;
    }

    // 4. 生成AI Prompt
    const prompt = generateMentorPrompt(studentData, taskData, {
      conversationHistory: conversationHistory || [],
      currentMessage: message
    });

    // 5. 调用AI生成回复（这里需要集成实际的AI服务，如OpenAI、Claude等）
    // 暂时返回示例回复
    const aiResponse = await generateAIResponse(prompt, message, studentData, taskData);

    // 6. 检测并记录热情火花
    if (aiResponse.detectedPassionSpark) {
      try {
        await pool.query(
          `INSERT INTO passion_sparks (student_id, task_id, spark_text, context, detected_by)
           VALUES ($1, $2, $3, $4, 'ai_mentor')`,
          [studentId, taskId, aiResponse.detectedPassionSpark, message]
        );
      } catch (error) {
        console.log('passion_sparks表不存在，跳过');
      }
    }

    // 7. 检测并记录穿越感时刻
    if (aiResponse.detectedFlowMoment) {
      try {
        await pool.query(
          `INSERT INTO flow_moments (student_id, task_id, moment_text, captured_at)
           VALUES ($1, $2, $3, NOW())`,
          [studentId, taskId, aiResponse.detectedFlowMoment]
        );
      } catch (error) {
        console.log('flow_moments表不存在，跳过');
      }
    }

    // 8. 保存对话记录
    try {
      await pool.query(
        `INSERT INTO mentor_conversations (student_id, task_id, student_message, mentor_response, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [studentId, taskId, message, aiResponse.response]
      );
    } catch (error) {
      console.log('mentor_conversations表不存在，跳过');
    }

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

  const studentName = studentData.name || '同学';
  const taskTitle = taskData?.title || '这个项目';
  const lifeQuestion = studentData.life_question;

  // 检测热情火花关键词
  const passionKeywords = ['很酷', '有意思', '我发现', '我觉得', '太棒了', '惊喜', '兴奋', '喜欢', '好玩'];
  for (const keyword of passionKeywords) {
    if (userMessage.includes(keyword)) {
      response.detectedPassionSpark = userMessage;
      response.response = `${studentName}，我注意到你刚才说"${keyword}"的时候，语气里有一种特别的能量。这让我想起一个问题：你做这件事的时候，是不是感觉时间过得特别快？或者说，你会不会不自觉地想要继续做下去？

这种感觉其实很重要——它可能就是你的热情火花。很多人花很长时间都找不到自己真正感兴趣的东西，但你现在可能正在经历这个时刻。

我想问你几个问题：
1. 你在做${taskTitle}的哪个部分时，最有这种感觉？
2. 这种感觉是第一次出现，还是之前也有过类似的体验？
3. 如果让你用一句话描述，你会说这是一种什么样的感觉？

${lifeQuestion ? `对了，你之前说你的生命问题是"${lifeQuestion}"。你觉得现在这个感觉，和你的这个问题有关系吗？不用急着回答，只是提醒你可以想想。` : ''}

慢慢说，我在听。`;
      return response;
    }
  }

  // 检测穿越感关键词
  const flowKeywords = ['时间过得很快', '忘记时间', '沉浸', '专注', '停不下来', '一直在做', '不知不觉'];
  for (const keyword of flowKeywords) {
    if (userMessage.includes(keyword)) {
      response.detectedFlowMoment = userMessage;
      response.response = `这就是我们说的"专注时刻"！你刚才描述的这种状态，其实是一个很重要的信号——它在告诉你，你可能找到了一个和自己很匹配的方向。

我想和你聊聊这个。你知道吗，很多人做事的时候都是在"推着自己走"，需要不断提醒自己"该做了"、"要坚持"。但你刚才说的这种状态，是完全不一样的——你是被事情本身"拉着走"的，不需要强迫自己，反而是停不下来。

这种状态不是每个人在每件事上都能体验到的。所以我想问你：

1. 你在做${taskTitle}的具体哪个环节时，进入了这种状态？
2. 这个环节有什么特点？是需要创造性思考，还是需要解决复杂问题，还是需要动手实践？
3. 你之前在做其他事情的时候，有没有过类似的体验？

如果你能找到让自己进入这种状态的规律，那你就找到了一个很重要的线索——关于你适合做什么、你的能力在哪里的线索。

${lifeQuestion ? `另外，你的生命问题是"${lifeQuestion}"。你觉得这次的专注时刻，和你的这个问题有没有什么联系？` : ''}

慢慢想，不着急。`;
      return response;
    }
  }

  // 检测卡点
  if (userMessage.includes('卡住') || userMessage.includes('不知道') || userMessage.includes('困难') || userMessage.includes('不会') || userMessage.includes('怎么办')) {
    response.response = `${studentName}，先别着急。卡住是很正常的，其实每个人在做新东西的时候都会卡。我之前也在这种地方卡过很多次。

我想先问你几个问题，帮你理清楚现在的状况：

1. **你具体卡在哪里了？**
   - 是完全不知道从哪里开始？
   - 还是知道要做什么，但不知道怎么做？
   - 还是做了一部分，但遇到了技术问题？

2. **你已经尝试过什么了？**
   - 你有没有试过搜索相关资料？
   - 有没有看过类似的案例？
   - 有没有尝试过其他方法？

3. **你觉得问题出在哪里？**
   - 是缺少某个工具或资源？
   - 是对需求理解得不够清楚？
   - 还是技术上有难点？

你先告诉我这些，我们一起来看看。记住，卡住不是坏事——它说明你正在挑战自己的边界，这本身就是成长。

${lifeQuestion ? `对了，你的生命问题是"${lifeQuestion}"。有时候，我们在项目中遇到的卡点，其实和我们的生命问题有关系。你可以想想，这次卡住的地方，是不是也反映了你在生活中经常遇到的某种困境？` : ''}

慢慢说，我们一起解决。`;
    return response;
  }

  // 检测完成
  if (userMessage.includes('完成') || userMessage.includes('做好了') || userMessage.includes('做完了') || userMessage.includes('搞定')) {
    response.response = `${studentName}，恭喜你完成了${taskTitle}！

但我不想只是说"做得好"就结束了。我更想和你聊聊，这个过程中你发现了什么关于自己的事。

我想问你几个问题：

1. **关于能力的发现**
   - 在做这个项目的过程中，你发现自己在哪些方面做得特别顺手？
   - 有没有哪个环节，你觉得"原来我还挺擅长这个的"？
   - 有没有哪个部分，你做起来特别有感觉？

2. **关于成长的感知**
   - 和你之前做过的事情比，这次有什么不一样？
   - 你觉得自己在哪些方面有了进步？
   - 有没有什么是你之前不会、现在会了的？

3. **关于自己的认识**
   - 做完这个项目，你对自己有什么新的认识吗？
   - 你发现自己是一个什么样的人？
   - 你觉得自己适合做什么样的事情？

${lifeQuestion ? `最后，你的生命问题是"${lifeQuestion}"。做完这个项目，你觉得对这个问题有没有一些新的想法？不用急着回答，只是提醒你可以想想。` : ''}

慢慢说，我想听听你的真实感受。`;
    return response;
  }

  // 检测提问
  if (userMessage.includes('怎么') || userMessage.includes('如何') || userMessage.includes('什么') || userMessage.includes('为什么') || userMessage.includes('?') || userMessage.includes('？')) {
    response.response = `${studentName}，我看到你在问问题，这很好——会提问本身就是一种能力。

不过在我直接给你答案之前，我想先和你一起想想。因为很多时候，答案其实就在问题里面。

让我们一起来看看：

1. **关于你的问题**
   - 你为什么会想到问这个问题？
   - 是因为遇到了什么具体的情况吗？
   - 你自己对这个问题有什么想法？

2. **关于你已经知道的**
   - 你之前有没有遇到过类似的情况？
   - 你当时是怎么处理的？
   - 你觉得那个方法能不能用在现在这个情况上？

3. **关于可能的方向**
   - 如果让你自己试试看，你会从哪里开始？
   - 你觉得可能有哪些解决方法？
   - 你最担心的是什么？

你先说说这些，然后我们再一起看看具体怎么做。我不是来直接给你答案的，而是来帮你找到自己的答案的。

${taskData ? `对了，你现在在做${taskTitle}，这个问题是和项目的哪个部分有关？` : ''}

慢慢说，我在听。`;
    return response;
  }

  // 默认回复 - 开放式引导
  response.response = `${studentName}，我听到你说的了。

你知道吗，我不是那种会直接告诉你"该怎么做"的导师。我更想做的，是帮你看见自己——看见你在做事情的时候是什么样的，看见你的能力在哪里，看见你真正感兴趣的是什么。

所以我想和你聊聊：

1. **关于现在**
   - 你现在在做什么？或者说，你现在在想什么？
   - 你做这件事的时候，是什么感觉？
   - 有没有什么让你觉得特别有意思的地方？

2. **关于你自己**
   - 你觉得自己是一个什么样的人？
   - 你喜欢做什么样的事情？
   - 你在做什么事情的时候，会感觉特别有劲儿？

3. **关于你的方向**
   - 你有没有想过，自己以后想做什么？
   - 不是说具体的职业，而是说，你想过什么样的生活？
   - 你希望自己成为什么样的人？

${lifeQuestion ? `你之前说你的生命问题是"${lifeQuestion}"。我们可以从这里开始聊，你觉得呢？` : ''}

${taskData ? `或者，我们也可以聊聊你现在在做的${taskTitle}。你接这个项目的时候，是怎么想的？` : ''}

慢慢说，不着急。我想听听你的真实想法。`;
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

