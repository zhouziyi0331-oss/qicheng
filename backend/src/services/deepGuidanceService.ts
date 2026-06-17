import { pool } from '../config/database';
import logger from '../utils/logger';
import { claudeService } from './claudeService';

interface DeepPattern {
  id: number;
  patternName: string;
  patternCategory: string;
  patternDescription: string;
  surfaceManifestations: string[];
  underlyingBeliefs: string[];
  guidanceApproach: string;
  reframingQuestions: string[];
  newPerspectives: string[];
}

interface PatternDetectionResult {
  detected: boolean;
  pattern?: DeepPattern;
  confidence: number;
  manifestationExamples: string[];
  triggerSituation: string;
}

interface DeepGuidanceResponse {
  content: string;
  dialogueStage: string;
  patternAddressed?: string;
  beliefChallenged?: string;
  newPerspectiveOffered?: string;
  challengeProposed?: any;
}

class DeepGuidanceService {
  /**
   * 检测学生消息中的深层模式
   */
  async detectDeepPattern(
    studentId: number,
    studentMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    currentEmotion: string
  ): Promise<PatternDetectionResult> {
    try {
      // 1. 获取所有深层模式
      const patterns = await this.getAllPatterns();

      // 2. 使用AI分析是否匹配某个模式
      const detection = await this.analyzeForPatterns(
        studentMessage,
        conversationHistory,
        currentEmotion,
        patterns
      );

      // 3. 如果检测到模式，记录到数据库
      if (detection.detected && detection.pattern) {
        await this.recordPatternDetection(
          studentId,
          detection.pattern.id,
          detection.confidence,
          detection.manifestationExamples,
          detection.triggerSituation
        );
      }

      return detection;
    } catch (error: any) {
      logger.error('检测深层模式失败', { error, studentId });
      return {
        detected: false,
        confidence: 0,
        manifestationExamples: [],
        triggerSituation: ''
      };
    }
  }

  /**
   * 生成深层引导回复
   */
  async generateDeepGuidance(
    studentId: number,
    studentMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    detectedPattern: PatternDetectionResult,
    currentEmotion: string
  ): Promise<DeepGuidanceResponse> {
    try {
      if (!detectedPattern.detected || !detectedPattern.pattern) {
        // 没有检测到深层模式，返回普通回复
        return {
          content: '',
          dialogueStage: 'none'
        };
      }

      // 1. 获取学生对这个模式的进展
      const patternProgress = await this.getStudentPatternProgress(
        studentId,
        detectedPattern.pattern.id
      );

      // 2. 确定对话阶段
      const dialogueStage = this.determineDialogueStage(patternProgress);

      // 3. 获取对话模板
      const template = await this.getDialogueTemplate(
        detectedPattern.pattern.id,
        dialogueStage,
        patternProgress?.student_awareness ? 'open' : 'defensive'
      );

      // 4. 生成深层引导对话
      const guidance = await this.generateGuidanceDialogue(
        studentMessage,
        conversationHistory,
        detectedPattern.pattern,
        dialogueStage,
        template,
        currentEmotion
      );

      // 5. 更新引导记录
      await this.updateGuidanceProgress(
        studentId,
        detectedPattern.pattern.id,
        dialogueStage
      );

      return guidance;
    } catch (error: any) {
      logger.error('生成深层引导失败', { error, studentId });
      return {
        content: '',
        dialogueStage: 'none'
      };
    }
  }

