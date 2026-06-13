/**
 * 学生档案增强服务 - E-05功能
 * 将普通学生信息转化为"投资简报"风格的展示
 * 包含成长故事、关键里程碑、数据可视化
 */

import Anthropic from '@anthropic-ai/sdk';
import { pool } from '../utils/db';
import logger from '../utils/logger';
import config from '../config';

interface Student {
  id: string;
  name: string;
  avatar?: string;
  level: number;
  created_at: Date;
}

interface StudentCapability {
  skills: any;
  tasks_completed: number;
  avg_task_quality: number;
  avg_client_satisfaction: number;
  on_time_delivery_rate: number;
  quality_trend: string;
  growth_rate: number;
}

interface EnhancedProfile {
  // 基础信息
  student_id: string;
  student_name: string;
  level: number;
  avatar?: string;
  
  // 投资简报风格
  headline: string;
  growth_story: string;
  key_strengths: string[];
  
  // 关键里程碑
  milestones: Array<{
    date: string;
    title: string;
    description: string;
    impact: string;
  }>;
  
  // 核心数据
  metrics: {
    tasks_completed: number;
    success_rate: number;
    on_time_rate: number;
    avg_rating: number;
    response_time_hours: number;
    growth_rate: number;
  };
  
  // 技能雷达图数据
  skill_radar: Array<{
    skill: string;
    proficiency: number;
    confidence: number;
  }>;
  
  // 特色标签
  tags: string[];
  
  // 投资亮点
  investment_highlights: string[];
}

