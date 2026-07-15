/**
 * 报告生成Agent
 * 基于L4成长档案生成学生能力报告
 */

import Anthropic from '@anthropic-ai/sdk';
import { memoryService } from '../services/memoryService';
import logger from '../utils/logger';

interface StudentReport {
  studentId: string;
  reportId: string;
  generatedAt: Date;
  summary: {
    totalTasks: number;
    completionRate: number;
    averageQuality: number;
    growthTrend: 'improving' | 'stable' | 'declining';
  };
  milestones: Array<{
    date: string;
    type: string;
    description: string;
    impact: string;
  }>;
  skillProfile: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  taskHistory: Array<{
    taskId: string;
    completedAt: string;
    quality: number;
    feedback: string;
    learnings: string[];
  }>;
  mentorInsights: string;
  nextSteps: string[];
}

class ReportGeneratorAgent {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * 生成学生能力报告
   */
  async generateReport(userId: string, options: {
    reportType?: 'comprehensive' | 'summary' | 'growth';
    timeRange?: number; // 天数，默认90天
  } = {}): Promise<StudentReport> {
    const startTime = Date.now();

    try {
      logger.info(`[报告生成Agent] 开始生成报告: userId=${userId}`);

      // 1. 加载学生的完整记忆
      const memory = await this.loadStudentMemory(userId);

      // 2. 使用AI分析和生成报告
      const reportContent = await this.generateReportWithAI(userId, memory, options);

      // 3. 构建结构化报告
      const report = this.buildStructuredReport(userId, memory, reportContent);

      logger.info(`[报告生成Agent] 报告生成完成: userId=${userId}, duration=${Date.now() - startTime}ms`);

      return report;
    } catch (error) {
      logger.error('[报告生成Agent] 报告生成失败:', error);
      throw error;
    }
  }

  /**
   * 加载学生的完整记忆（L1-L6）
   */
  private async loadStudentMemory(userId: string): Promise<any> {
    // 加载所有层级的记忆
    const memory = await memoryService.loadAllLayers(userId);

    return {
      // L3: 近期摘要（30天统计）
      recentSummary: memory.L3_recent || {},

      // L4: 成长档案（里程碑、任务报告）
      growthArchive: memory.L4_growth || {},

      // L5: 核心画像（昵称、等级、天赋、赛道）
      coreProfile: memory.L5_core || {},

      // L6: 关系记忆（关系阶段、对话摘要）
      relationship: memory.L6_relationship || {},
    };
  }