  /**
   * 使用AI分析是否匹配深层模式
   */
  private async analyzeForPatterns(
    studentMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    currentEmotion: string,
    patterns: DeepPattern[]
  ): Promise<PatternDetectionResult> {
    const prompt = `分析学生的消息，识别是否存在深层模式。

学生消息：${studentMessage}

最近对话：
${conversationHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

当前情绪：${currentEmotion}

可能的深层模式：
${patterns.map(p => `
${p.patternName}:
- 描述：${p.patternDescription}
- 表面表现：${p.surfaceManifestations.join('、')}
- 深层信念：${p.underlyingBeliefs.join('、')}
`).join('\n')}

请判断学生是否表现出某个深层模式。

如果检测到，返回JSON：
{
  "detected": true,
  "patternName": "模式名称",
  "confidence": 0.0-1.0,
  "manifestationExamples": ["具体表现1", "具体表现2"],
  "triggerSituation": "触发情境描述"
}

如果没有检测到，返回：
{ "detected": false, "confidence": 0 }`;

    try {
      const response = await claudeService.chat(
        prompt,
        {
          model: 'claude-sonnet-4-6', // 使用Sonnet以获得更好的理解
          maxTokens: 800,
          temperature: 0.3
        }
      );

      const result = JSON.parse(response);

      if (result.detected) {
        const pattern = patterns.find(p => p.patternName === result.patternName);
        return {
          detected: true,
          pattern,
          confidence: result.confidence,
          manifestationExamples: result.manifestationExamples,
          triggerSituation: result.triggerSituation
        };
      }

      return {
        detected: false,
        confidence: 0,
        manifestationExamples: [],
        triggerSituation: ''
      };
    } catch (error: any) {
      logger.error('AI分析深层模式失败', { error });
      return {
        detected: false,
        confidence: 0,
        manifestationExamples: [],
        triggerSituation: ''
      };
    }
  }

