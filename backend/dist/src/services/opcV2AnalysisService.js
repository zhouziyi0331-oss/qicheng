"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const database_1 = require("../config/database");
const config_1 = require("../../config");
const anthropic = new sdk_1.default({
    apiKey: config_1.config.anthropicApiKey
});
class OPCv2AnalysisService {
    /**
     * 开始新的测试
     */
    async startAssessment(userId) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`INSERT INTO opc_v2_assessments (student_id, status)
         VALUES ($1, 'in_progress')
         RETURNING id`, [userId]);
            return result.rows[0].id;
        }
        finally {
            client.release();
        }
    }
    /**
     * 提交答案
     */
    async submitAnswer(assessmentId, questionId, questionType, answerData) {
        const client = await database_1.pool.connect();
        try {
            await client.query(`INSERT INTO opc_v2_answers (assessment_id, question_id, answer_text, selected_option)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (assessment_id, question_id)
         DO UPDATE SET answer_text = $3, selected_option = $4, answered_at = NOW()`, [assessmentId, questionId, answerData.answerText, answerData.selectedOption]);
            // 简化：不再基于question_type更新进度
        }
        finally {
            client.release();
        }
    }
    /**
     * 完成测试并生成分析报告
     */
    async completeAssessment(assessmentId) {
        const client = await database_1.pool.connect();
        try {
            // 获取所有答案
            const answersResult = await client.query(`SELECT question_id, question_type, answer_text, selected_option
         FROM opc_v2_answers
         WHERE assessment_id = $1
         ORDER BY answered_at`, [assessmentId]);
            const answers = answersResult.rows;
            // 分离前置题和选择题
            const preAnswers = answers
                .filter(a => a.question_type === 'definition')
                .map(a => ({ questionId: a.question_id, answerText: a.answer_text }));
            const choiceAnswers = answers
                .filter(a => a.question_type === 'choice')
                .map(a => ({ questionId: a.question_id, selectedOption: a.selected_option }));
            // 调用AI分析
            const analysisResult = await this.analyzeWithAI(preAnswers, choiceAnswers);
            // 获取用户ID
            const assessmentResult = await client.query(`SELECT student_id FROM opc_v2_assessments WHERE id = $1`, [assessmentId]);
            const userId = assessmentResult.rows[0].student_id;
            // 保存结果到数据库
            await this.saveResult(assessmentId, userId, analysisResult);
            // 更新测试状态
            await client.query(`UPDATE opc_v2_assessments
         SET status = 'completed', completed_at = NOW()
         WHERE id = $1`, [assessmentId]);
            return analysisResult;
        }
        finally {
            client.release();
        }
    }
    /**
     * 使用Claude AI分析测试结果
     */
    async analyzeWithAI(preAnswers, choiceAnswers) {
        // 构建分析提示词
        const prompt = this.buildAnalysisPrompt(preAnswers, choiceAnswers);
        // 调用Claude API
        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            temperature: 0.7,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });
        // 解析AI返回的JSON
        const content = message.content[0];
        if (content.type !== 'text') {
            throw new Error('AI返回格式错误');
        }
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('AI返回内容无法解析');
        }
        const result = JSON.parse(jsonMatch[0]);
        return result;
    }
    /**
     * 构建AI分析提示词
     */
    buildAnalysisPrompt(preAnswers, choiceAnswers) {
        // 提取前置题答案
        const q1Answer = preAnswers.find(a => a.questionId === 'q1')?.answerText || '';
        const q2Answer = preAnswers.find(a => a.questionId === 'q2')?.answerText || '';
        // 统计选择题答案分布
        const dimensionScores = this.calculateDimensionScores(choiceAnswers);
        return `你是启程平台的AI画像分析师。请基于学生的测试答案，生成一份深度的能力画像报告。

# 学生的前置定义题答案

**问题1：用三个词描述"你眼中的自己"**
答案：${q1Answer}

**问题2：写一件你觉得自己做得很厉害的事**
答案：${q2Answer}

# 学生的36道选择题答案

六个维度的原始分数（基于选项统计）：
- 开放性 (Openness): ${dimensionScores.openness}/100
- 坚持性 (Persistence): ${dimensionScores.persistence}/100
- 创造力 (Creativity): ${dimensionScores.creativity}/100
- 学习力 (Learning): ${dimensionScores.learning}/100
- 协作力 (Collaboration): ${dimensionScores.collaboration}/100
- 抗压力 (Resilience): ${dimensionScores.resilience}/100

选择题详细答案：
${choiceAnswers.map(a => `${a.questionId}: ${a.selectedOption}`).join('\n')}

# 你的任务

请生成一份JSON格式的分析报告，包含以下内容：

1. **六维能力分数和描述**：基于选择题答案，给出每个维度的分数（0-100）和具体描述（100-150字）
2. **人格标签**：提取2-3个最突出的人格特质标签，每个标签包含名称、描述和颜色
3. **自我认知对比**：
   - 提取用户在问题1中写的三个词
   - 基于问题2的描述，分析用户的真实能力特点
   - 指出用户自我认知与实际能力的差距（可能高估、低估或准确）
4. **赛道推荐**：推荐最适合的赛道（AI内容创作/AI工具开发），给出匹配分数和理由，并建议首单类型

# 重要原则

1. **个性化**：每个学生的报告必须完全不同，避免模板化
2. **具体化**：描述要具体，引用用户的原话和具体行为
3. **真实性**：基于真实答案分析，不要编造
4. **建设性**：指出优势和成长空间，语气积极

# 输出格式

请严格按照以下JSON格式输出：

\`\`\`json
{
  "abilityScores": [
    {
      "dimension": "开放性",
      "score": 85,
      "description": "你对新事物充满好奇..."
    },
    {
      "dimension": "坚持性",
      "score": 72,
      "description": "你在面对困难时..."
    },
    {
      "dimension": "创造力",
      "score": 90,
      "description": "你的创意思维..."
    },
    {
      "dimension": "学习力",
      "score": 78,
      "description": "你的学习速度..."
    },
    {
      "dimension": "协作力",
      "score": 65,
      "description": "你在团队中..."
    },
    {
      "dimension": "抗压力",
      "score": 70,
      "description": "你应对压力的方式..."
    }
  ],
  "personalityTags": [
    {
      "name": "视觉叙事者",
      "description": "你擅长用画面讲故事，能看到各个元素之间的联系",
      "color": "#8B5CF6"
    },
    {
      "name": "探索整合者",
      "description": "你喜欢快速掌握新工具，并把不同的东西组合创造新价值",
      "color": "#EC4899"
    }
  ],
  "selfPerception": {
    "userWords": ["好奇", "拆解", "创造"],
    "aiAnalysis": "从你描述的'厉害的事'中，我看到你确实具备强大的拆解能力和创造力。你在[具体事例]中展现的[具体能力]印证了你对自己的认知。",
    "gap": "你对自己的'好奇'特质认知准确，但可能低估了自己的'坚持性'。从你完成[具体事例]的过程来看，你的毅力比你想象的更强。"
  },
  "trackRecommendation": {
    "track": "AI内容创作",
    "matchScore": 88,
    "reason": "你的高创造力（90分）和开放性（85分）非常适合内容创作赛道。你在问题2中提到的[具体经历]显示你擅长[具体能力]，这正是内容创作需要的核心能力。",
    "firstTaskSuggestion": "建议从'小红书AI图文内容制作'开始。这类任务能发挥你的视觉叙事能力，同时周期短（1-2天），适合快速建立信心。"
  }
}
\`\`\`

请现在开始分析，只输出JSON，不要有其他内容。`;
    }
    /**
     * 计算六维度分数（基于选择题答案）
     */
    calculateDimensionScores(choiceAnswers) {
        // 选项分数映射：A=100, B=66, C=33, D=0
        const optionScores = {
            A: 100,
            B: 66,
            C: 33,
            D: 0
        };
        // 维度题目映射（每个维度6题）
        const dimensionQuestions = {
            openness: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'],
            persistence: ['c7', 'c8', 'c9', 'c10', 'c11', 'c12'],
            creativity: ['c13', 'c14', 'c15', 'c16', 'c17', 'c18'],
            learning: ['c19', 'c20', 'c21', 'c22', 'c23', 'c24'],
            collaboration: ['c25', 'c26', 'c27', 'c28', 'c29', 'c30'],
            resilience: ['c31', 'c32', 'c33', 'c34', 'c35', 'c36']
        };
        const scores = {};
        for (const [dimension, questions] of Object.entries(dimensionQuestions)) {
            const dimensionAnswers = choiceAnswers.filter(a => questions.includes(a.questionId));
            const totalScore = dimensionAnswers.reduce((sum, a) => {
                return sum + (optionScores[a.selectedOption] || 0);
            }, 0);
            scores[dimension] = Math.round(totalScore / questions.length);
        }
        return scores;
    }
    /**
     * 保存分析结果到数据库
     */
    async saveResult(assessmentId, userId, result) {
        const client = await database_1.pool.connect();
        try {
            await client.query(`INSERT INTO opc_v2_results (
          assessment_id, student_id,
          openness_score, persistence_score, creativity_score,
          learning_score, collaboration_score, resilience_score,
          openness_description, persistence_description, creativity_description,
          learning_description, collaboration_description, resilience_description,
          personality_tags,
          self_perception_words, ai_analysis, perception_gap,
          recommended_track, track_match_score, track_reason, first_task_suggestion,
          full_analysis
        ) VALUES (
          $1, $2,
          $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15,
          $16, $17, $18,
          $19, $20, $21, $22,
          $23
        )`, [
                assessmentId,
                userId,
                result.abilityScores[0].score,
                result.abilityScores[1].score,
                result.abilityScores[2].score,
                result.abilityScores[3].score,
                result.abilityScores[4].score,
                result.abilityScores[5].score,
                result.abilityScores[0].description,
                result.abilityScores[1].description,
                result.abilityScores[2].description,
                result.abilityScores[3].description,
                result.abilityScores[4].description,
                result.abilityScores[5].description,
                JSON.stringify(result.personalityTags),
                result.selfPerception.userWords,
                result.selfPerception.aiAnalysis,
                result.selfPerception.gap,
                result.trackRecommendation.track,
                result.trackRecommendation.match_score,
                result.trackRecommendation.reason,
                result.trackRecommendation.firstTaskSuggestion,
                JSON.stringify(result)
            ]);
            // 更新用户的最新OPC结果引用
            const resultIdResult = await client.query(`SELECT id FROM opc_v2_results WHERE assessment_id = $1`, [assessmentId]);
            const resultId = resultIdResult.rows[0].id;
            await client.query(`UPDATE users SET latest_opc_v2_result_id = $1 WHERE id = $2`, [resultId, userId]);
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取测试结果
     */
    async getResult(assessmentId) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`SELECT * FROM opc_v2_results WHERE assessment_id = $1`, [assessmentId]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            return {
                abilityScores: [
                    { dimension: '开放性', score: row.openness_score, description: row.openness_description },
                    { dimension: '坚持性', score: row.persistence_score, description: row.persistence_description },
                    { dimension: '创造力', score: row.creativity_score, description: row.creativity_description },
                    { dimension: '学习力', score: row.learning_score, description: row.learning_description },
                    { dimension: '协作力', score: row.collaboration_score, description: row.collaboration_description },
                    { dimension: '抗压力', score: row.resilience_score, description: row.resilience_description }
                ],
                personalityTags: row.personality_tags,
                selfPerception: {
                    userWords: row.self_perception_words,
                    aiAnalysis: row.ai_analysis,
                    gap: row.perception_gap
                },
                trackRecommendation: {
                    track: row.recommended_track,
                    match_score: row.track_match_score,
                    reason: row.track_reason,
                    firstTaskSuggestion: row.first_task_suggestion
                }
            };
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取用户最新的OPC结果
     */
    async getLatestResult(userId) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`SELECT r.* FROM opc_v2_results r
         JOIN opc_v2_assessments a ON r.assessment_id = a.id
         WHERE a.student_id = $1 AND a.status = 'completed'
         ORDER BY a.completed_at DESC
         LIMIT 1`, [userId]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            return {
                abilityScores: [
                    { dimension: '开放性', score: row.openness_score, description: row.openness_description },
                    { dimension: '坚持性', score: row.persistence_score, description: row.persistence_description },
                    { dimension: '创造力', score: row.creativity_score, description: row.creativity_description },
                    { dimension: '学习力', score: row.learning_score, description: row.learning_description },
                    { dimension: '协作力', score: row.collaboration_score, description: row.collaboration_description },
                    { dimension: '抗压力', score: row.resilience_score, description: row.resilience_description }
                ],
                personalityTags: row.personality_tags,
                selfPerception: {
                    userWords: row.self_perception_words,
                    aiAnalysis: row.ai_analysis,
                    gap: row.perception_gap
                },
                trackRecommendation: {
                    track: row.recommended_track,
                    match_score: row.track_match_score,
                    reason: row.track_reason,
                    firstTaskSuggestion: row.first_task_suggestion
                }
            };
        }
        finally {
            client.release();
        }
    }
}
exports.default = new OPCv2AnalysisService();
//# sourceMappingURL=opcV2AnalysisService.js.map