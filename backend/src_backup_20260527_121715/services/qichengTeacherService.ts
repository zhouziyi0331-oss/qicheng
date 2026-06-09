import Anthropic from '@anthropic-ai/sdk';
import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface FunctionalModule {
  module: string;
  description: string;
  skills: string[];
  difficulty: number;
  estimatedHours: number;
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
  taskId: string;
  functionalModules: FunctionalModule[];
  studentFriendlyTitle: string;
  studentFriendlyDescription: string;
  whatYouWillDo: string;
  whatYouWillLearn: string;
  estimatedHours: number;
  requiredSkills: SkillRequirement[];
  difficulty: DifficultyAssessment;
  learningValue: number;
  careerImpact: number;
}

/**
 * 启程老师翻译服务
 * AI理解企业任务，翻译成学生能懂的语言
 */
class QichengTeacherService {
  /**
   * 需求翻译：理解企业的真实需求
   *
   * 企业说"我们要一个酷炫的H5"
   * 真实需求："我们下周要见投资人，需要一个能在手机上展示、
   *           让人眼前一亮的东西，证明我们团队有技术实力"
   */
  async translateRequirement(taskId: string): Promise<string> {
    try {
      const task = await queryOne<{
        title: string;
        description: string;
        company_id: string;
      }>(
        `SELECT title, description, company_id FROM tasks WHERE id = $1`,
        [taskId]
      );

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // 获取企业背景信息
      const company = await queryOne<{
        username: string;
        company_name: string;
        industry: string;
      }>(
        `SELECT username, company_name, industry FROM users WHERE id = $1`,
        [task.company_id]
      );

      const prompt = `你是"启程老师"，一位经验丰富的项目导师。你的任务是理解企业的真实需求。

## 企业原始需求

**企业名称**: ${company?.company_name || company?.username || '未知'}
**行业**: ${company?.industry || '未知'}
**任务标题**: ${task.title}
**任务描述**: ${task.description}

## 你的任务

企业往往说不清楚自己真正要什么。你需要：

1. **挖掘言外之意**：企业说"酷炫的H5"，可能真正需要的是"投资人演示用的产品展示页"
2. **澄清模糊表述**：把"感觉要高级一点"翻译成具体的设计要求
3. **补充缺失信息**：如果企业没说交付时间、使用场景，根据常识推测并标注

请生成一段翻译后的需求描述（200字左右），包含：
- 真实目的（为什么要做这个）
- 具体要求（做成什么样）
- 使用场景（在哪里用、给谁看）
- 交付标准（怎样算完成）

直接返回翻译后的需求描述，不要其他解释：`;

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const translatedRequirement = content.text.trim();

      logger.info(`Translated requirement for task ${taskId}`);

      return translatedRequirement;
    } catch (error) {
      logger.error(`Failed to translate requirement for task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 分析并翻译任务（完整版）
   */
  async analyzeAndTranslateTask(taskId: string): Promise<TaskTranslation> {
    try {
      // 获取任务信息
      const task = await queryOne<{
        id: string;
        title: string;
        description: string;
        required_skills: string[];
        track_type: string;
        level_required: string;
        budget_min: number;
        budget_max: number;
      }>(
        `SELECT id, title, description, required_skills, track_type, level_required,
                budget_min, budget_max
         FROM tasks WHERE id = $1`,
        [taskId]
      );

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // 使用Claude分析任务
      const analysisPrompt = `你是"启程老师"，一位经验丰富的项目导师。你的任务是帮助学生理解企业发布的项目需求。

## 企业任务信息
标题: ${task.title}
描述: ${task.description}
要求技能: ${task.required_skills?.join(', ') || '未指定'}
任务类型: ${task.track_type}
难度等级: ${task.level_required}
预算范围: ${task.budget_min}-${task.budget_max}元

## 你需要完成以下分析

### 1. 功能模块拆解
将任务拆解成3-5个具体的功能模块，每个模块包含：
- module: 模块名称（简短）
- description: 模块描述（学生能懂的语言）
- skills: 需要的技能列表
- difficulty: 难度评分（1-10）
- estimatedHours: 预计工作时间（小时）

### 2. 学生友好标题
将企业的专业术语转化为学生能理解的标题（20字以内）

### 3. 学生友好描述
用通俗易懂的语言重新描述任务（100-200字）

### 4. 你需要做什么
分步骤说明学生需要完成的具体工作（3-5个步骤）

### 5. 你会学到什么
列出学生能从这个任务中学到的技能和知识（3-5点）

### 6. 预计工作时间
估算完成整个任务需要的总时间（小时）

### 7. 技能要求详解
对每个要求的技能进行详细说明：
- skill: 技能名称
- proficiency: 需要的熟练度（0-1）
- weight: 重要程度（0-1）
- why: 为什么需要这个技能

### 8. 难度评估
从4个维度评估难度（1-10分）：
- technical: 技术难度
- cognitive: 认知难度（理解复杂度）
- execution: 执行难度（实现复杂度）
- communication: 沟通难度
- overall: 综合难度

### 9. 成长价值
- learningValue: 学习价值（0-1）
- careerImpact: 职业影响力（0-1）

请以JSON格式返回分析结果，不要包含其他解释文字：
{
  "functionalModules": [...],
  "studentFriendlyTitle": "...",
  "studentFriendlyDescription": "...",
  "whatYouWillDo": "...",
  "whatYouWillLearn": "...",
  "estimatedHours": 20,
  "requiredSkills": [...],
  "difficulty": {...},
  "learningValue": 0.8,
  "careerImpact": 0.7
}`;

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: analysisPrompt
        }]
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

      const translation: TaskTranslation = {
        taskId: task.id,
        functionalModules: analysis.functionalModules || [],
        studentFriendlyTitle: analysis.studentFriendlyTitle || task.title,
        studentFriendlyDescription: analysis.studentFriendlyDescription || task.description,
        whatYouWillDo: analysis.whatYouWillDo || '',
        whatYouWillLearn: analysis.whatYouWillLearn || '',
        estimatedHours: analysis.estimatedHours || 20,
        requiredSkills: analysis.requiredSkills || [],
        difficulty: analysis.difficulty || {
          technical: 5,
          cognitive: 5,
          execution: 5,
          communication: 5,
          overall: 5
        },
        learningValue: analysis.learningValue || 0.5,
        careerImpact: analysis.careerImpact || 0.5
      };

      // 保存翻译结果到数据库
      await this.saveTranslation(translation);

      logger.info(`Generated translation for task ${taskId}`);

      return translation;
    } catch (error) {
      logger.error(`Failed to analyze and translate task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * 拆解功能模块
   */
  async breakdownFunctionalModules(taskDescription: string): Promise<FunctionalModule[]> {
    try {
      const prompt = `请将以下任务描述拆解成3-5个具体的功能模块：

任务描述：
${taskDescription}

每个模块包含：
- module: 模块名称
- description: 模块描述
- skills: 需要的技能
- difficulty: 难度（1-10）
- estimatedHours: 预计时间

返回JSON数组格式：
[
  {
    "module": "用户登录",
    "description": "实现用户注册和登录功能",
    "skills": ["React", "JWT"],
    "difficulty": 3,
    "estimatedHours": 8
  }
]`;

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse modules from Claude response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error('Failed to breakdown functional modules:', error);
      return [];
    }
  }

  /**
   * 生成学生友好描述
   */
  async generateStudentFriendlyDescription(taskTitle: string, taskDescription: string): Promise<string> {
    try {
      const prompt = `请将以下企业任务描述转化为学生能理解的通俗语言（100-200字）：

标题: ${taskTitle}
描述: ${taskDescription}

要求：
1. 避免专业术语，用简单的语言
2. 说明任务的目标和价值
3. 让学生能快速理解要做什么

直接返回翻译后的描述，不要其他内容：`;

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return content.text.trim();
    } catch (error) {
      logger.error('Failed to generate student friendly description:', error);
      return taskDescription;
    }
  }

  /**
   * 评估任务难度
   */
  async assessTaskDifficulty(task: {
    title: string;
    description: string;
    required_skills: string[];
    level_required: string;
  }): Promise<DifficultyAssessment> {
    try {
      const prompt = `请评估以下任务的难度（1-10分）：

标题: ${task.title}
描述: ${task.description}
要求技能: ${task.required_skills?.join(', ') || '未指定'}
难度等级: ${task.level_required}

从4个维度评估：
1. technical: 技术难度（需要的技术深度和广度）
2. cognitive: 认知难度（理解和设计的复杂度）
3. execution: 执行难度（实现的工作量和复杂度）
4. communication: 沟通难度（与客户沟通的难度）
5. overall: 综合难度

返回JSON格式：
{
  "technical": 6,
  "cognitive": 5,
  "execution": 7,
  "communication": 4,
  "overall": 6
}`;

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse difficulty from Claude response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error('Failed to assess task difficulty:', error);
      return {
        technical: 5,
        cognitive: 5,
        execution: 5,
        communication: 5,
        overall: 5
      };
    }
  }

  /**
   * 提取技能要求
   */
  async extractSkillRequirements(task: {
    title: string;
    description: string;
    required_skills: string[];
  }): Promise<SkillRequirement[]> {
    try {
      const prompt = `请分析以下任务的技能要求：

标题: ${task.title}
描述: ${task.description}
明确要求的技能: ${task.required_skills?.join(', ') || '未指定'}

对每个技能进行详细说明：
- skill: 技能名称
- proficiency: 需要的熟练度（0-1，0.5表示中等，0.8表示熟练）
- weight: 重要程度（0-1）
- why: 为什么需要这个技能（一句话）

返回JSON数组：
[
  {
    "skill": "React",
    "proficiency": 0.7,
    "weight": 0.4,
    "why": "需要构建用户界面"
  }
]`;

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse skills from Claude response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error('Failed to extract skill requirements:', error);
      return [];
    }
  }

  /**
   * 保存翻译结果到数据库
   */
  private async saveTranslation(translation: TaskTranslation): Promise<void> {
    try {
      await query(
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
          translation.taskId,
          JSON.stringify(translation.functionalModules),
          translation.studentFriendlyTitle,
          translation.studentFriendlyDescription,
          translation.whatYouWillDo,
          translation.whatYouWillLearn,
          translation.estimatedHours,
          JSON.stringify(translation.requiredSkills),
          translation.difficulty.technical,
          translation.difficulty.cognitive,
          translation.difficulty.execution,
          translation.difficulty.communication,
          translation.difficulty.overall,
          translation.learningValue,
          translation.careerImpact
        ]
      );

      logger.info(`Saved translation for task ${translation.taskId}`);
    } catch (error) {
      logger.error(`Failed to save translation for task ${translation.taskId}:`, error);
      throw error;
    }
  }

  /**
   * 获取任务翻译
   */
  async getTaskTranslation(taskId: string): Promise<TaskTranslation | null> {
    try {
      const translation = await queryOne<{
        task_id: string;
        functional_modules: any;
        student_friendly_title: string;
        student_friendly_description: string;
        what_you_will_do: string;
        what_you_will_learn: string;
        estimated_hours: number;
        required_skills: any;
        difficulty_technical: number;
        difficulty_cognitive: number;
        difficulty_execution: number;
        difficulty_communication: number;
        difficulty_overall: number;
        learning_value: number;
        career_impact: number;
      }>(
        `SELECT * FROM task_translations WHERE task_id = $1`,
        [taskId]
      );

      if (!translation) {
        return null;
      }

      return {
        taskId: translation.task_id,
        functionalModules: translation.functional_modules,
        studentFriendlyTitle: translation.student_friendly_title,
        studentFriendlyDescription: translation.student_friendly_description,
        whatYouWillDo: translation.what_you_will_do,
        whatYouWillLearn: translation.what_you_will_learn,
        estimatedHours: translation.estimated_hours,
        requiredSkills: translation.required_skills,
        difficulty: {
          technical: translation.difficulty_technical,
          cognitive: translation.difficulty_cognitive,
          execution: translation.difficulty_execution,
          communication: translation.difficulty_communication,
          overall: translation.difficulty_overall
        },
        learningValue: translation.learning_value,
        careerImpact: translation.career_impact
      };
    } catch (error) {
      logger.error(`Failed to get task translation for ${taskId}:`, error);
      return null;
    }
  }
  /**
   * 生成项目需求摘要（与学生画像摘要结构对应）
   *
   * 核心原则：这段摘要将被转成1024维向量，必须和学生画像摘要在同一个语义层次上对话
   */
  async generateProjectRequirementSummary(taskId: string): Promise<string> {
    try {
      const task = await queryOne<{
        title: string;
        description: string;
        required_skills: string[];
        track_type: string;
        level_required: string;
        budget_min: number;
        budget_max: number;
        delivery_days: number;
      }>(
        `SELECT title, description, required_skills, track_type, level_required,
                budget_min, budget_max, delivery_days
         FROM tasks WHERE id = $1`,
        [taskId]
      );

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // 获取企业信息
      const company = await queryOne<{
        company_name: string;
        industry: string;
      }>(
        `SELECT u.company_name, u.industry
         FROM tasks t
         JOIN users u ON t.company_id = u.id
         WHERE t.id = $1`,
        [taskId]
      );

      const prompt = `你是启程平台的AI。请根据企业发布的项目信息，生成一段结构化的项目需求摘要。

## 核心原则
这段摘要将被转成1024维向量，用于和学生能力画像向量做语义匹配。所以必须和学生画像摘要的结构对应，在同一个语义层次上对话。

## 必需结构（严格按此顺序，与学生画像摘要镜像对应）

需求类型：[从项目赛道和交付物类型提取，如"品牌视觉升级，需要图片/视频交付"]
工作风格匹配：[从项目特点提取，如"需要先从整体调性出发，再拆解到具体物料"]
创作偏好匹配：[从项目审美要求提取，如"需要强视觉表现力，能通过画面传递品牌情绪"]
工具习惯匹配：[从项目技术需求提取，如"使用AI生图工具即可，不需要写代码"]
执行节奏匹配：[从项目周期提取，如"周期2周，需要先出概念稿确认方向再细化"]
协作倾向匹配：[从项目管理方式提取，如"需求方给方向，具体执行由接单者独立完成"]
风险偏好匹配：[从项目确定性提取，如"方向明确，有参考案例，属于有挑战但不失控的项目"]
标签：[如"品牌视觉""社交媒体""创意广告"]

## 项目信息

**企业背景**：
- 企业名称：${company?.company_name || '未知'}
- 所属行业：${company?.industry || '未知'}

**项目详情**：
- 标题：${task.title}
- 描述：${task.description}
- 要求技能：${task.required_skills?.join('、') || '未指定'}
- 项目类型：${task.track_type}
- 难度等级：${task.level_required}
- 预算：${task.budget_min}-${task.budget_max}元
- 交付周期：${task.delivery_days || '未指定'}天

## 示例（仅供参考结构）

需求类型：品牌视觉升级，需要图片和视频交付。
工作风格匹配：需要先从整体品牌调性出发，再拆解到具体物料。
创作偏好匹配：需要强视觉表现力，能通过画面传递品牌情绪。
工具习惯匹配：使用AI生图工具即可完成，不需要代码能力。
执行节奏匹配：周期2周，建议先出概念稿确认方向，再细化。
协作倾向匹配：需求方给出品牌手册和方向，具体创意执行由接单者独立完成。
风险偏好匹配：方向明确，有参考案例，属于有挑战但不失控的项目。
标签：品牌视觉、社交媒体、创意广告。

请严格按照上述结构生成摘要（约200字），每个维度用一句话描述：`;

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const summary = content.text.trim();

      logger.info(`Generated requirement summary for task ${taskId}`);

      return summary;
    } catch (error) {
      logger.error(`Failed to generate requirement summary for task ${taskId}:`, error);
      throw error;
    }
  }
}

export default new QichengTeacherService();
