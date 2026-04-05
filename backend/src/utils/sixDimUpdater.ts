import Anthropic from '@anthropic-ai/sdk';
import { query } from './db';
import logger from './logger';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * 智能更新六维分数
 * 根据任务完成情况、企业评分、任务类型动态调整学生的六维能力分数
 */
export async function updateSixDimScores(
  userId: string,
  taskId: string,
  companyScore: number,
  taskType: string,
  taskDifficulty: number
): Promise<void> {
  try {
    // 获取当前六维分数和任务历史
    const profile = await query<{ six_dim_scores: Record<string, number>; task_count: number }>(
      `SELECT six_dim_scores, task_count FROM student_profiles WHERE user_id = $1`,
      [userId]
    );

    if (!profile || profile.length === 0) return;

    const currentScores = profile[0].six_dim_scores || {
      d1: 60, d2: 60, d3: 50, d4: 60, d5: 55, d6: 60
    };

    // 获取任务详情
    const taskInfo = await query(
      `SELECT title, description, track_type, level_required FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (!taskInfo || taskInfo.length === 0) return;

    const task = taskInfo[0];

    // 使用AI分析任务表现对六维的影响
    const prompt = `
分析学生完成任务后的能力变化：

## 任务信息
- 标题: ${task.title}
- 描述: ${task.description}
- 类型: ${task.track_type} (A=内容创作, B=工具开发)
- 难度等级: ${taskDifficulty}

## 学生表现
- 企业评分: ${companyScore}/100
- 已完成任务数: ${profile[0].task_count}

## 当前六维分数
${JSON.stringify(currentScores, null, 2)}

## 六维定义
- d1: 专业技能 (AI工具使用、专业知识)
- d2: 执行力 (按时交付、质量稳定)
- d3: 新工具上手速度
- d4: 需求理解能力
- d5: 时间管理
- d6: 交付水平 (最终成果质量)

请分析这次任务对六维分数的影响，返回JSON格式：
{
  "d1_change": <-5到+5的整数，表示变化幅度>,
  "d2_change": <-5到+5>,
  "d3_change": <-5到+5>,
  "d4_change": <-5到+5>,
  "d5_change": <-5到+5>,
  "d6_change": <-5到+5>,
  "reasoning": "<简短说明为什么这样调整>"
}

规则：
1. 高分任务(>85)应该增加相关维度1-3分
2. 低分任务(<70)应该降低相关维度1-2分
3. 内容创作任务主要影响d1,d4,d6
4. 工具开发任务主要影响d1,d3,d6
5. 所有任务都影响d2(执行力)和d5(时间管理)
6. 分数变化要保守，避免剧烈波动
`;

    let changes: {
      d1_change: number;
      d2_change: number;
      d3_change: number;
      d4_change: number;
      d5_change: number;
      d6_change: number;
    } = {
      d1_change: 0, d2_change: 0, d3_change: 0,
      d4_change: 0, d5_change: 0, d6_change: 0
    };

    // 开发模式或未配置API Key：使用规则引擎
    if (process.env.NODE_ENV === 'development' || !process.env.ANTHROPIC_API_KEY) {
      changes = calculateScoreChangesRuleBased(companyScore, task.track_type as string, taskDifficulty);
    } else {
      try {
        const response = await client.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }]
        });

        const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
        const result = JSON.parse(text);
        changes = {
          d1_change: result.d1_change || 0,
          d2_change: result.d2_change || 0,
          d3_change: result.d3_change || 0,
          d4_change: result.d4_change || 0,
          d5_change: result.d5_change || 0,
          d6_change: result.d6_change || 0,
        };
      } catch (err) {
        logger.error('AI score update failed, using rule-based', { error: (err as Error).message });
        changes = calculateScoreChangesRuleBased(companyScore, task.track_type as string, taskDifficulty);
      }
    }

    // 应用变化（限制在0-100范围内）
    const newScores = {
      d1: Math.max(0, Math.min(100, currentScores.d1 + (changes.d1_change || 0))),
      d2: Math.max(0, Math.min(100, currentScores.d2 + (changes.d2_change || 0))),
      d3: Math.max(0, Math.min(100, currentScores.d3 + (changes.d3_change || 0))),
      d4: Math.max(0, Math.min(100, currentScores.d4 + (changes.d4_change || 0))),
      d5: Math.max(0, Math.min(100, currentScores.d5 + (changes.d5_change || 0))),
      d6: Math.max(0, Math.min(100, currentScores.d6 + (changes.d6_change || 0))),
    };

    // 更新数据库
    await query(
      `UPDATE student_profiles SET six_dim_scores = $1, updated_at = NOW() WHERE user_id = $2`,
      [JSON.stringify(newScores), userId]
    );

    logger.info('Six dim scores updated', {
      userId,
      taskId,
      changes,
      newScores
    });
  } catch (err) {
    logger.error('Update six dim scores error', { error: (err as Error).message });
  }
}

/**
 * 基于规则的分数变化计算（降级方案）
 */
function calculateScoreChangesRuleBased(
  companyScore: number,
  trackType: string,
  difficulty: number
): {
  d1_change: number;
  d2_change: number;
  d3_change: number;
  d4_change: number;
  d5_change: number;
  d6_change: number;
} {
  const baseChange = companyScore >= 85 ? 2 : companyScore >= 70 ? 1 : -1;

  const changes = {
    d1_change: baseChange, // 专业技能
    d2_change: baseChange, // 执行力
    d3_change: 0,
    d4_change: 0,
    d5_change: companyScore >= 80 ? 1 : 0, // 时间管理
    d6_change: baseChange, // 交付水平
  };

  // 根据任务类型调整
  if (trackType === 'A') {
    // 内容创作：影响d1,d4,d6
    changes.d4_change = baseChange; // 需求理解
  } else if (trackType === 'B') {
    // 工具开发：影响d1,d3,d6
    changes.d3_change = baseChange; // 新工具上手
  }

  // 高难度任务额外奖励
  if (difficulty >= 3 && companyScore >= 85) {
    changes.d1_change += 1;
    changes.d6_change += 1;
  }

  return changes;
}