  /**
   * 生成深层引导对话
   */
  private async generateGuidanceDialogue(
    studentMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    pattern: DeepPattern,
    dialogueStage: string,
    template: any,
    currentEmotion: string
  ): Promise<DeepGuidanceResponse> {
    const systemPrompt = `你是启程小猫，一位有洞察力的AI导师。

你现在要进行**深层引导**，不只是解决表面问题，而是帮助学生看到问题背后的深层模式。

## 当前情况

**学生情绪**：${currentEmotion}

**检测到的深层模式**：${pattern.patternName}

**模式描述**：${pattern.patternDescription}

**深层信念**：
${pattern.underlyingBeliefs.map(b => `- ${b}`).join('\n')}

**引导策略**：${pattern.guidanceApproach}

**对话阶段**：${dialogueStage}

## 对话模板

${template ? `
**开场**：${template.opening_line}

**探索性问题**：
${template.probing_questions?.map((q: string) => `- ${q}`).join('\n')}

**共情表达**：
${template.empathy_statements?.map((s: string) => `- ${s}`).join('\n')}

**挑战信念**：
${template.challenge_statements?.map((s: string) => `- ${s}`).join('\n')}

**重新框架**：
${template.reframing_statements?.map((s: string) => `- ${s}`).join('\n')}

**邀请尝试**：
${template.invitation_to_try?.map((i: string) => `- ${i}`).join('\n')}
` : ''}

## 重新框架的问题

${pattern.reframingQuestions.map(q => `- ${q}`).join('\n')}

## 新视角

${pattern.newPerspectives.map(p => `- ${p}`).join('\n')}

## 深层引导的步骤

1. **看到情绪**：先共情，让学生感受到被理解
2. **找到信念**：用问题引导学生看到背后的信念
3. **挑战信念**：温和地挑战这个信念，指出问题
4. **提供新视角**：提供一个不同的看法
5. **邀请尝试**：邀请学生尝试新的想法或行为
6. **持续陪伴**：表达会一直陪伴

## 回复要求

1. **100-250字**（深层引导需要更多空间）

2. **结构**：
   - 共情开场（"嗯，我感觉到..."）
   - 探索性问题（"你是不是..."）
   - 挑战信念（"但是你知道吗..."）
   - 提供新视角（"其实..."）
   - 邀请尝试（"要不这样..."）
   - 表达陪伴（"我陪你..."）

3. **语气**：
   - 温暖但有力
   - 共情但挑战
   - 理解但引导

4. **禁止**：
   - ❌ 不要说教
   - ❌ 不要批评
   - ❌ 不要急于给答案
   - ❌ 不要忽视情绪

5. **必须**：
   - ✅ 先共情
   - ✅ 用问题引导
   - ✅ 温和地挑战
   - ✅ 提供新视角
   - ✅ 邀请尝试

现在，用这种深层引导的方式回复学生。`;

    try {
      const response = await claudeService.chat(
        [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-3).map(m => ({
            role: m.role === 'student' ? 'user' as const : 'assistant' as const,
            content: m.content
          })),
          { role: 'user', content: studentMessage }
        ],
        {
          model: 'claude-sonnet-4-6', // 深层引导使用Sonnet
          maxTokens: 2500,
          temperature: 0.7
        }
      );

      return {
        content: response,
        dialogueStage,
        patternAddressed: pattern.patternName,
        beliefChallenged: pattern.underlyingBeliefs[0],
        newPerspectiveOffered: pattern.newPerspectives[0]
      };
    } catch (error: any) {
      logger.error('生成深层引导对话失败', { error });
      return {
        content: '',
        dialogueStage: 'none'
      };
    }
  }

  /**
   * 提议成长挑战
   */
  async proposeGrowthChallenge(
    studentId: number,
    patternId: number,
    challengeType: string
  ): Promise<any> {
    try {
      const pattern = await this.getPattern(patternId);
      if (!pattern) return null;

      // 根据模式生成挑战
      const challenge = await this.generateChallenge(pattern, challengeType);

      // 保存到数据库
      const result = await pool.query(
        `INSERT INTO student_growth_challenges
         (student_id, pattern_id, challenge_title, challenge_description,
          challenge_type, specific_actions, success_criteria)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          studentId,
          patternId,
          challenge.title,
          challenge.description,
          challengeType,
          challenge.specificActions,
          challenge.successCriteria
        ]
      );

      return result.rows[0];
    } catch (error: any) {
      logger.error('提议成长挑战失败', { error, studentId, patternId });
      return null;
    }
  }

  /**
   * 获取所有深层模式
   */
  private async getAllPatterns(): Promise<DeepPattern[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM mentor_deep_patterns ORDER BY pattern_category`
      );

      return result.rows.map(row => ({
        id: row.id,
        patternName: row.pattern_name,
        patternCategory: row.pattern_category,
        patternDescription: row.pattern_description,
        surfaceManifestations: row.surface_manifestations,
        underlyingBeliefs: row.underlying_beliefs,
        guidanceApproach: row.guidance_approach,
        reframingQuestions: row.reframing_questions,
        newPerspectives: row.new_perspectives
      }));
    } catch (error: any) {
      logger.error('获取深层模式失败', { error });
      return [];
    }
  }

  /**
   * 获取单个模式
   */
  private async getPattern(patternId: number): Promise<DeepPattern | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM mentor_deep_patterns WHERE id = $1',
        [patternId]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id,
        patternName: row.pattern_name,
        patternCategory: row.pattern_category,
        patternDescription: row.pattern_description,
        surfaceManifestations: row.surface_manifestations,
        underlyingBeliefs: row.underlying_beliefs,
        guidanceApproach: row.guidance_approach,
        reframingQuestions: row.reframing_questions,
        newPerspectives: row.new_perspectives
      };
    } catch (error: any) {
      logger.error('获取模式失败', { error, patternId });
      return null;
    }
  }

  /**
   * 记录模式检测
   */
  private async recordPatternDetection(
    studentId: number,
    patternId: number,
    confidence: number,
    manifestationExamples: string[],
    triggerSituation: string
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO student_deep_patterns
         (student_id, pattern_id, detection_confidence, manifestation_examples, trigger_situations)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (student_id, pattern_id)
         DO UPDATE SET
           detection_confidence = $3,
           manifestation_examples = student_deep_patterns.manifestation_examples || $4::jsonb,
           trigger_situations = array_append(student_deep_patterns.trigger_situations, $5),
           updated_at = NOW()`,
        [
          studentId,
          patternId,
          confidence,
          JSON.stringify(manifestationExamples),
          triggerSituation
        ]
      );
    } catch (error: any) {
      logger.error('记录模式检测失败', { error });
    }
  }

  /**
   * 获取学生模式进展
   */
  private async getStudentPatternProgress(
    studentId: number,
    patternId: number
  ): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT * FROM student_deep_patterns
         WHERE student_id = $1 AND pattern_id = $2`,
        [studentId, patternId]
      );

      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('获取学生模式进展失败', { error });
      return null;
    }
  }

  /**
   * 确定对话阶段
   */
  private determineDialogueStage(patternProgress: any): string {
    if (!patternProgress) {
      return 'identify'; // 第一次，识别阶段
    }

    if (!patternProgress.student_awareness) {
      return 'acknowledge'; // 学生还没意识到，帮助认知
    }

    if (patternProgress.guidance_sessions < 3) {
      return 'challenge'; // 挑战信念
    }

    if (patternProgress.progress_level === 'working_on') {
      return 'practice'; // 实践阶段
    }

    return 'reframe'; // 重新框架
  }

  /**
   * 获取对话模板
   */
  private async getDialogueTemplate(
    patternId: number,
    dialogueStage: string,
    readinessLevel: string
  ): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT * FROM mentor_deep_dialogue_templates
         WHERE pattern_id = $1
           AND dialogue_stage = $2
           AND student_readiness_level = $3
         LIMIT 1`,
        [patternId, dialogueStage, readinessLevel]
      );

      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('获取对话模板失败', { error });
      return null;
    }
  }

  /**
   * 更新引导进展
   */
  private async updateGuidanceProgress(
    studentId: number,
    patternId: number,
    dialogueStage: string
  ): Promise<void> {
    try {
      await pool.query(
        `UPDATE student_deep_patterns
         SET guidance_sessions = guidance_sessions + 1,
             last_guided_at = NOW(),
             student_awareness = CASE
               WHEN $3 IN ('acknowledge', 'challenge', 'reframe', 'practice') THEN true
               ELSE student_awareness
             END,
             updated_at = NOW()
         WHERE student_id = $1 AND pattern_id = $2`,
        [studentId, patternId, dialogueStage]
      );
    } catch (error: any) {
      logger.error('更新引导进展失败', { error });
    }
  }

  /**
   * 生成挑战任务
   */
  private async generateChallenge(pattern: DeepPattern, challengeType: string): Promise<any> {
    // 根据模式和类型生成具体的挑战
    const challenges: any = {
      fear_of_unknown: {
        title: '尝试学习一个新东西',
        description: '选择一个你觉得"不会"的小技能，花10分钟尝试',
        specificActions: [
          '选择一个具体的小技能（如看懂一行代码）',
          '给自己10分钟时间',
          '不要求"学会"，只要求"尝试"',
          '记录你的感受'
        ],
        successCriteria: '完成10分钟的尝试，不管结果如何'
      },
      perfectionism_procrastination: {
        title: '不完美地开始',
        description: '选择一个你一直拖延的任务，不求完美地开始做',
        specificActions: [
          '选择一个拖延的任务',
          '给自己10分钟，随便做点什么',
          '不要求质量，只要求"动起来"',
          '观察开始后的感觉'
        ],
        successCriteria: '开始了，不管做得怎么样'
      },
      need_for_control: {
        title: '小范围放手',
        description: '选择一个不那么关键的部分，完全交给队友做',
        specificActions: [
          '选择一个"不那么关键"的部分',
          '完全交给队友做',
          '只在他们主动问你的时候才给建议',
          '做完后，先肯定他们的努力'
        ],
        successCriteria: '让队友独立完成，你没有过度干预'
      }
    };

    return challenges[pattern.patternName] || {
      title: '尝试新的方式',
      description: '尝试用新的方式应对这个模式',
      specificActions: ['观察自己的反应', '尝试不同的做法', '记录变化'],
      successCriteria: '完成尝试'
    };
  }

  /**
   * 获取学生的所有深层模式
   */
  async getStudentPatterns(studentId: number): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM student_deep_pattern_overview
         WHERE student_id = $1
         ORDER BY first_detected_at DESC`,
        [studentId]
      );

      return result.rows;
    } catch (error: any) {
      logger.error('获取学生模式失败', { error, studentId });
      return [];
    }
  }
}

export const deepGuidanceService = new DeepGuidanceService();
