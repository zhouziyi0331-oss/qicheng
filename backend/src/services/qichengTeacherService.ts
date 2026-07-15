/**
 * 启程老师翻译服务 - 融合版
 *
 * 融合特点：
 * 1. 保留：心理洞察能力，温暖的语言风格（旧版精华）
 * 2. 整合：决策树快速响应，术语快速翻译（新版精华）
 * 3. 策略：常见情况用决策树（<50ms），复杂情况用AI（保留温暖）
 */

import Anthropic from '@anthropic-ai/sdk';
import { pool, QueryResult } from '../utils/db';
import logger from '../utils/logger';
import { config } from '../../config';

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
  used_decision_tree?: boolean; // 新增：是否使用了决策树
}

/**
 * 启程老师决策树（新增）
 * 快速处理常见的翻译场景，不调用AI
 */
class QichengDecisionTree {

  /**
   * 常见术语快速翻译字典
   */
  private commonTerms: Map<string, string> = new Map([
    // 技术术语
    ['API', 'API接口（程序之间交流的桥梁）'],
    ['前端', '网页界面开发（用户看到的部分）'],
    ['后端', '服务器开发（背后处理数据的部分）'],
    ['数据库', '存储数据的地方'],
    ['UI', '用户界面（看到的按钮、文字等）'],
    ['UX', '用户体验（使用时的感受）'],
    ['响应式', '能自动适应手机和电脑的网页'],
    ['小程序', '微信里打开的轻量应用'],
    ['H5', '手机上看的网页'],

    // AI相关
    ['ChatGPT', 'ChatGPT（AI聊天助手）'],
    ['Midjourney', 'Midjourney（AI画图工具）'],
    ['Prompt', 'Prompt（给AI的指令）'],
    ['训练模型', '训练AI学习能力'],

    // 电商相关
    ['SKU', 'SKU（商品规格，如"红色L码"）'],
    ['转化率', '转化率（有多少人最终购买）'],
    ['跳出率', '跳出率（有多少人看一眼就走了）'],
    ['GMV', 'GMV（总交易额）'],

    // 营销相关
    ['KOL', 'KOL（网红、意见领袖）'],
    ['ROI', 'ROI（投入产出比）'],
    ['私域', '私域（自己的粉丝群）'],
    ['公域', '公域（抖音、小红书等平台流量）'],
  ]);

  /**
   * 快速判断任务是否简单明了
   */
  isSimpleTask(task: Task): boolean {
    const description = (task.description || '').toLowerCase();
    const title = (task.title || '').toLowerCase();

    // 任务描述很短（<100字）且包含明确关键词
    const isShort = description.length < 100;
    const hasClearKeywords = /设计|文案|海报|视频|剪辑|配音|翻译/.test(description + title);

    return isShort && hasClearKeywords;
  }

  /**
   * 快速翻译术语
   */
  translateTerms(text: string): { translated: string; terms: Array<{original: string, translation: string}> } {
    const foundTerms: Array<{original: string, translation: string}> = [];
    let translated = text;

    this.commonTerms.forEach((translation, term) => {
      const regex = new RegExp(term, 'g');
      if (regex.test(text)) {
        foundTerms.push({ original: term, translation });
        // 只在第一次出现时添加解释
        translated = translated.replace(new RegExp(`(${term})(?!（)`, 'g'), translation);
      }
    });

    return { translated, terms: foundTerms };
  }

  /**
   * 快速难度评估（基于关键词规则）
   */
  quickDifficultyAssessment(task: Task): DifficultyAssessment | null {
    const text = `${task.title} ${task.description}`.toLowerCase();

    // 简单任务关键词
    const easyKeywords = ['设计海报', '写文案', '配音', '翻译', '整理资料'];
    // 中等任务关键词
    const mediumKeywords = ['开发小程序', '制作视频', 'H5页面', '数据分析'];
    // 复杂任务关键词
    const hardKeywords = ['系统开发', '架构设计', '算法优化', '大数据处理'];

    const isEasy = easyKeywords.some(kw => text.includes(kw));
    const isMedium = mediumKeywords.some(kw => text.includes(kw));
    const isHard = hardKeywords.some(kw => text.includes(kw));

    if (isEasy) {
      return {
        technical: 3,
        cognitive: 3,
        execution: 4,
        communication: 3,
        overall: 3.2
      };
    }

    if (isMedium) {
      return {
        technical: 6,
        cognitive: 5,
        execution: 6,
        communication: 4,
        overall: 5.5
      };
    }

    if (isHard) {
      return {
        technical: 8,
        cognitive: 8,
        execution: 8,
        communication: 6,
        overall: 7.8
      };
    }

    return null; // 需要AI评估
  }

