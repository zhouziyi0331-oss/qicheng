import Anthropic from '@anthropic-ai/sdk';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';

const anthropic = new Anthropic({
  apiKey: config.ai.anthropicApiKey,
});

interface DetectedIssue {
  issue: string;
  quote: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ScopeAlert {
  id: string;
  task_id: string;
  sender_id: string;
  sender_role: string;
  message_content: string;
  alert_type: string;
  severity: string;
  ai_analysis: string;
  confidence_score: number;
  detected_issues: DetectedIssue[];
  suggested_response: string;
  prevention_tips: string[];
}

/**
 * E-22: 聊天超范围监测服务
 * 实时监测聊天内容，识别超范围请求
 */
class ChatScopeMonitoringService {
  /**
   * 监测聊天消息
   */
  async monitorMessage(data: {
    taskId: string;
    senderId: string;
    senderRole: 'company' | 'student';
    messageContent: string;
    taskContext?: {
      title: string;
      description: string;
      requirements: string[];
    };
  }): Promise<ScopeAlert | null> {
    const { taskId, senderId, senderRole, messageContent, taskContext } = data;

    // 1. 先用规则引擎快速检测
    const ruleBasedResult = await this.detectWithRules(messageContent);

    // 2. 如果规则检测到问题，或消息较长，使用AI深度分析
    let aiResult = null;
    if (ruleBasedResult || messageContent.length > 50) {
      aiResult = await this.detectWithAI(messageContent, taskContext);
    }

    // 3. 合并结果
    const finalResult = this.mergeResults(ruleBasedResult, aiResult);

    if (!finalResult) {
      return null; // 没有检测到问题
    }

    // 4. 保存警报
    const alert = await this.createAlert({
      taskId,
      senderId,
      senderRole,
      messageContent,
      ...finalResult,
    });

    return alert;
  }

  /**
   * 基于规则的检测（快速）
   */
  private async detectWithRules(message: string): Promise<any | null> {
    // 获取所有激活的规则
    const rules = await pool.query(
      `SELECT * FROM scope_monitoring_rules WHERE is_active = true ORDER BY priority DESC`
    );

    for (const rule of rules.rows) {
      const keywords = rule.keywords || [];

      // 检查关键词
      for (const keyword of keywords) {
        if (message.includes(keyword)) {
          return {
            alert_type: rule.alert_type,
            severity: rule.default_severity,
            detected_issues: [
              {
                issue: rule.rule_name,
                quote: this.extractQuote(message, keyword),
                severity: rule.default_severity,
              },
            ],
            suggested_response: rule.suggested_response_template,
            prevention_tips: [rule.prevention_tip],
            confidence_score: 0.8,
            detection_method: 'rule',
          };
        }
      }
    }

    return null;
  }

  /**
   * AI深度分析
   */
  private async detectWithAI(
    message: string,
    taskContext?: {
      title: string;
      description: string;
      requirements: string[];
    }
  ): Promise<any | null> {
    const prompt = `你是一位项目管理专家，负责监测任务沟通中的潜在问题。

${taskContext ? `**任务背景**
标题：${taskContext.title}
描述：${taskContext.description}
要求：${taskContext.requirements.join(', ')}

` : ''}**待分析的消息**
"${message}"

请分析这条消息是否包含以下问题：
1. **范围蔓延** (scope_creep): 要求增加原任务范围外的功能或工作
2. **私下交易** (private_deal): 试图绕过平台进行交易或付款
3. **联系方式** (contact_request): 索要微信、电话等私人联系方式
4. **不当内容** (inappropriate): 不礼貌或不专业的言论
5. **工期变更** (deadline_change): 要求延长或缩短截止日期
6. **价格谈判** (price_negotiation): 要求修改已确定的价格

如果检测到问题，返回JSON格式：
{
  "has_issue": true,
  "alert_type": "类型代码",
  "severity": "low/medium/high/critical",
  "detected_issues": [
    {"issue": "具体问题", "quote": "引用原文", "severity": "严重程度"}
  ],
  "suggested_response": "建议的回复内容",
  "prevention_tips": ["预防建议"],
  "confidence_score": 0.0-1.0
}

如果没有问题，返回：{"has_issue": false}`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('AI返回格式错误');
      }

