import { pool } from '../config/database';
import Anthropic from '@anthropic-ai/sdk';
import { pblAgentService } from './pblAgentService';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 智能导师路由服务
export class MentorRouterService {
  // 分析消息类型
  async analyzeMessageType(message: string, context: any) {
    const prompt = `分析用户消息，判断应该由哪个导师回应：

用户消息：${message}

上下文：
- 最近3条对话：${JSON.stringify(context.recent_messages || [])}
- 当前情绪状态：${context.emotional_state || '未知'}
- 是否有进行中的项目：${context.has_active_project ? '是' : '否'}
- 最近使用的导师：${context.last_mentor || '无'}

导师类型：
1. **情感导师（启程小猫）** - 适用于：
   - 表达情绪、感受
   - 探索人生方向、价值观
   - 需要鼓励和支持
   - 记录成长时刻
   - 日常聊天和陪伴

2. **项目导师（PBL Agent）** - 适用于：
   - 有具体工作问题要解决
   - 想做实际项目
   - 需要技术指导
   - 学习新技能
   - 代码相关问题

3. **协同模式** - 适用于：
   - 从情感困惑转化为行动
   - 既需要情感支持又需要实践指导
   - 项目遇到困难需要鼓励

请以JSON格式返回：
{
  "primary_type": "emotional" | "project" | "hybrid",
  "confidence": 0.85,
  "suggested_mentor": "emotional" | "project" | "both",
  "reason": "判断理由（简短）",
  "emotional_indicators": ["关键词1", "关键词2"],
  "project_indicators": ["关键词1", "关键词2"]
}`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const analysis = JSON.parse(content.text);
        return analysis;
      }
    } catch (err) {
      console.error('AI分析失败:', err);
      // 降级到关键词匹配
      return this.fallbackAnalysis(message);
    }

    return this.fallbackAnalysis(message);
  }

  // 降级分析（关键词匹配）
  private fallbackAnalysis(message: string) {
    const emotionalKeywords = [
      '感觉', '情绪', '困惑', '迷茫', '开心', '难过', '沮丧',
      '不知道', '未来', '方向', '意义', '价值', '害怕', '担心',
      '孤独', '焦虑', '压力', '累', '疲惫'
    ];

    const projectKeywords = [
      '项目', '做', '实现', '代码', '怎么', '如何', '学习',
      '技能', '工具', '方案', '问题', '错误', 'bug', '功能',
      '开发', '设计', '算法', 'API', '数据库'
    ];

    const emotionalScore = this.calculateKeywordScore(message, emotionalKeywords);
    const projectScore = this.calculateKeywordScore(message, projectKeywords);

    if (emotionalScore > projectScore && emotionalScore > 0.3) {
      return {
        primary_type: 'emotional',
        confidence: emotionalScore,
        suggested_mentor: 'emotional',
        reason: '消息包含情感相关内容'
      };
    } else if (projectScore > emotionalScore && projectScore > 0.3) {
      return {
        primary_type: 'project',
        confidence: projectScore,
        suggested_mentor: 'project',
        reason: '消息包含项目相关内容'
      };
    } else if (emotionalScore > 0.2 && projectScore > 0.2) {
      return {
        primary_type: 'hybrid',
        confidence: (emotionalScore + projectScore) / 2,
        suggested_mentor: 'both',
        reason: '消息同时包含情感和项目内容'
      };
    }

    // 默认情感导师
    return {
      primary_type: 'emotional',
      confidence: 0.5,
      suggested_mentor: 'emotional',
      reason: '默认使用情感导师'
    };
  }

  // 计算关键词分数
  private calculateKeywordScore(message: string, keywords: string[]) {
    const lowerMessage = message.toLowerCase();
    let matchCount = 0;

    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        matchCount++;
      }
    }

    return Math.min(matchCount / 5, 1.0);
  }

  // 获取用户上下文
  async getUserContext(userId: string) {
    const client = await pool.connect();
    try {
      // 获取最近对话
      const recentMessages = await client.query(
        `SELECT role, content, mentor_type, created_at
         FROM unified_mentor_conversations
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [userId]
      );

      // 获取导师模式
      const modeResult = await client.query(
        'SELECT * FROM mentor_modes WHERE user_id = $1',
        [userId]
      );

      // 获取活跃项目
      const projectResult = await client.query(
        `SELECT id, title, status, progress_percentage
         FROM pbl_projects
         WHERE user_id = $1 AND status NOT IN ('completed', 'cancelled')
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      );

      return {
        recent_messages: recentMessages.rows.reverse(),
        mentor_mode: modeResult.rows[0],
        active_project: projectResult.rows[0],
        has_active_project: projectResult.rows.length > 0,
        last_mentor: recentMessages.rows[0]?.mentor_type
      };
    } finally {
      client.release();
    }
  }

  // 记录路由决策
  async logRouting(userId: string, analysis: any, sessionId: string) {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO mentor_collaboration_logs (
          user_id, session_id, collaboration_type, trigger_reason, context
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          sessionId,
          analysis.suggested_mentor === 'both' ? 'integrated' : 'direct',
          'auto_detect',
          JSON.stringify(analysis)
        ]
      );
    } finally {
      client.release();
    }
  }

  // 生成过渡语
  async generateTransition(emotionalResponse: any, projectResponse: any) {
    const transitions = [
      "我理解你的感受。不如我们一起做点什么，把这个想法变成现实？",
      "听起来你已经有了想法。让我们一步步来实现它吧。",
      "很好！现在让我们把这个想法转化为具体的行动。",
      "我明白了。那么，我们可以从一个小项目开始。",
      "你的想法很棒！让我们一起探索如何实现它。"
    ];

    return transitions[Math.floor(Math.random() * transitions.length)];
  }
}

export const mentorRouterService = new MentorRouterService();