  /**
   * 快速生成简单任务的翻译
   */
  quickTranslate(task: Task): Partial<TaskTranslation> | null {
    if (!this.isSimpleTask(task)) {
      return null; // 需要AI深度翻译
    }

    // 翻译术语
    const titleTranslation = this.translateTerms(task.title);
    const descTranslation = this.translateTerms(task.description);

    // 快速难度评估
    const difficulty = this.quickDifficultyAssessment(task);

    if (!difficulty) {
      return null; // 难度不确定，需要AI
    }

    // 生成简单的翻译
    return {
      student_friendly_title: titleTranslation.translated,
      student_friendly_description: descTranslation.translated,
      difficulty,
      estimated_hours: task.duration || this.estimateHours(difficulty.overall),
      used_decision_tree: true // 标记使用了决策树
    };
  }

  private estimateHours(difficulty: number): number {
    if (difficulty < 4) return 8;
    if (difficulty < 7) return 20;
    return 40;
  }
}

class QichengTeacherService {
  private anthropic: Anthropic;
  private decisionTree: QichengDecisionTree;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
    this.decisionTree = new QichengDecisionTree();
  }

  /**
   * 分析任务并生成完整翻译（融合版）
   * 策略：先尝试决策树快速响应，复杂任务才调用AI
   */
  async analyzeAndTranslateTask(task: Task): Promise<TaskTranslation> {
    try {
      logger.info(`[启程老师] 分析任务: ${task.id}`);

      // ========== 新增：决策树快速处理 ==========
      const quickResult = this.decisionTree.quickTranslate(task);

      if (quickResult) {
        logger.info(`[启程老师] 使用决策树快速翻译 (<50ms)`);

        // 决策树处理简单任务，补充必要字段
        return {
          task_id: task.id,
          functional_modules: this.generateSimpleModules(task),
          student_friendly_title: quickResult.student_friendly_title!,
          student_friendly_description: quickResult.student_friendly_description!,
          what_you_will_do: this.generateSimpleSteps(task),
          what_you_will_learn: this.generateSimpleLearning(task),
          estimated_hours: quickResult.estimated_hours!,
          required_skills: [],
          difficulty: quickResult.difficulty!,
          learning_value: 0.6,
          career_impact: 0.5,
          used_decision_tree: true
        };
      }

      // ========== 保留：AI深度翻译（复杂任务） ==========
      logger.info(`[启程老师] 复杂任务，使用AI深度翻译（保留心理洞察）`);

      // 使用Claude进行综合分析（保留旧版本的温暖和洞察）
      const analysisPrompt = `你是启程平台的"启程老师"，负责将企业发布的任务翻译成学生容易理解的语言。

你的特点：
1. 心理洞察 - 理解学生的困惑和畏惧
2. 温暖语言 - 用鼓励和理解的语气
3. 具体指导 - 把复杂任务拆解成可执行的步骤

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
        used_decision_tree: false // AI处理
      };

      return translation;
    } catch (error: unknown) {
      logger.error('[启程老师] 翻译失败:', error);
      // 返回降级版本
      return this.createFallbackTranslation(task);
    }
  }

  /**
   * 新增：为简单任务生成模块
   */
  private generateSimpleModules(task: Task): FunctionalModule[] {
    return [{
      module: '主要任务',
      description: task.description || task.title,
      skills: [],
      difficulty: 5
    }];
  }

  /**
   * 新增：为简单任务生成步骤
   */
  private generateSimpleSteps(task: Task): string {
    return '1. 理解任务要求\n2. 准备必要工具\n3. 完成任务内容\n4. 检查和优化\n5. 提交作品';
  }

  /**
   * 新增：为简单任务生成学习内容
   */
  private generateSimpleLearning(task: Task): string {
    return '通过这个任务，你将积累实战经验，提升相关技能，并建立作品集。';
  }

  /**
   * 计算综合难度（保留旧版）
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
   * 创建降级翻译（当AI失败时）（保留旧版）
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
      used_decision_tree: false
    };
  }

  // ========== 以下保留旧版本的所有方法 ==========

  /**
   * 拆解功能模块（保留旧版）
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
    } catch (error: unknown) {
      logger.error('Error breaking down functional modules:', error);
      return [];
    }
  }

  /**
   * 简化任务描述（保留旧版）
   */
  async simplifyDescription(taskDescription: string): Promise<string> {
    try {
      const prompt = `请将以下任务描述改写为学生容易理解的语言：

原描述：${taskDescription}

要求：
1. 去掉专业术语或解释术语
2. 用通俗易懂的语言
3. 保持核心意思不变`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        return taskDescription;
      }

      return content.text.trim();
    } catch (error: unknown) {
      logger.error('Error simplifying description:', error);
      return taskDescription;
    }
  }

  /**
   * 评估任务难度（保留旧版）
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
    } catch (error: unknown) {
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
   * 提取技能要求（保留旧版）
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
    } catch (error: unknown) {
      logger.error('Error extracting skill requirements:', error);
      return [];
    }
  }

  /**
   * 保存翻译到数据库（保留旧版）
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

      logger.info(`[启程老师] 已保存翻译: ${translation.task_id} ${translation.used_decision_tree ? '(决策树)' : '(AI)'}`);
    } catch (error: unknown) {
      logger.error('[启程老师] 保存翻译失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取任务翻译（保留旧版）
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
   * 为任务创建并保存翻译（保留旧版）
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

      // 生成翻译（使用融合版的策略）
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