class StudentProfileEnhancer {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: config.anthropicApiKey,
    });
  }

  /**
   * 生成增强的学生档案
   */
  async generateEnhancedProfile(studentId: string): Promise<EnhancedProfile> {
    try {
      logger.info(`Generating enhanced profile for student: ${studentId}`);

      // 1. 获取学生基础信息
      const student = await this.getStudentBasicInfo(studentId);

      // 2. 获取学生能力数据
      const capability = await this.getStudentCapability(studentId);

      // 3. 获取任务历史
      const taskHistory = await this.getTaskHistory(studentId);

      // 4. 使用AI生成成长故事和亮点
      const aiGenerated = await this.generateGrowthStory(student, capability, taskHistory);

      // 5. 提取关键里程碑
      const milestones = await this.extractMilestones(studentId, taskHistory);

      // 6. 生成技能雷达图数据
      const skillRadar = this.generateSkillRadar(capability);

      // 7. 生成特色标签
      const tags = this.generateTags(student, capability);

      // 8. 组装完整档案
      const enhancedProfile: EnhancedProfile = {
        student_id: studentId,
        student_name: student.name,
        level: student.level,
        avatar: student.avatar,
        headline: aiGenerated.headline,
        growth_story: aiGenerated.growth_story,
        key_strengths: aiGenerated.key_strengths,
        milestones,
        metrics: {
          tasks_completed: capability.tasks_completed || 0,
          success_rate: capability.avg_task_quality || 0,
          on_time_rate: capability.on_time_delivery_rate || 0,
          avg_rating: capability.avg_client_satisfaction || 0,
          response_time_hours: 24,
          growth_rate: capability.growth_rate || 0,
        },
        skill_radar: skillRadar,
        tags,
        investment_highlights: aiGenerated.investment_highlights,
      };

      return enhancedProfile;
    } catch (error) {
      logger.error('Error generating enhanced profile:', error);
      throw error;
    }
  }

  /**
   * 获取学生基础信息
   */
  private async getStudentBasicInfo(studentId: string): Promise<Student> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, name, avatar, level, created_at FROM users WHERE id = $1',
        [studentId]
      );

      if (result.rows.length === 0) {
        throw new Error('Student not found');
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * 获取学生能力数据
   */
  private async getStudentCapability(studentId: string): Promise<StudentCapability> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM student_capabilities WHERE student_id = $1',
        [studentId]
      );

      if (result.rows.length === 0) {
        return {
          skills: {},
          tasks_completed: 0,
          avg_task_quality: 0,
          avg_client_satisfaction: 0,
          on_time_delivery_rate: 0,
          quality_trend: 'unknown',
          growth_rate: 0,
        };
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * 获取任务历史
   */
  private async getTaskHistory(studentId: string): Promise<any[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT t.title, t.budget, ts.quality_score, ts.completed_at
         FROM task_submissions ts
         JOIN tasks t ON ts.task_id = t.id
         WHERE ts.student_id = $1 AND ts.status = 'approved'
         ORDER BY ts.completed_at DESC
         LIMIT 10`,
        [studentId]
      );

      return result.rows;
    } catch (error) {
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * 使用AI生成成长故事和亮点
   */
  private async generateGrowthStory(
    student: Student,
    capability: StudentCapability,
    taskHistory: any[]
  ): Promise<{
    headline: string;
    growth_story: string;
    key_strengths: string[];
    investment_highlights: string[];
  }> {
    try {
      const prompt = `你是启程平台的"学生档案分析师"，将学生信息转化为"投资简报"风格的展示。

学生信息：
姓名：${student.name}
等级：Lv${student.level}
加入时间：${student.created_at}
完成任务数：${capability.tasks_completed}
平均质量：${Math.round((capability.avg_task_quality || 0) * 100)}%
按时交付率：${Math.round((capability.on_time_delivery_rate || 0) * 100)}%
成长趋势：${capability.quality_trend}
技能列表：${JSON.stringify(capability.skills)}

最近任务：
${taskHistory.map(t => `- ${t.title} (质量${Math.round((t.quality_score || 0) * 100)}%)`).join('\n')}

请生成"投资简报"风格的内容：

1. headline: 一句话概括这个学生（如"快速成长的全栈新星"、"可靠的UI设计专家"）
2. growth_story: 100字以内的成长故事（突出亮点、成长轨迹、潜力）
3. key_strengths: 3-5个核心优势（简短的关键词或短语）
4. investment_highlights: 3个投资亮点（为什么值得选择这个学生）

以JSON格式返回：
{
  "headline": "...",
  "growth_story": "...",
  "key_strengths": ["优势1", "优势2", "优势3"],
  "investment_highlights": ["亮点1", "亮点2", "亮点3"]
}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse AI response');
    } catch (error) {
      logger.error('Error generating growth story:', error);
      // 返回降级内容
      return {
        headline: `Lv${student.level} 学生`,
        growth_story: `${student.name}已完成${capability.tasks_completed}个任务，表现稳定。`,
        key_strengths: ['经验丰富', '按时交付', '质量可靠'],
        investment_highlights: [
          `完成${capability.tasks_completed}个任务`,
          `质量评分${Math.round((capability.avg_task_quality || 0) * 100)}%`,
          `按时交付率${Math.round((capability.on_time_delivery_rate || 0) * 100)}%`,
        ],
      };
    }
  }

  /**
   * 提取关键里程碑
   */
  private async extractMilestones(studentId: string, taskHistory: any[]): Promise<any[]> {
    const milestones: any[] = [];

    // TODO: 从数据库获取学生的重要事件
    // 这里使用模拟数据
    if (taskHistory.length > 0) {
      milestones.push({
        date: taskHistory[0].completed_at,
        title: '最近完成任务',
        description: taskHistory[0].title,
        impact: '高质量交付',
      });
    }

    return milestones;
  }

  /**
   * 生成技能雷达图数据
   */
  private generateSkillRadar(capability: StudentCapability): Array<{
    skill: string;
    proficiency: number;
    confidence: number;
  }> {
    const skills = capability.skills || {};
    const skillArray = Object.entries(skills).map(([skill, data]: [string, any]) => ({
      skill,
      proficiency: data.proficiency || 0.5,
      confidence: data.confidence || 0.5,
    }));

    // 返回前5个技能
    return skillArray.slice(0, 5);
  }

  /**
   * 生成特色标签
   */
  private generateTags(student: Student, capability: StudentCapability): string[] {
    const tags: string[] = [];

    // 等级标签
    if (student.level >= 5) {
      tags.push('高级学生');
    } else if (student.level >= 3) {
      tags.push('中级学生');
    } else {
      tags.push('新手学生');
    }

    // 质量标签
    if (capability.avg_task_quality >= 0.9) {
      tags.push('质量保证');
    }

    // 按时标签
    if (capability.on_time_delivery_rate >= 0.9) {
      tags.push('准时交付');
    }

    // 成长标签
    if (capability.quality_trend === 'improving') {
      tags.push('快速成长');
    }

    // 经验标签
    if (capability.tasks_completed >= 10) {
      tags.push('经验丰富');
    }

    return tags;
  }

  /**
   * 批量生成增强档案
   */
  async batchGenerateProfiles(studentIds: string[]): Promise<Map<string, EnhancedProfile>> {
    const profiles = new Map<string, EnhancedProfile>();

    for (const studentId of studentIds) {
      try {
        const profile = await this.generateEnhancedProfile(studentId);
        profiles.set(studentId, profile);
      } catch (error) {
        logger.error(`Failed to generate profile for ${studentId}:`, error);
      }
    }

    return profiles;
  }
}

export default new StudentProfileEnhancer();