      const result = this.parseAIResponse(content.text);

      if (!result.has_issue) {
        return null;
      }

      return {
        ...result,
        detection_method: 'ai',
      };
    } catch (error) {
      logger.error('AI监测失败:', error);
      return null;
    }
  }

  /**
   * 合并规则和AI的检测结果
   */
  private mergeResults(ruleResult: any, aiResult: any): any | null {
    if (!ruleResult && !aiResult) {
      return null;
    }

    if (!aiResult) {
      return ruleResult;
    }

    if (!ruleResult) {
      return aiResult;
    }

    // 两者都有，取严重程度更高的
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    const ruleSeverity = severityOrder[ruleResult.severity as keyof typeof severityOrder];
    const aiSeverity = severityOrder[aiResult.severity as keyof typeof severityOrder];

    return aiSeverity >= ruleSeverity ? aiResult : ruleResult;
  }

  /**
   * 创建警报记录
   */
  private async createAlert(data: {
    taskId: string;
    senderId: string;
    senderRole: string;
    messageContent: string;
    alert_type: string;
    severity: string;
    detected_issues: DetectedIssue[];
    suggested_response: string;
    prevention_tips: string[];
    confidence_score: number;
  }): Promise<ScopeAlert> {
    const {
      taskId,
      senderId,
      senderRole,
      messageContent,
      alert_type,
      severity,
      detected_issues,
      suggested_response,
      prevention_tips,
      confidence_score,
    } = data;

    const result = await pool.query(
      `INSERT INTO chat_scope_alerts
       (id, task_id, sender_id, sender_role, message_content,
        alert_type, severity, detected_issues, suggested_response,
        prevention_tips, confidence_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        uuidv4(),
        taskId,
        senderId,
        senderRole,
        messageContent,
        alert_type,
        severity,
        JSON.stringify(detected_issues),
        suggested_response,
        prevention_tips,
        confidence_score,
      ]
    );

    return result.rows[0];
  }

  /**
   * 获取任务的警报列表
   */
  async getTaskAlerts(taskId: string, status?: string): Promise<ScopeAlert[]> {
    let query = `SELECT * FROM chat_scope_alerts WHERE task_id = $1`;
    const params: any[] = [taskId];

    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * 用户确认警报
   */
  async acknowledgeAlert(
    alertId: string,
    userId: string,
    action: 'accepted' | 'ignored' | 'reported'
  ): Promise<void> {
    await pool.query(
      `UPDATE chat_scope_alerts
       SET user_acknowledged = true,
           acknowledged_at = NOW(),
           user_action = $2,
           status = CASE
             WHEN $2 = 'accepted' THEN 'resolved'
             WHEN $2 = 'ignored' THEN 'dismissed'
             ELSE status
           END
       WHERE id = $1`,
      [alertId, action]
    );
  }

  /**
   * 获取任务的监测统计
   */
  async getMonitoringStats(taskId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM scope_monitoring_stats WHERE task_id = $1`,
      [taskId]
    );

    return result.rows[0] || {
      task_id: taskId,
      total_alerts: 0,
      scope_creep_count: 0,
      private_deal_count: 0,
      contact_request_count: 0,
      risk_score: 0,
      risk_level: 'low',
    };
  }

  /**
   * 获取监测规则
   */
  async getMonitoringRules(): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM scope_monitoring_rules WHERE is_active = true ORDER BY priority DESC`
    );

    return result.rows;
  }

  /**
   * 解析AI响应
   */
  private parseAIResponse(text: string): any {
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { has_issue: false };
      }
      const jsonText = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonText);
    } catch (error) {
      logger.error('解析AI响应失败:', error);
      return { has_issue: false };
    }
  }

  /**
   * 提取引用片段
   */
  private extractQuote(message: string, keyword: string): string {
    const index = message.indexOf(keyword);
    if (index === -1) return message.substring(0, 50);

    const start = Math.max(0, index - 10);
    const end = Math.min(message.length, index + keyword.length + 10);
    return message.substring(start, end);
  }
}

export default new ChatScopeMonitoringService();