  /**
   * 使用AI生成报告内容
   */
  private async generateReportWithAI(
    userId: string,
    memory: any,
    options: any
  ): Promise<any> {
    const prompt = this.buildReportPrompt(memory, options);

    console.log('[reportGeneratorAgent] 调用Claude API生成报告...');

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // 解析JSON响应
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON from Claude response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * 构建报告生成提示词
   */
  private buildReportPrompt(memory: any, options: any): string {
    return `你是启程平台的"成长报告生成器"，需要基于学生的成长数据生成一份专业的能力评估报告。

# 学生成长数据

## L3 近期摘要（30天）
- 完成任务数: ${memory.recentSummary.tasksCompleted30d || 0}
- 情绪趋势: ${memory.recentSummary.emotionTrend || '未知'}
- 参与度分数: ${memory.recentSummary.engagementScore || 0}
- 常见卡点: ${JSON.stringify(memory.recentSummary.topStuckTypes || [])}

## L4 成长档案
- 里程碑数量: ${memory.growthArchive.milestones?.length || 0}
- 里程碑列表: ${JSON.stringify(memory.growthArchive.milestones || [], null, 2)}
- 任务报告数量: ${memory.growthArchive.taskMicroReports?.length || 0}
- 最近任务报告: ${JSON.stringify(memory.growthArchive.taskMicroReports?.slice(-3) || [], null, 2)}

## L5 核心画像
- 昵称: ${memory.coreProfile.nickname || '未设置'}
- 等级: ${memory.coreProfile.level || 1}
- 天赋画像: ${JSON.stringify(memory.coreProfile.talentProfile || {})}
- 赛道: ${JSON.stringify(memory.coreProfile.tracks || [])}

## L6 关系记忆
- 关系阶段: ${memory.relationship.relationshipStage || 'new'}
- 总对话次数: ${memory.relationship.totalConversations || 0}
- 对话摘要: ${JSON.stringify(memory.relationship.conversationSummary?.slice(-5) || [])}

# 任务要求

请生成一份JSON格式的学生能力报告，包含以下结构：

\`\`\`json
{
  "summary": {
    "overallAssessment": "一句话总结学生当前状态（30字以内）",
    "growthTrend": "improving / stable / declining",
    "keyHighlights": ["亮点1", "亮点2", "亮点3"]
  },
  "strengths": [
    {
      "skill": "技能名称",
      "evidence": "支持证据（从里程碑或任务报告中提取）",
      "level": "初级/中级/高级"
    }
  ],
  "areasForImprovement": [
    {
      "area": "需要改进的领域",
      "currentIssue": "当前问题描述",
      "recommendation": "具体改进建议"
    }
  ],
  "milestoneAnalysis": {
    "totalMilestones": 里程碑总数,
    "recentMilestones": ["最近3个里程碑的简述"],
    "nextMilestone": "预测下一个可能达成的里程碑"
  },
  "engagementAnalysis": {
    "participationLevel": "高/中/低",
    "emotionalState": "基于情绪趋势的分析",
    "mentorRelationship": "与导师关系的评价"
  },
  "recommendations": [
    {
      "priority": "high / medium / low",
      "action": "建议采取的行动",
      "expectedOutcome": "预期效果"
    }
  ],
  "nextSteps": ["下一步行动1", "下一步行动2", "下一步行动3"]
}
\`\`\`

# 分析原则
1. 基于数据事实，不臆测
2. 突出成长轨迹和进步
3. 指出问题但保持鼓励性
4. 建议要具体可执行
5. 关注长期发展潜力

请返回完整的JSON对象。`;
  }

  /**
   * 构建结构化报告
   */
  private buildStructuredReport(
    userId: string,
    memory: any,
    aiReport: any
  ): StudentReport {
    return {
      studentId: userId,
      reportId: `report_${Date.now()}`,
      generatedAt: new Date(),
      summary: {
        totalTasks: memory.recentSummary.tasksCompleted30d || 0,
        completionRate: this.calculateCompletionRate(memory),
        averageQuality: this.calculateAverageQuality(memory),
        growthTrend: aiReport.summary?.growthTrend || 'stable',
      },
      milestones: memory.growthArchive.milestones || [],
      skillProfile: {
        strengths: aiReport.strengths?.map((s: any) => s.skill) || [],
        weaknesses: aiReport.areasForImprovement?.map((a: any) => a.area) || [],
        recommendations: aiReport.recommendations?.map((r: any) => r.action) || [],
      },
      taskHistory: memory.growthArchive.taskMicroReports || [],
      mentorInsights: aiReport.engagementAnalysis?.emotionalState || '',
      nextSteps: aiReport.nextSteps || [],
    };
  }

  /**
   * 计算完成率
   */
  private calculateCompletionRate(memory: any): number {
    const completed = memory.recentSummary.tasksCompleted30d || 0;
    const total = completed + (memory.recentSummary.tasksRejected30d || 0);
    return total > 0 ? (completed / total) * 100 : 0;
  }

  /**
   * 计算平均质量
   */
  private calculateAverageQuality(memory: any): number {
    const reports = memory.growthArchive.taskMicroReports || [];
    if (reports.length === 0) return 0;

    const totalQuality = reports.reduce((sum: number, report: any) => {
      return sum + (report.quality || 0);
    }, 0);

    return totalQuality / reports.length;
  }
}

export const reportGeneratorAgent = new ReportGeneratorAgent();
export default reportGeneratorAgent;
