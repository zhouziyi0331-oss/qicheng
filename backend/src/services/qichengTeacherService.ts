/**
 * 启程老师翻译服务
 * 将企业任务翻译为学生易懂的语言
 * 拆解功能模块，评估难度，提取技能要求
 */

import Anthropic from '@anthropic-ai/sdk';
import { pool } from '../utils/db';
import logger from '../utils/logger';
import config from '../config';

interface Task {
  id: string;
  title: string;
  description: string;
  required_skills?: any;
  budget?: number;
  duration?: number;
}

interface FunctionalModule {
  module: string;
  description: string;
  skills: string[];
  difficulty: number;
}

interface SkillRequirement {
  skill: string;
  proficiency: number;
  weight: number;
  why: string;
}

interface DifficultyAssessment {
  technical: number;
  cognitive: number;
  execution: number;
  communication: number;
  overall: number;
}

interface TaskTranslation {
  task_id: string;
  functional_modules: FunctionalModule[];
  student_friendly_title: string;
  student_friendly_description: string;
  what_you_will_do: string;
  what_you_will_learn: string;
  estimated_hours: number;
  required_skills: SkillRequirement[];
  difficulty: DifficultyAssessment;
  learning_value: number;
  career_impact: number;
}

class QichengTeacherService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: config.anthropicApiKey,
    });
  }

  /**
   * 分析任务并生成完整翻译
   */
  async analyzeAndTranslateTask(task: Task): Promise<TaskTranslation> {
    try {
      logger.info(`Analyzing and translating task: ${task.id}`);

      // 使用Claude进行综合分析
      const analysisPrompt = `你是启程平台的"启程老师"，负责将企业发布的任务翻译成学生容易理解的语言。

企业任务信息：
标题：${task.title}
描述：${task.description}
预算：${task.budget || '未指定'}元
工期：${task.duration || '未指定'}小时

请完成以下分析任务，以JSON格式返回：

1. **功能模块拆解** (functionalModules)：将任务拆解为3-5个具体的功能模块，每个模块包含：
   - module: 模块名称（简短清晰）
   - description: 模块描述（学生能懂的语言）
   - skills: 需要的技能列表
   - difficulty: 难度评分(1-10)

2. **学生友好描述** (studentFriendly)：
   - title: 重写标题，去掉专业术语
   - description: 用通俗易懂的语言重新描述任务
   - whatYouWillDo: "你需要做什么"（分3-5个步骤）
   - whatYouWillLearn: "你会学到什么"（列出具体技能和经验）

3. **技能要求** (skillRequirements)：列出需要的技能，每个技能包含：
   - skill: 技能名称
   - proficiency: 所需熟练度(0-1)
   - weight: 重要性权重(0-1)
   - why: 为什么需要这个技能

4. **难度评估** (difficulty)：评估4个维度的难度(1-10)：
   - technical: 技术难度
   - cognitive: 认知难度（理解复杂度）
   - execution: 执行难度（工作量）
   - communication: 沟通难度

5. **成长价值** (growth)：
   - learningValue: 学习价值(0-1)
   - careerImpact: 职业影响(0-1)
   - estimatedHours: 预估工作时长

请返回完整的JSON对象。`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: analysisPrompt,
        }],
        temperature: 0.7,
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

      const analysis = JSON.parse(jsonMatch[0]);

      // 构建TaskTranslation对象
      const translation: TaskTranslation = {
        task_id: task.id,
        functional_modules: analysis.functionalModules || [],
        student_friendly_title: analysis.studentFriendly?.title || task.title,
        student_friendly_description: analysis.studentFriendly?.description || task.description,
        what_you_will_do: analysis.studentFriendly?.whatYouWillDo || '',
        what_you_will_learn: analysis.studentFriendly?.whatYouWillLearn || '',
        estimated_hours: analysis.growth?.estimatedHours || task.duration || 40,
        required_skills: analysis.skillRequirements || [],
        difficulty: {
          technical: analysis.difficulty?.technical || 5,
          cognitive: analysis.difficulty?.cognitive || 5,
          execution: analysis.difficulty?.execution || 5,
          communication: analysis.difficulty?.communication || 5,
          overall: this.calculateOverallDifficulty(analysis.difficulty),
        },
        learning_value: analysis.growth?.learningValue || 0.5,
        career_impact: analysis.growth?.careerImpact || 0.5,
      };

      return translation;
    } catch (error) {
      logger.error('Error analyzing and translating task:', error);
      // 返回降级版本
      return this.createFallbackTranslation(task);
    }
  }

  /**
   * 计算综合难度
   */
  private calculateOverallDifficulty(difficulty: any): number {
    if (!difficulty) return 5;

    const tech = difficulty.technical || 5;
    const cog = difficulty.cognitive || 5;
    const exec = difficulty.execution || 5;
    const comm = difficulty.communication || 5;

    // 加权平均：技术40%，认知30%，执行20%，沟通10%
    return tech * 0.4 + cog * 0.3 + exec * 0.2 + comm * 0.1;
  }

  /**
   * 创建降级翻译（当AI失败时）
   */
  private createFallbackTranslation(task: Task): TaskTranslation {
    return {
      task_id: task.id,
      functional_modules: [{
        module: '主要功能',
        description: task.description || task.title,
        skills: [],
        difficulty: 5,
      }],
      student_friendly_title: task.title,
      student_friendly_description: task.description || task.title,
      what_you_will_do: '完成任务要求的功能开发',
      what_you_will_learn: '积累项目经验，提升技能水平',
      estimated_hours: task.duration || 40,
      required_skills: [],
      difficulty: {
        technical: 5,
        cognitive: 5,
        execution: 5,
        communication: 5,
        overall: 5,
      },
      learning_value: 0.5,
      career_impact: 0.5,
    };
  }

  /**
   * 拆解功能模块
   */
  async breakdownFunctionalModules(taskDescription: string): Promise<FunctionalModule[]> {
    try {
      const prompt = `请将以下任务拆解为3-5个功能模块：

任务描述：${taskDescription}

每个模块包含：
- module: 模块名称
- description: 模块描述
- skills: 需要的技能
- difficulty: 难度(1-10)

以JSON数组格式返回：[{...}]`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        return [];
      }

      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];
    } catch (error) {
      logger.error('Error breaking down functional modules:', error);
      return [];
    }
  }

  /**
   * 生成学生友好描述
   */
  async generateStudentFriendlyDescription(task: Task): Promise<string> {
    try {
      const prompt = `请用学生容易理解的语言重新描述这个任务，去掉专业术语：

原始描述：${task.description}

要求：
- 使用通俗易懂的语言
- 避免技术黑话
- 说明实际要做什么
- 不超过200字`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text.trim();
      }

      return task.description;
    } catch (error) {
      logger.error('Error generating student friendly description:', error);
      return task.description;
    }
  }

  /**
   * 评估任务难度
   */
  async assessTaskDifficulty(task: Task): Promise<DifficultyAssessment> {
    try {
      const prompt = `请评估以下任务的难度（1-10分）：

任务：${task.title}
描述：${task.description}

评估4个维度：
1. technical: 技术难度
2. cognitive: 认知难度（理解复杂度）
3. execution: 执行难度（工作量）
4. communication: 沟通难度

以JSON格式返回：{"technical": X, "cognitive": X, "execution": X, "communication": X}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const difficulty = JSON.parse(jsonMatch[0]);
        return {
          technical: difficulty.technical || 5,
          cognitive: difficulty.cognitive || 5,
          execution: difficulty.execution || 5,
          communication: difficulty.communication || 5,
          overall: this.calculateOverallDifficulty(difficulty),
        };
      }

      throw new Error('Failed to parse difficulty JSON');
    } catch (error) {
      logger.error('Error assessing task difficulty:', error);
      return {
        technical: 5,
        cognitive: 5,
        execution: 5,
        communication: 5,
        overall: 5,
      };
    }
  }

  /**
   * 提取技能要求
   */
  async extractSkillRequirements(task: Task): Promise<SkillRequirement[]> {
    try {
      const prompt = `从以下任务中提取所需技能：

任务：${task.title}
描述：${task.description}

对每个技能评估：
- skill: 技能名称
- proficiency: 所需熟练度(0-1)
- weight: 重要性权重(0-1)
- why: 为什么需要这个技能

以JSON数组格式返回：[{...}]`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        return [];
      }

      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];
    } catch (error) {
      logger.error('Error extracting skill requirements:', error);
      return [];
    }
  }

  /**
   * 保存翻译到数据库
   */
  async saveTranslation(translation: TaskTranslation): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO task_translations (
          task_id, functional_modules, student_friendly_title,
          student_friendly_description, what_you_will_do, what_you_will_learn,
          estimated_hours, required_skills,
          difficulty_technical, difficulty_cognitive, difficulty_execution,
          difficulty_communication, difficulty_overall,
          learning_value, career_impact
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (task_id) DO UPDATE SET
          functional_modules = EXCLUDED.functional_modules,
          student_friendly_title = EXCLUDED.student_friendly_title,
          student_friendly_description = EXCLUDED.student_friendly_description,
          what_you_will_do = EXCLUDED.what_you_will_do,
          what_you_will_learn = EXCLUDED.what_you_will_learn,
          estimated_hours = EXCLUDED.estimated_hours,
          required_skills = EXCLUDED.required_skills,
          difficulty_technical = EXCLUDED.difficulty_technical,
          difficulty_cognitive = EXCLUDED.difficulty_cognitive,
          difficulty_execution = EXCLUDED.difficulty_execution,
          difficulty_communication = EXCLUDED.difficulty_communication,
          difficulty_overall = EXCLUDED.difficulty_overall,
          learning_value = EXCLUDED.learning_value,
          career_impact = EXCLUDED.career_impact,
          updated_at = NOW()`,
        [
          translation.task_id,
          JSON.stringify(translation.functional_modules),
          translation.student_friendly_title,
          translation.student_friendly_description,
          translation.what_you_will_do,
          translation.what_you_will_learn,
          translation.estimated_hours,
          JSON.stringify(translation.required_skills),
          translation.difficulty.technical,
          translation.difficulty.cognitive,
          translation.difficulty.execution,
          translation.difficulty.communication,
          translation.difficulty.overall,
          translation.learning_value,
          translation.career_impact,
        ]
      );

      logger.info(`Saved translation for task: ${translation.task_id}`);
    } catch (error) {
      logger.error('Error saving translation:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取任务翻译
   */
  async getTranslation(taskId: string): Promise<TaskTranslation | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM task_translations WHERE task_id = $1',
        [taskId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];

      return {
        task_id: row.task_id,
        functional_modules: row.functional_modules,
        student_friendly_title: row.student_friendly_title,
        student_friendly_description: row.student_friendly_description,
        what_you_will_do: row.what_you_will_do,
        what_you_will_learn: row.what_you_will_learn,
        estimated_hours: row.estimated_hours,
        required_skills: row.required_skills,
        difficulty: {
          technical: row.difficulty_technical,
          cognitive: row.difficulty_cognitive,
          execution: row.difficulty_execution,
          communication: row.difficulty_communication,
          overall: row.difficulty_overall,
        },
        learning_value: row.learning_value,
        career_impact: row.career_impact,
      };
    } finally {
      client.release();
    }
  }

  /**
   * 为任务创建并保存翻译
   */
  async translateTask(taskId: string): Promise<TaskTranslation> {
    const client = await pool.connect();
    try {
      // 获取任务信息
      const taskResult = await client.query(
        'SELECT id, title, description, budget, duration FROM tasks WHERE id = $1',
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const task = taskResult.rows[0];

      // 生成翻译
      const translation = await this.analyzeAndTranslateTask(task);

      // 保存到数据库
      await this.saveTranslation(translation);

      return translation;
    } finally {
      client.release();
    }
  }
}

export default new QichengTeacherService();
