"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pblAgentService = exports.PBLAgentService = void 0;
const database_1 = require("../config/database");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const anthropic = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
// 苏格拉底式PBL导师Agent服务
class PBLAgentService {
    // ============================================
    // 1. 项目初始化
    // ============================================
    async initializeProject(userId, initialProblem) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 使用AI分析用户的初始问题
            const analysis = await this.analyzeInitialProblem(initialProblem);
            // 创建项目
            const projectResult = await client.query(`INSERT INTO pbl_projects (
          user_id, title, description, initial_problem, domain,
          learning_goals, deliverables, success_criteria
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`, [
                userId,
                analysis.title,
                analysis.description,
                initialProblem,
                analysis.domain,
                analysis.learning_goals,
                analysis.deliverables,
                analysis.success_criteria
            ]);
            const project = projectResult.rows[0];
            // 生成苏格拉底式开场问题
            const openingQuestions = await this.generateOpeningQuestions(project);
            // 记录对话
            await client.query(`INSERT INTO pbl_socratic_dialogues (
          project_id, role, content, dialogue_type, socratic_technique
        ) VALUES ($1, 'agent', $2, 'question', 'clarifying')`, [project.id, openingQuestions]);
            await client.query('COMMIT');
            return {
                project,
                opening_questions: openingQuestions
            };
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    // 分析用户的初始问题
    async analyzeInitialProblem(problem) {
        const prompt = `作为一个苏格拉底式PBL导师，分析用户提出的工作问题，提取关键信息。

用户问题：${problem}

请以JSON格式返回：
{
  "title": "项目标题（简短）",
  "description": "项目描述",
  "domain": "领域（AI/数据分析/产品设计/工程等）",
  "learning_goals": ["学习目标1", "学习目标2"],
  "deliverables": ["交付物1", "交付物2"],
  "success_criteria": ["成功标准1", "成功标准2"]
}`;
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }]
        });
        const content = message.content[0];
        if (content.type === 'text') {
            return JSON.parse(content.text);
        }
        throw new Error('Unexpected response format');
    }
    // 生成开场问题
    async generateOpeningQuestions(project) {
        const prompt = `作为苏格拉底式导师，用户想做这个项目：

问题：${project.initial_problem}
领域：${project.domain}

请生成3-5个苏格拉底式问题，引导用户：
1. 澄清核心目标
2. 思考真实需求
3. 评估现有能力
4. 设想最小可行方案

要求：
- 不要直接给答案
- 用开放式问题
- 引导用户自己思考
- 语气友好、鼓励性

请直接返回问题列表，每个问题一行。`;
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
        });
        const content = message.content[0];
        return content.type === 'text' ? content.text : '';
    }
    // ============================================
    // 2. 苏格拉底式对话
    // ============================================
    async conductSocraticDialogue(projectId, userMessage, context) {
        const client = await database_1.pool.connect();
        try {
            // 获取项目信息
            const project = await this.getProject(projectId);
            // 获取对话历史
            const dialogueHistory = await this.getDialogueHistory(projectId, 20);
            // 获取Agent记忆
            const memory = await this.getAgentMemory(project.user_id, projectId);
            // 记录用户消息
            await client.query(`INSERT INTO pbl_socratic_dialogues (
          project_id, role, content, dialogue_type
        ) VALUES ($1, 'user', $2, 'answer')`, [projectId, userMessage]);
            // 判断用户是否卡壳
            const isStuck = await this.detectIfStuck(userMessage, dialogueHistory);
            // 生成Agent响应
            const response = await this.generateSocraticResponse(project, userMessage, dialogueHistory, memory, isStuck);
            // 记录Agent响应
            await client.query(`INSERT INTO pbl_socratic_dialogues (
          project_id, role, content, dialogue_type, socratic_technique
        ) VALUES ($1, 'agent', $2, $3, $4)`, [projectId, response.content, response.type, response.technique]);
            // 更新记忆
            await this.updateAgentMemory(project.user_id, projectId, {
                user_message: userMessage,
                agent_response: response,
                is_stuck: isStuck
            });
            return response;
        }
        finally {
            client.release();
        }
    }
    // 检测用户是否卡壳
    async detectIfStuck(userMessage, history) {
        const stuckIndicators = [
            '不知道', '不清楚', '不确定', '不会', '怎么办',
            '卡住了', '困惑', '迷茫', '不懂', '求助'
        ];
        return stuckIndicators.some(indicator => userMessage.includes(indicator));
    }
    // 生成苏格拉底式响应
    async generateSocraticResponse(project, userMessage, history, memory, isStuck) {
        const systemPrompt = `你是一个苏格拉底式PBL导师Agent。你的角色是：

核心原则：
1. 永远不要直接给答案，而是通过提问引导用户自己思考
2. 当用户卡壳时，提供"最小可行方案"的提示，但仍然用问题形式
3. 鼓励用户自主拆解任务
4. 关注用户的思考过程，而非结果
5. 保持友好、鼓励的语气

苏格拉底式技巧：
- 澄清问题（clarifying）：帮助用户明确目标
- 探究推理（probing）：挖掘用户的思考过程
- 挑战假设（assumption）：质疑用户的前提
- 探讨影响（implication）：讨论后果
- 转换视角（viewpoint）：从不同角度看问题

当前项目：
- 问题：${project.initial_problem}
- 领域：${project.domain}
- 状态：${project.status}
- 进度：${project.progress_percentage}%

用户状态：
- 是否卡壳：${isStuck ? '是' : '否'}

${isStuck ? `
用户卡壳了！你需要：
1. 先用问题帮助用户理清思路
2. 如果用户仍然困难，提供一个"最小可行方案"的提示
3. 提示应该是具体的、可操作的，但不要完整的解决方案
4. 继续用问题引导用户思考如何实现
` : ''}

请根据对话历史和用户最新消息，生成你的响应。`;
        const conversationHistory = history.map(d => ({
            role: d.role === 'user' ? 'user' : 'assistant',
            content: d.content
        }));
        conversationHistory.push({
            role: 'user',
            content: userMessage
        });
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            system: systemPrompt,
            messages: conversationHistory
        });
        const content = message.content[0];
        const responseText = content.type === 'text' ? content.text : '';
        // 分析响应类型和技巧
        const analysis = this.analyzeResponseType(responseText, isStuck);
        return {
            content: responseText,
            type: analysis.type,
            technique: analysis.technique
        };
    }
    // 分析响应类型
    analyzeResponseType(response, isStuck) {
        if (response.includes('?')) {
            if (response.includes('为什么') || response.includes('怎么')) {
                return { type: 'question', technique: 'probing' };
            }
            if (response.includes('如果') || response.includes('假设')) {
                return { type: 'question', technique: 'assumption' };
            }
            return { type: 'question', technique: 'clarifying' };
        }
        if (isStuck && (response.includes('可以') || response.includes('试试'))) {
            return { type: 'hint', technique: 'probing' };
        }
        return { type: 'challenge', technique: 'implication' };
    }
    // ============================================
    // 3. 任务拆解引导
    // ============================================
    async guideTaskDecomposition(projectId, taskTitle) {
        const client = await database_1.pool.connect();
        try {
            // 创建任务
            const taskResult = await client.query(`INSERT INTO pbl_task_decompositions (
          project_id, title, level
        ) VALUES ($1, $2, 1)
        RETURNING *`, [projectId, taskTitle]);
            const task = taskResult.rows[0];
            // 生成拆解引导问题
            const questions = await this.generateDecompositionQuestions(task);
            return {
                task,
                guiding_questions: questions
            };
        }
        finally {
            client.release();
        }
    }
    // 生成任务拆解引导问题
    async generateDecompositionQuestions(task) {
        const prompt = `用户想要完成这个任务：${task.title}

作为苏格拉底式导师，生成3-5个问题，引导用户自己拆解任务：

1. 引导用户识别子任务
2. 引导用户评估难度
3. 引导用户确定优先级
4. 引导用户思考依赖关系

要求：
- 用开放式问题
- 不要直接告诉用户怎么拆解
- 引导用户自己思考

请直接返回问题列表。`;
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
        });
        const content = message.content[0];
        return content.type === 'text' ? content.text : '';
    }
    // 评估任务拆解质量
    async evaluateDecomposition(taskId, subtasks) {
        const client = await database_1.pool.connect();
        try {
            const task = await client.query('SELECT * FROM pbl_task_decompositions WHERE id = $1', [taskId]);
            const evaluation = await this.analyzeDecompositionQuality(task.rows[0], subtasks);
            // 更新任务
            await client.query(`UPDATE pbl_task_decompositions
         SET agent_feedback = $1, is_well_decomposed = $2, suggested_improvements = $3
         WHERE id = $4`, [
                evaluation.feedback,
                evaluation.is_good,
                evaluation.improvements,
                taskId
            ]);
            return evaluation;
        }
        finally {
            client.release();
        }
    }
    // 分析拆解质量
    async analyzeDecompositionQuality(task, subtasks) {
        const prompt = `评估用户的任务拆解质量：

原任务：${task.title}

用户拆解的子任务：
${subtasks.map((st, i) => `${i + 1}. ${st}`).join('\n')}

请评估：
1. 拆解是否合理（粒度、完整性、可执行性）
2. 是否有遗漏
3. 是否有冗余
4. 优先级是否合理

以JSON格式返回：
{
  "is_good": true/false,
  "feedback": "正面反馈（用苏格拉底式问题）",
  "improvements": "改进建议（如果需要）"
}`;
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }]
        });
        const content = message.content[0];
        if (content.type === 'text') {
            return JSON.parse(content.text);
        }
        throw new Error('Unexpected response format');
    }
    // ============================================
    // 4. 最小可行方案（MVP）
    // ============================================
    async suggestMVPSolution(taskId, userContext) {
        const client = await database_1.pool.connect();
        try {
            const task = await client.query(`SELECT t.*, p.domain, p.initial_problem
         FROM pbl_task_decompositions t
         JOIN pbl_projects p ON t.project_id = p.id
         WHERE t.id = $1`, [taskId]);
            const mvp = await this.generateMVPSolution(task.rows[0], userContext);
            // 保存MVP方案
            const result = await client.query(`INSERT INTO pbl_mvp_solutions (
          project_id, task_id, title, description, solution_type,
          implementation_steps, code_snippets, tools_required, estimated_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`, [
                task.rows[0].project_id,
                taskId,
                mvp.title,
                mvp.description,
                mvp.solution_type,
                mvp.implementation_steps,
                mvp.code_snippets,
                mvp.tools_required,
                mvp.estimated_time
            ]);
            return result.rows[0];
        }
        finally {
            client.release();
        }
    }
    // 生成MVP方案
    async generateMVPSolution(task, userContext) {
        const prompt = `用户在做这个任务：${task.title}
项目领域：${task.domain}
用户当前情况：${userContext}

作为PBL导师，提供一个"最小可行方案"（MVP）：

要求：
1. 方案要简单、可快速实现（1-2小时内）
2. 能够验证核心想法
3. 提供具体的实现步骤
4. 如果需要代码，提供代码片段
5. 推荐具体的工具

以JSON格式返回：
{
  "title": "方案标题",
  "description": "方案描述",
  "solution_type": "code/tool/workflow",
  "implementation_steps": ["步骤1", "步骤2"],
  "code_snippets": [{"language": "python", "code": "..."}],
  "tools_required": ["工具1", "工具2"],
  "estimated_time": 60
}`;
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 3000,
            messages: [{ role: 'user', content: prompt }]
        });
        const content = message.content[0];
        if (content.type === 'text') {
            return JSON.parse(content.text);
        }
        throw new Error('Unexpected response format');
    }
    // ============================================
    // 5. 代码执行
    // ============================================
    async executeCode(projectId, language, code, taskId) {
        const client = await database_1.pool.connect();
        try {
            // 这里需要集成代码执行环境（如Docker、E2B等）
            // 暂时返回模拟结果
            const result = {
                status: 'success',
                output: '代码执行成功（需要集成实际执行环境）',
                execution_time: 100
            };
            // 记录执行
            await client.query(`INSERT INTO pbl_code_executions (
          project_id, task_id, language, code, status, output, execution_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [projectId, taskId, language, code, result.status, result.output, result.execution_time]);
            return result;
        }
        finally {
            client.release();
        }
    }
    // ============================================
    // 6. 反思引导
    // ============================================
    async guideReflection(projectId, reflectionType) {
        const questions = await this.generateReflectionQuestions(projectId, reflectionType);
        return questions;
    }
    // 生成反思问题
    async generateReflectionQuestions(projectId, reflectionType) {
        const project = await this.getProject(projectId);
        const prompt = `项目：${project.title}
当前进度：${project.progress_percentage}%
反思类型：${reflectionType}

生成5个深度反思问题，引导用户：
1. 回顾学到的东西
2. 分析有效和无效的方法
3. 识别意外发现
4. 规划下一步

请直接返回问题列表。`;
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
        });
        const content = message.content[0];
        return content.type === 'text' ? content.text : '';
    }
    // 保存反思日志
    async saveReflectionLog(projectId, phaseId, reflection) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`INSERT INTO pbl_reflection_logs (
          project_id, phase_id, reflection_type,
          what_learned, what_worked, what_didnt_work,
          what_surprised, next_steps, emotional_state
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`, [
                projectId,
                phaseId,
                reflection.reflection_type,
                reflection.what_learned,
                reflection.what_worked,
                reflection.what_didnt_work,
                reflection.what_surprised,
                reflection.next_steps,
                reflection.emotional_state
            ]);
            return result.rows[0];
        }
        finally {
            client.release();
        }
    }
    // ============================================
    // 7. Agent记忆管理
    // ============================================
    async getAgentMemory(userId, projectId) {
        const client = await database_1.pool.connect();
        try {
            const query = projectId
                ? 'SELECT * FROM pbl_agent_memory WHERE user_id = $1 AND (project_id = $2 OR project_id IS NULL) ORDER BY importance DESC, last_accessed_at DESC LIMIT 20'
                : 'SELECT * FROM pbl_agent_memory WHERE user_id = $1 AND project_id IS NULL ORDER BY importance DESC LIMIT 10';
            const params = projectId ? [userId, projectId] : [userId];
            const result = await client.query(query, params);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    async updateAgentMemory(userId, projectId, observation) {
        const client = await database_1.pool.connect();
        try {
            // 提取关键记忆
            const memories = this.extractMemories(observation);
            for (const memory of memories) {
                await client.query(`INSERT INTO pbl_agent_memory (
            user_id, project_id, memory_type, key, value, importance, source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (user_id, key) DO UPDATE
          SET value = $5, access_count = pbl_agent_memory.access_count + 1,
              last_accessed_at = NOW(), updated_at = NOW()`, [
                    userId,
                    projectId,
                    memory.type,
                    memory.key,
                    memory.value,
                    memory.importance,
                    'observation'
                ]);
            }
        }
        finally {
            client.release();
        }
    }
    extractMemories(observation) {
        const memories = [];
        // 提取学习风格
        if (observation.is_stuck) {
            memories.push({
                type: 'learning_style',
                key: 'needs_more_guidance',
                value: { count: 1, context: observation.user_message },
                importance: 5
            });
        }
        // 提取技能水平
        // ... 更多记忆提取逻辑
        return memories;
    }
    // ============================================
    // 辅助方法
    // ============================================
    async getProject(projectId) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query('SELECT * FROM pbl_projects WHERE id = $1', [projectId]);
            return result.rows[0];
        }
        finally {
            client.release();
        }
    }
    async getDialogueHistory(projectId, limit = 20) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`SELECT * FROM pbl_socratic_dialogues
         WHERE project_id = $1
         ORDER BY created_at DESC
         LIMIT $2`, [projectId, limit]);
            return result.rows.reverse();
        }
        finally {
            client.release();
        }
    }
}
exports.PBLAgentService = PBLAgentService;
exports.pblAgentService = new PBLAgentService();
//# sourceMappingURL=pblAgentService.js.map